import React, { useCallback, useEffect, useRef, useState } from "react";
import '@xterm/xterm/css/xterm.css';
import io from "socket.io-client";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";

const socket = io("http://localhost:3000", {
  transports: ["websocket"],
  reconnection: true,
});

const TerminalComponent = () => {
  const terminalRef = useRef(null);
  const xterm = useRef(null);
  const fitAddon = useRef(null);
  const [input, setInput] = useState(""); // ✅ State to handle input field
  const [token, setToken] = useState(""); // ✅ State to handle input field
  const [appleSessionValue, setAppleSessionResult] = useState("");

  // console.log("TerminalComponent")

  const handleOutPut = useCallback((data) => {
    console.log("📩 Received from backend:", data);
    xterm.current.write(data);
    return () => {
      socket.off("output", handleOutPut);
    };
  }, []);

  const checkAppleSessionOutput = useCallback((data) => {
    setAppleSessionResult(data)
    return () => {
      socket.off("checkAppleSessionOutput", checkAppleSessionOutput);
    };
  }, []);

  const sessionCleared = useCallback((data) => {
    console.log(data);
    setAppleSessionResult(data);
    return () => {
      socket.off("sessionCleared", sessionCleared);
    };
  }, []);

  useEffect(() => {
    if (!xterm.current) {
      xterm.current = new Terminal({
        cursorBlink: true,
        rows: 20,
        cols: 80,
      });

      fitAddon.current = new FitAddon();
      xterm.current.loadAddon(fitAddon.current);
      xterm.current.open(terminalRef.current);
      fitAddon.current.fit();

      socket.on("connect", () => {
        console.log("✅ WebSocket Connected!");
      });

      socket.on("disconnect", () => {
        console.log("❌ WebSocket Disconnected!");
      });

      socket.on("connect_error", (err) => {
        console.error("⚠️ WebSocket Error:", err);
      });

      // ✅ Send real-time terminal input to backend
      xterm.current.onData((data) => {
        console.log("📝 Sending to backend:", data);
        socket.emit("input", data);
      });

      xterm.current.write("Connected to server. Type commands and press Enter.\r\n");
    }

    socket.off("output", handleOutPut);
    socket.on("output", handleOutPut);

    socket.on("checkAppleSessionOutput", checkAppleSessionOutput);
    socket.on("sessionCleared", sessionCleared);

    return () => {
      socket.off("output", handleOutPut);
      socket.off("checkAppleSessionOutput", checkAppleSessionOutput);
      socket.off("sessionCleared", sessionCleared);
    };
  }, [checkAppleSessionOutput, handleOutPut, sessionCleared]);

  // ✅ Handle manual command submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      // xterm.current.write(`\r\n$ ${input}\r\n`); // Show user input in terminal
      socket.emit("input", input + "\n"); // ✅ Send command to backend
      setInput(""); // Clear input field
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Interactive Terminal</h2>
        <div
          ref={terminalRef}
          style={{ width: "80%", height: "400px", border: "1px solid black", margin: "auto" }}
        ></div>

      {/* ✅ Input field for manual command execution */}
      <form onSubmit={handleSubmit} style={{ marginTop: "10px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a command..."
          style={{ padding: "5px", fontSize: "16px", width: "300px" }}
        />
        <button type="submit">Run</button>
      </form>
      <div>
        <h2>{appleSessionValue}</h2>
        <button style={{ padding: "5px", fontSize: "16px", width: "300px", marginTop: 50 }} onClick={() => { socket.emit("check_fastlane"); }}>Check Apple Session</button>
      </div>
      <div>

        <div>
          <button
            style={{ padding: "5px", fontSize: "16px", width: "300px", marginTop: 50 }}
            onClick={() => { socket.emit("clear_fastlane_session"); }}
          >
            Clear Fastlane Session
          </button>
        </div>

        <button style={{ padding: "5px", fontSize: "16px", width: "300px", marginTop: 50 }} onClick={() => { socket.emit("run_fastlane"); }}>Run Fastlane</button>
      </div>
      <input
        type="text"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Token..."
        style={{ padding: "5px", fontSize: "16px", width: "300px", marginTop: 50 }}
      />
      <button style={{ padding: "5px", fontSize: "16px", width: "300px", marginTop: 50 }} onClick={() => { socket.emit("send_2fa", token); }}>Submit token</button>
    </div>
  );
};

export default TerminalComponent;

// helo

