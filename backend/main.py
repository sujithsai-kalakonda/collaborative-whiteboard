"""
FastAPI WebSocket Backend for Collaborative Whiteboard
- Handles multiple WebSocket connections
- Receives drawing data and broadcasts to all clients
"""

from fastapi import FastAPI, WebSocket
from starlette.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from backend.connections import manager
# from connections import manager
import os

app = FastAPI()

# Get absolute path of the frontend directory
frontend_path = os.path.join(os.path.dirname(__file__), "frontend")

# Mount static files
app.mount(
    "/static",
    StaticFiles(directory=os.path.join(frontend_path, "static")),
    name="static",
)


# Serve index.html
@app.get("/")
async def serve_frontend():
    return FileResponse(os.path.join(frontend_path, "index.html"))


# Webscoket route (empty for now)
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)  # Accepts a user and stores their connection.
    try:
        while True:  # Keeps the connection open indefinitely.
            data = await websocket.receive_text()  # Listens for messages from clients.
            await manager.broadcast(data)  # Sends messages to all connected users.

    except Exception as e:
        print(e)
        pass
    finally:
        manager.disconnect(websocket)  # Remove disconnected client
