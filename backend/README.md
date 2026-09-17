# Checkmate

FastAPI WebSocket chess server with legal move validation from `python-chess`.

## Run

```powershell
cd C:\Users\BILL\Desktop\aicaptest\backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open the frontend at `http://127.0.0.1:5173/` in two browser tabs. Enter the same room code in both tabs. The first player is White and the second player is Black.

## Play with someone on the same Wi-Fi

Find your local IPv4 address:

```powershell
ipconfig
```

Start both servers on all network interfaces:

```powershell
# terminal 1, from the project root
npm run dev -- --host 0.0.0.0

# terminal 2, from backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

If your IPv4 address is `192.168.1.25`, send your opponent:

```text
http://192.168.1.25:5173/
```

They enter the same room code. The browser automatically connects the WebSocket to `192.168.1.25:8000`.

Windows Firewall may ask permission for Node/Python; allow it on **Private networks** only.

## Share publicly with ngrok

The Vite dev server proxies WebSocket traffic to FastAPI, so expose only port 5173:

```powershell
ngrok http 5173
```

Share the generated `https://...ngrok-free.app` URL. Your laptop remains the game server.

The server keeps active room state in memory. A room is removed after both players leave.
