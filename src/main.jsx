import React, { StrictMode, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const pieces = { p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚', P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔' }
const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

function App() {
  const [room, setRoom] = useState('')
  const [name, setName] = useState('Player')
  const [joined, setJoined] = useState(false)
  const [board, setBoard] = useState([])
  const [turn, setTurn] = useState('white')
  const [color, setColor] = useState(null)
  const [selected, setSelected] = useState(null)
  const [legal, setLegal] = useState([])
  const [moves, setMoves] = useState([])
  const [message, setMessage] = useState('Create a room or join a friend.')
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [playerId] = useState(() => {
    const stored = window.sessionStorage.getItem('checkmate-player-id')
    const value = stored || crypto.randomUUID()
    window.sessionStorage.setItem('checkmate-player-id', value)
    return value
  })

  const send = (payload) => socket?.readyState === WebSocket.OPEN && socket.send(JSON.stringify(payload))

  const connectToRoom = (roomCode) => {
    if (!roomCode.trim() || !name.trim()) return
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    setRoom(roomCode.trim().toUpperCase())
    const ws = new WebSocket(`${wsProtocol}://${window.location.host}/ws/${encodeURIComponent(roomCode.trim().toUpperCase())}`)
    ws.onopen = () => {
      setConnected(true)
      ws.send(JSON.stringify({ type: 'join', name: name.trim(), player_id: playerId }))
      setJoined(true)
    }
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'state') {
        setBoard(data.board)
        setTurn(data.turn)
        setColor(data.color)
        setMoves(data.moves)
        setMessage(data.message)
      }
      if (data.type === 'legal') setLegal(data.squares)
      if (data.type === 'error') setMessage(data.message)
    }
    ws.onclose = () => { setConnected(false); setMessage('Connection closed. Start another game to reconnect.') }
    setSocket(ws)
  }

  const createRoom = () => {
    const code = `MATE-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    connectToRoom(code)
  }

  const joinGame = () => connectToRoom(room)

  useEffect(() => () => socket?.close(), [socket])

  const selectSquare = (row, col) => {
    const square = `${files[col]}${8 - row}`
    if (!joined || turn !== color) return
    if (selected && legal.includes(square)) {
      send({ type: 'move', from: selected, to: square })
      setSelected(null)
      setLegal([])
      return
    }
    const piece = board[row]?.[col]
    if (!piece || (color === 'white' && piece !== piece.toUpperCase()) || (color === 'black' && piece !== piece.toLowerCase())) {
      setSelected(null)
      setLegal([])
      return
    }
    setSelected(square)
    send({ type: 'legal_moves', square })
  }

  useEffect(() => {
    const listener = (event) => event.key === 'Enter' && !joined && room.trim() && joinGame()
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  })

  const status = useMemo(() => {
    if (!joined) return 'Waiting room'
    if (!connected) return 'Offline'
    return turn === color ? 'Your turn' : "Opponent's turn"
  }, [joined, connected, turn, color])

  return (
    <main className="chess-app">
      <header className="topbar">
        <div className="brand"><span className="brand-knight">♞</span><span>CHECKMATE</span></div>
        <div className="connection"><i className={connected ? 'online' : ''} /> {connected ? 'Live multiplayer' : 'Not connected'}</div>
      </header>
      {!joined ? (
        <section className="lobby">
          <div className="lobby-copy"><span className="eyebrow">REAL-TIME CHESS / 01</span><h1>Think ahead.<br /><em>Play together.</em></h1><p>A clean, competitive chess room powered by FastAPI WebSockets. Create a room and share its code, or join a room someone has already created.</p><div className="feature-row"><span>♟ Legal moves</span><span>◉ Live sync</span><span>⌁ No accounts</span></div></div>
          <div className="join-card"><div className="mini-board">{Array.from({ length: 16 }, (_, i) => <span className={i % 2 ? 'dark' : ''} key={i}>{i === 1 ? '♞' : i === 14 ? '♙' : ''}</span>)}</div><h2>Enter the board</h2><label>Your name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex" /></label><button className="primary create-room" onClick={createRoom}>Create a room <span>✦</span></button><div className="join-divider"><span>or join an existing room</span></div><label>Room code<input value={room} onChange={(e) => setRoom(e.target.value.toUpperCase())} placeholder="e.g. MATE-AB12" /></label><button className="secondary" disabled={!room.trim()} onClick={joinGame}>Join room <span>↗</span></button><small>Create a room first, then send its code to your opponent.</small></div>
        </section>
      ) : (
        <section className="game-layout">
          <div className="game-header"><div><span className="eyebrow">ROOM / {room}</span><h1>Good luck, {name}.</h1></div><button className="ghost" onClick={() => { socket?.close(); setJoined(false); setBoard([]); setMoves([]) }}>Leave room</button></div>
          <div className="play-area">
            <div className="board-wrap"><div className="player-bar"><span className="avatar dark-avatar">{color === 'black' ? 'OP' : 'YOU'}</span><strong>{color === 'black' ? 'Opponent' : name}</strong><span className={turn === color ? 'turn-dot' : ''}>{turn === color ? 'Thinking time' : 'Waiting'}</span></div>            <div className={`board ${color === 'black' ? 'black-view' : ''}`}>{board.map((row, r) => row.map((piece, c) => { const square = `${files[c]}${8 - r}`; return <button key={square} className={`square ${(r + c) % 2 ? 'dark-square' : 'light-square'} ${selected === square ? 'selected' : ''} ${legal.includes(square) ? 'legal' : ''}`} onClick={() => selectSquare(r, c)}>{piece && <span className={piece === piece.toUpperCase() ? 'white-piece' : 'black-piece'}>{pieces[piece]}</span>}{c === 0 && <i className="rank">{8 - r}</i>}{r === 7 && <i className="file">{files[c]}</i>}</button> }))}</div><div className="player-bar bottom-bar"><span className="avatar light-avatar">{color === 'white' ? 'OP' : 'YOU'}</span><strong>{color === 'white' ? 'Opponent' : name}</strong><span className={turn !== color ? 'turn-dot' : ''}>{turn !== color ? 'Thinking time' : 'Waiting'}</span></div></div>
            <aside className="game-side"><div className="game-status"><span className="eyebrow">MATCH STATUS</span><div className="status-line"><i className={turn === color ? 'your-turn' : ''} />{status}</div><p>{message}</p></div><div className="move-panel"><div className="panel-title"><span>Move history</span><b>{moves.length}</b></div><div className="moves">{moves.length ? moves.map((move, i) => <span key={`${move}-${i}`}><small>{i + 1}.</small> {move}</span>) : <em>No moves yet</em>}</div></div><div className="tip"><span>✦</span><p><strong>How to play</strong><br />Select one of your pieces, then choose a highlighted square.</p></div></aside>
          </div>
        </section>
      )}
    </main>
  )
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)
