/* 
    Collaborative Whiteboard - JavaScript File
    - Now Includes a Dedicated Username Entry Screen
    - Smooth Continuous Drawing (Fixed Circle Gaps)
*/

// Select Canvas, Context, WebSocket Connection
const canvas = document.getElementById("whiteboard");
const ctx = canvas.getContext("2d");
const ws = new WebSocket("ws://127.0.0.1:8000/ws"); // Connect to WebSocket server

// Select UI Elements
const usernameScreen = document.getElementById("usernameScreen");
const whiteboardScreen = document.getElementById("whiteboardScreen");
const usernameInput = document.getElementById("username");
const enterBoardButton = document.getElementById("enterBoard");
const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");
const eraserButton = document.getElementById("eraser");
const clearCanvasButton = document.getElementById("clearCanvas");
const darkModeToggle = document.getElementById("darkModeToggle");
const usernamesContainer = document.getElementById("usernamesContainer");

// Set Canvas Size (80% of Window Size)
canvas.width = window.innerWidth * 0.8;
canvas.height = window.innerHeight * 0.8;

// Variables for Drawing
let drawing = false;
let selectedColor = "#000000"; // Default black color
let selectedBrushSize = 4; // Default brush size
let isEraserMode = false; // Track eraser mode
let username = ""; // Store username
let activeUsers = {}; // Store active users' cursor positions
let newStroke = true; // Track new strokes

// Handle Username Entry (Show Whiteboard After Entering Name)
enterBoardButton.addEventListener("click", () => {
    username = usernameInput.value.trim();

    if (username === "") {
        alert("Please enter a name!");
        return;
    }

    // Hide Username Screen & Show Whiteboard
    usernameScreen.style.display = "none";
    whiteboardScreen.style.display = "block";
});

// Load Dark Mode Preference from Local Storage
if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-mode");
    darkModeToggle.textContent = "☀️ Light Mode";
}

// Toggle Dark Mode (Syncs Across All Screens)
darkModeToggle.addEventListener("click", () => {
    const isDarkMode = document.body.classList.toggle("dark-mode");

    // Update Button Text
    darkModeToggle.textContent = isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode";

    // Save Dark Mode state in Local Storage (for individual preference)
    localStorage.setItem("darkMode", isDarkMode ? "enabled" : "disabled");

    // Broadcast Dark Mode Change to Other Users
    ws.send(JSON.stringify({ action: "dark_mode", state: isDarkMode }));
});

// Update Color When User Selects a New One
colorPicker.addEventListener("input", (event) => {
    selectedColor = event.target.value;
    isEraserMode = false; // Disable eraser when selecting color
    eraserButton.classList.remove("active");
});

// Update Brush Size When User Adjusts Slider
brushSize.addEventListener("input", (event) => {
    selectedBrushSize = event.target.value;
});

// Toggle Eraser Mode (Now Uses True Erasing)
eraserButton.addEventListener("click", () => {
    isEraserMode = !isEraserMode;

    if (isEraserMode) {
        eraserButton.classList.add("active");
    } else {
        selectedColor = colorPicker.value; // Restore brush color
        ctx.strokeStyle = selectedColor;  // Ensure the color is set back
        eraserButton.classList.remove("active");
    }
});

// Start Drawing (Now Tracks Initial Point)
canvas.addEventListener("mousedown", (event) => {
    drawing = true;
    newStroke = true; // Mark a fresh stroke

    const x = event.clientX - canvas.offsetLeft;
    const y = event.clientY - canvas.offsetTop;

    ctx.beginPath();
    ctx.moveTo(x, y); // Start Path at Initial Point
    // ctx.lineTo(x, y);  // Ensures first click is drawn
    // ctx.stroke();

    ws.send(JSON.stringify({ x, y, color: selectedColor, size: selectedBrushSize, username, action: "draw", newStroke: true }));
});

// Stop Drawing
canvas.addEventListener("mouseup", () => {
    drawing = false;
    newStroke = true; // Reset new stroke flag
});

// Capture Mouse Movement (Even When Not Drawing)
canvas.addEventListener("mousemove", (event) => {
    const x = event.clientX - canvas.offsetLeft;
    const y = event.clientY - canvas.offsetTop;

    // Always Send Cursor Movement (Even If Not Drawing)
    ws.send(JSON.stringify({ x, y, username, action: "cursor", newStroke: true }));

    // Store and Update User's Cursor Position
    activeUsers[username] = { x, y };
    updateFloatingUsernames();

    if (drawing) {
        if (isEraserMode) {
            // Round Eraser
            ctx.globalCompositeOperation = "destination-out"; // Erase instead of drawing
            ctx.beginPath();
            ctx.arc(x, y, selectedBrushSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = "source-over"; // Reset back to normal drawing mode
            
            ws.send(JSON.stringify({ x, y, size: selectedBrushSize, action: "erase" }));
        } else {
            if (newStroke) {
                ctx.beginPath(); // Start a new stroke every move
                ctx.moveTo(x, y);
                newStroke = false; // After first move, it's not a new stroke anymore   
            }
            // Smooth Continuous Drawing
            ctx.lineTo(x, y); 
            ctx.strokeStyle = selectedColor;
            ctx.lineWidth = selectedBrushSize;
            ctx.lineCap = "round"; // Smooth edges
            ctx.lineJoin = "round"; // Ensure rounded joints
            ctx.stroke();

            const data = JSON.stringify({ x, y, color: selectedColor, size: selectedBrushSize, username, action: "draw", newStroke: false });
            ws.send(data);
        }
    }
});

// WebSocket Message Handling (Receives Data from Other Users)
ws.onmessage = (event) => {
    const { x, y, color, size, action, state, username: sender, newStroke: remoteNewStroke } = JSON.parse(event.data);

    // Handle Clear Canvas Action from WebSocket
    if (action === "clear") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    // Handle Dark Mode Sync from WebSocket
    if (action === "dark_mode") {
        document.body.classList.toggle("dark-mode", state);
        darkModeToggle.textContent = state ? "☀️ Light Mode" : "🌙 Dark Mode";
        return;
    }

    // Handle Eraser from Other Users
    if (action === "erase") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        return;
    }

    // Handle Cursor Movement from Other Users
    if (action === "cursor") {
        activeUsers[sender] = { x, y };
        updateFloatingUsernames();
        return;
    }

    // Draw on Other Clients' Canvases
    if (action === "draw") {
        if (remoteNewStroke){
            ctx.beginPath();  // Start a new drawing path
            ctx.moveTo(x, y);
        }

        ctx.lineTo(x, y);
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round"; // Smooth joints
        ctx.stroke();
    }

    // Store Other Users' Cursor Positions
    if (sender !== username) { // Ignore self messages
        activeUsers[sender] = { x, y };
        updateFloatingUsernames();
    }
};

// Clear Canvas Function (Syncs Across All Screens)
clearCanvasButton.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ws.send(JSON.stringify({ action: "clear" })); // Broadcast clear action to all users
});

// Function to Update Floating Usernames in Real Time
function updateFloatingUsernames() {
    usernamesContainer.innerHTML = ""; // Clear previous names

    Object.entries(activeUsers).forEach(([user, position]) => {
        if (user !== username) { // Only show OTHER users' names, not self
            const userElement = document.createElement("div");
            userElement.classList.add("floating-username");
            userElement.innerText = user;
            userElement.style.left = `${position.x + canvas.offsetLeft}px`;
            userElement.style.top = `${position.y + canvas.offsetTop}px`;
            usernamesContainer.appendChild(userElement);
        }
    });
}