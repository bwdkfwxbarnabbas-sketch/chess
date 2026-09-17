# Self-host Checkmate

This version has no PostgreSQL dependency. The FastAPI server stores room state locally in `backend/checkmate_rooms.pkl`, including the board position, move history, and player seats. WebSocket connections are never stored.

## Windows

Install Node.js and Python 3.11+ first. From the project folder run:

```powershell
.\start-server.ps1
```

Then open `http://localhost:5173`.

To let another player on the same network join, find the host IPv4 address with `ipconfig`, start the servers with `--host 0.0.0.0`, and share:

```text
http://YOUR_LAPTOP_IP:5173
```

To publish it publicly, run `ngrok http 5173` after starting the servers. Keep the laptop awake and keep all processes running.

The room file is created automatically. Back it up if you want to preserve games, or delete it to clear all saved rooms.
