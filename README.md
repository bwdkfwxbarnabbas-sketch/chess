# Checkmate

Checkmate is a self-hostable, real-time multiplayer chess game.

It uses:

- **React + Vite** for the chess interface
- **FastAPI** for the backend server
- **WebSockets** for live multiplayer moves
- **python-chess** for legal move validation
- **Pickle** for local room and game persistence

No PostgreSQL database is required.

## How it works

One person starts the server and shares the website address.

1. A player opens the app and clicks **Create a room**.
2. The app generates a room code.
3. The creator shares that code with another player.
4. The second player enters the code and clicks **Join room**.
5. The first player receives White.
6. The second player receives Black.
7. Moves are synchronized in real time through WebSockets.

The board automatically changes perspective for Black, so each player sees their own pieces at the bottom.

## Requirements

Install these before running the project:

- Python 3.11 or newer
- Node.js 18 or newer
- npm

## Run locally on Windows

From the project folder, run:

```powershell
.\start-server.ps1
```

This creates the Python environment if needed, installs backend dependencies, and starts both servers.

Open:

```text
http://localhost:5173
```

## Run manually

### Start the backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Start the frontend

Open another terminal:

```powershell
npm install
npm run dev -- --host 0.0.0.0
```

Then open:

```text
http://localhost:5173
```

## Play on the same Wi-Fi network

Find the server laptop's local IP address:

```powershell
ipconfig
```

Look for its IPv4 address, such as:

```text
192.168.1.25
```

Share this address with the other player:

```text
http://192.168.1.25:5173
```

Both devices must be connected to the same network. If Windows Firewall asks for access, allow Python and Node.js on **Private networks**.

## Publish the game publicly

Start both the frontend and backend, then run:

```powershell
ngrok http 5173
```

ngrok will provide a public HTTPS URL. Share that URL with the other player.

The laptop must remain:

- Powered on
- Connected to the internet
- Running the frontend
- Running the FastAPI backend
- Running ngrok

## Saved game data

Room state is stored locally in:

```text
backend/checkmate_rooms.pkl
```

The file stores:

- Room codes
- Board positions
- Move history
- Player names
- Player colors

WebSocket connections are never saved.

Rooms survive backend restarts. Delete `backend/checkmate_rooms.pkl` if you want to clear saved rooms and start fresh.

The pickle file is ignored by Git and should not be uploaded to a public repository.

## Project structure

```text
.
├── backend/
│   ├── app/
│   │   ├── main.py       FastAPI and WebSocket server
│   │   └── storage.py    Local pickle persistence
│   └── requirements.txt
├── src/
│   ├── main.jsx          React chess client
│   └── styles.css        Board and application styling
├── start-server.ps1      Windows startup script
├── vite.config.js        Frontend and WebSocket proxy
└── SELF-HOSTING.md       Additional hosting notes
```

## Troubleshooting

### The frontend does not load

Make sure Vite is running on port `5173`:

```powershell
npm run dev -- --host 0.0.0.0
```

### Players cannot connect

Make sure FastAPI is running on port `8000`:

```powershell
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### The public link stopped working

The laptop-hosted servers or ngrok process may have stopped. Restart all services and run:

```powershell
ngrok http 5173
```

Free ngrok URLs may change when the tunnel restarts.

### A room is full

Only two active players can occupy a room. Use the **Leave room** button before reconnecting, or create a new room.
