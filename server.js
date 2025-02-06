const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const pty = require("node-pty");
const cors = require("cors");
const os = require("os");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "http://localhost:3001", methods: ["GET", "POST"] }, // Change port if needed
});


io.on("connection", (socket) => {
  console.log("Client connected");

  // setInterval(() => {
  //   socket.emit("output", "Test message from server\n");
  //   console.log("Sent test message to frontend");
  // }, 2000);

  // ✅ Create a pseudo-terminal (pty) session
  const shell = pty.spawn(os.platform() === "win32" ? "cmd.exe" : "bash", [], {
    name: "xterm-color",
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env,
  });

  // ✅ Send terminal output to frontend
  shell.onData((data) => {
    console.log("📝 Backend sending:", data);
    socket.emit("output", data);
  });

  // ✅ Listen for user input and send it to the shell
  socket.on("input", (data) => {
    console.log("➡️✅ Backend received input:", data);
    shell.write(data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    shell.kill();
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});