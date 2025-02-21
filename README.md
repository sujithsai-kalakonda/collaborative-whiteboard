# Collaborative Whiteboard

A real-time collaborative whiteboard application where multiple users can draw together, choose colors, adjust brush sizes, and enable dark mode.

## Features

- 🎨 **Real-time drawing** with WebSocket communication
- 🌈 **Color picker** to choose brush colors
- ✏️ **Adjustable brush size** for precision
- 🧽 **Eraser tool** for removing mistakes
- 🗑️ **Clear canvas** option
- 🌙 **Dark mode toggle** for better visibility
- 🏷️ **Floating usernames** to track user cursor positions

## Installation

### Backend (FastAPI WebSocket Server)

1. Install dependencies:

   ```bash
   pip install - requirements.txt
   ```

2. Run the WebSocket server:

   ```bash
   cd backend
   uvicorn main:app --reload
   ```

3. Open `frontend/index.html` in a browser.

4. Enter your name and start drawing.

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: FastAPI (WebSocket)
- **Communication**: WebSockets

`Note`: I will be adding more interesting and advanced features soon
