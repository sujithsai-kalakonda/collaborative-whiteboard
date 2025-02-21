"""
FastAPI WebSocket Backend for Collaborative Whiteboard
- Handles multiple WebSocket connections
- Receives drawing data and broadcasts to all clients
"""

from fastapi import FastAPI, WebSocket
from connections import manager

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Server is running"}


# Webscoket route (empty for now)
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket) # Accepts a user and stores their connection.
    try:
        while True: # Keeps the connection open indefinitely.
            data = await websocket.receive_text() # Listens for messages from clients.
            await manager.broadcast(data) # Sends messages to all connected users.
    
    except Exception as e:
        print(e)
        pass
    finally:
        manager.disconnect(websocket) # Remove disconnected client