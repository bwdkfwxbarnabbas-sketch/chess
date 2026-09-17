import pickle
from pathlib import Path

import chess


STATE_PATH = Path(__file__).resolve().parents[1] / "checkmate_rooms.pkl"


def load_rooms() -> dict:
    if not STATE_PATH.exists():
        return {}
    try:
        with STATE_PATH.open("rb") as file:
            stored = pickle.load(file)
        rooms = {}
        for code, value in stored.items():
            rooms[code] = {
                "fen": value["fen"],
                "moves": value.get("moves", []),
                "players": {
                    player_id: {
                        "name": player.get("name", "Player"),
                        "color": player["color"],
                        "websocket": None,
                    }
                    for player_id, player in value.get("players", {}).items()
                },
            }
        return rooms
    except (OSError, EOFError, pickle.PickleError, KeyError, TypeError, ValueError):
        return {}


def save_rooms(rooms: dict) -> None:
    stored = {}
    for code, room in rooms.items():
        stored[code] = {
            "fen": room.board.fen(),
            "moves": list(room.moves),
            "players": {
                player_id: {"name": player["name"], "color": player["color"]}
                for player_id, player in room.players.items()
            },
        }
    temporary_path = STATE_PATH.with_suffix(".tmp")
    with temporary_path.open("wb") as file:
        pickle.dump(stored, file, protocol=pickle.HIGHEST_PROTOCOL)
    temporary_path.replace(STATE_PATH)


def board_from_fen(fen: str) -> chess.Board:
    return chess.Board(fen)
