const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const pty = require("node-pty");
const cors = require("cors");
const os = require("os");
const { exec } = require("child_process")
const { spawn } = require("child_process");
const fs = require('fs');
const path = require("path");
const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "http://localhost:3001", methods: ["GET", "POST"] }, // Change port if needed
});


app.get("/api/get_apple_team", (req, res) => {
  exec("FASTLANE_USER='tpandey@gozego.com' ruby src/get_apple_team.rb", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${stderr}`);
      return res.status(500).json({ success: false, message: "Failed to fetch Apple team info." });
    }
    res.json({ success: true, teamInfo: JSON.parse(stdout) });
  });
});

app.get("/api/get_apple_certificates", (req, res) => {
  exec("FASTLANE_USER='tpandey@gozego.com' ruby src/get_team_certificates.rb", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${stderr}`);
      return res.status(500).json({ success: false, message: `Failed to fetch Apple team certificates : reason is : + ${stderr}` });
    }
    res.json({ success: true, teamInfo: JSON.parse(stdout) });
  });
});

app.get("/api/download_apple_certificates", (req, res) => {
  exec("FASTLANE_USER='tpandey@gozego.com' ruby src/download_team_certificates.rb", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${stderr}`);
      return res.status(500).json({ success: false, message: `Failed to download Apple team certificates : reason is : + ${stderr}` });
    }
    res.json({ success: true, teamInfo: JSON.parse(stdout) });
  });
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
  let fastlaneProcess = null;
  socket.on("run_fastlane", () => {
    console.log("🚀 Running Fastlane script...");

    const env = { ...process.env, FASTLANE_USER: "tpandey@gozego.com" };

    fastlaneProcess = spawn("fastlane", ["spaceauth"], { env });
    let sessionData = '';
    fastlaneProcess.stdout.on("data", (data) => {
      console.log(`Fastlane Output: ${data.toString()}`);
      socket.emit("output", `Fastlane Output: ${data.toString()}\r\n`);
      const output = data.toString();
      // ✅ Detect if session data is present
      if (output.includes("FASTLANE_SESSION")) {
        sessionData = output.match(/FASTLANE_SESSION=(.+)/)?.[1]?.trim();
        if (sessionData) {
          console.log("🔐 Storing FASTLANE_SESSION...");
          fs.writeFileSync(".fastlane_session", sessionData); // Save session to file
          process.env.FASTLANE_SESSION = sessionData; // Set environment variable
          socket.emit("output", "✅ Session stored successfully!");
        }
      }
    });

    fastlaneProcess.stderr.on("data", (data) => {
      console.error(`Fastlane Error: ${data.toString()}`);
      socket.emit("output", `Fastlane Error: ${data.toString()}\r\n`);
    });

    fastlaneProcess.on("close", (code) => {
      console.log(`Fastlane process exited with code ${code}`);
      socket.emit("output", `Fastlane process exited with code ${code}\r\n`);
    });
  });

  socket.on("send_2fa", (code) => {
    if (fastlaneProcess) {
      console.log("🔐 Entering 2FA Code:", code);
      fastlaneProcess.stdin.write(`${code}\n`);
    }
  });


  const FASTLANE_SESSION_FILE = ".fastlane_session"; // Path to stored session file

  socket.on("check_fastlane", () => {
    console.log("🔍 Checking Fastlane session...");
  
    if (fs.existsSync(FASTLANE_SESSION_FILE)) {
      const sessionData = fs.readFileSync(FASTLANE_SESSION_FILE, "utf8").trim();
  
      if (sessionData.length > 0) {
        console.log("✅ Fastlane session is valid!");
        socket.emit("checkAppleSessionOutput", "✅ Fastlane session is valid!");
        return;
      }
    }
  
    console.log("❌ Fastlane session is missing or expired.");
    socket.emit("checkAppleSessionOutput", "❌ Fastlane session is missing or expired.");
  });

  socket.on("clear_fastlane_session", () => {
    console.log("🧹 Clearing Fastlane session...");
  
    const FASTLANE_SESSION_FILE = ".fastlane_session"; // Custom session file
    const FASTLANE_DIR = path.join(os.homedir(), ".fastlane"); // Fastlane config directory
  
    try {
      // ✅ Remove custom session file (if it exists)
      if (fs.existsSync(FASTLANE_SESSION_FILE)) {
        fs.unlinkSync(FASTLANE_SESSION_FILE);
        console.log("✅ Fastlane session file deleted.");
      } else {
        console.log("⚠️ No custom session file found.");
      }
  
      // ✅ Remove Fastlane keychain & Apple session files
      if (fs.existsSync(FASTLANE_DIR)) {
        fs.rmSync(FASTLANE_DIR, { recursive: true, force: true });
        console.log("✅ Fastlane authentication files deleted.");
      } else {
        console.log("⚠️ No Fastlane authentication directory found.");
      }
  
      // ✅ Remove environment variable
      delete process.env.FASTLANE_SESSION;
      console.log("✅ FASTLANE_SESSION environment variable removed.");
  
      // ✅ Notify frontend that session is cleared
      socket.emit("sessionCleared", "✅ Fastlane session fully cleared!");
    } catch (error) {
      console.error("❌ Error clearing Fastlane session:", error);
      socket.emit("sessionCleared", "❌ Failed to clear Fastlane session.");
    }
  });
});


server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});