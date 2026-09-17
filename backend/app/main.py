import asyncio
import json
from dataclasses import dataclass, field

import chess
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from .storage import board_from_fen, load_rooms, save_rooms


@dataclass
class Room:
    board: chess.Board = field(default_factory=chess.Board)
    players: dict[str, dict] = field(default_factory=dict)
    moves: list[str] = field(default_factory=list)
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)


rooms: dict[str, Room] = {}
for room_code, stored in load_rooms().items():
    rooms[room_code] = Room(
        board=board_from_fen(stored["fen"]),
        players=stored["players"],
        moves=stored["moves"],
    )
app = FastAPI(title="Checkmate API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def board_rows(board: chess.Board) -> list[list[str | None]]:
    return [[board.piece_at(chess.square(col, 7 - row)).symbol() if board.piece_at(chess.square(col, 7 - row)) else None for col in range(8)] for row in range(8)]


def state(room: Room, player_id: str, message: str = "") -> dict:
    return {
        "type": "state",
        "board": board_rows(room.board),
        "turn": "white" if room.board.turn == chess.WHITE else "black",
        "color": room.players[player_id]["color"],
        "moves": room.moves,
        "message": message or ("Checkmate!" if room.board.is_checkmate() else "Check!" if room.board.is_check() else "Game in progress."),
    }


async def broadcast(room: Room, message: str = ""):
    for player_id, player in list(room.players.items()):
        websocket = player.get("websocket")
        if websocket is None:
            continue
        try:
            await websocket.send_json(state(room, player_id, message))
        except Exception:
            if room.players.get(player_id, {}).get("websocket") is websocket:
                room.players[player_id]["websocket"] = None
    save_rooms(rooms)


@app.get("/health")
async def health():
    return {"status": "ok", "rooms": len(rooms)}


@app.websocket("/ws/{room_code}")
async def websocket_game(websocket: WebSocket, room_code: str):
    await websocket.accept()
    room = rooms.setdefault(room_code.upper(), Room())
    try:
        join = json.loads(await websocket.receive_text())
        if join.get("type") != "join":
            await websocket.close(code=1008)
            return
        player_id = join.get("player_id")
        if not player_id:
            await websocket.close(code=1008)
            return
        existing = room.players.get(player_id)
        if existing:
            old_websocket = existing.get("websocket")
            if old_websocket and old_websocket is not websocket:
                await old_websocket.close(code=4000)
            color = existing["color"]
        elif len(room.players) >= 2:
            await websocket.send_json({"type": "error", "message": "This room already has two players."})
            await websocket.close(code=1008)
            return
        else:
            used_colors = {player["color"] for player in room.players.values()}
            color = "white" if "white" not in used_colors else "black"
        room.players[player_id] = {"name": join.get("name", "Player"), "color": color, "websocket": websocket}
        save_rooms(rooms)
        await websocket.send_json(state(room, player_id, f"You are playing {color}."))
        await broadcast(room, "Opponent connected. White moves first." if len(room.players) == 2 else "Waiting for an opponent...")
        while True:
            payload = json.loads(await websocket.receive_text())
            async with room.lock:
                if payload.get("type") == "legal_moves":
                    try:
                        origin = chess.parse_square(payload["square"])
                        legal = [chess.square_name(move.to_square) for move in room.board.legal_moves if move.from_square == origin]
                        await websocket.send_json({"type": "legal", "squares": legal})
                    except ValueError:
                        await websocket.send_json({"type": "error", "message": "That square is not valid."})
                elif payload.get("type") == "move":
                    if room.players[player_id]["color"] != ("white" if room.board.turn else "black"):
                        await websocket.send_json({"type": "error", "message": "Wait for your turn."})
                        continue
                    try:
                        move = chess.Move.from_uci(f"{payload['from']}{payload['to']}")
                        if move not in room.board.legal_moves:
                            raise ValueError
                        room.moves.append(room.board.san(move))
                        room.board.push(move)
                        save_rooms(rooms)
                        await broadcast(room)
                    except (ValueError, chess.InvalidMoveError):
                        await websocket.send_json({"type": "error", "message": "That move is not legal."})
    except WebSocketDisconnect:
        if room.players.get(player_id, {}).get("websocket") is websocket:
            room.players[player_id]["websocket"] = None
        if not any(player.get("websocket") for player in room.players.values()):
            save_rooms(rooms)
        else:
            await broadcast(room, "Your opponent left the room.")
