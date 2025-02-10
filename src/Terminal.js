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
  const [appleTeamInfoDetails, setAppleTeamInfoDetails] = useState("");
  const [appleCertificates, setAppleCertificatesStatus] = useState("");
  const [downloadAppleCertificatesStatus, setDownloadAppleCertificatesStatus] = useState("");

  // console.log("TerminalComponent")

  const fetchAppleTeam = async () => {
    setAppleTeamInfoDetails('')
    try {
      const response = await fetch("http://localhost:3000/api/get_apple_team");
      const data = await response.json();
      console.log("data : ", data)
      if (data.success) {
        setAppleTeamInfoDetails(JSON.stringify(data));
      } else {
        setAppleTeamInfoDetails("❌ Failed to fetch Apple team info.");
      }
    } catch (error) {
      console.error("Error fetching Apple team:", error);
      setAppleSessionResult("❌ API request failed.");
    }
  };

  const fetchAppleCertificates = async () => {
    setAppleCertificatesStatus('');
    try {
      const response = await fetch("http://localhost:3000/api/get_apple_certificates");
      const data = await response.json();
      console.log("data : ", data)
      if (data.success) {
        setAppleCertificatesStatus(JSON.stringify(data));
      } else {
        setAppleCertificatesStatus(data.message);
      }
    } catch (error) {
      console.error("Error fetching Apple team:", error);
      setAppleCertificatesStatus("❌ API request failed.");
    }
  };

  const docwnloadAppleCertificates = async () => {
    setDownloadAppleCertificatesStatus('');
    try {
      const response = await fetch("http://localhost:3000/api/download_apple_certificates");
      const data = await response.json();
      console.log("data : ", data)
      if (data.success) {
        setDownloadAppleCertificatesStatus(JSON.stringify(data));
      } else {
        setDownloadAppleCertificatesStatus(data.message);
      }
    } catch (error) {
      console.error("Error fetching Apple team:", error);
      setDownloadAppleCertificatesStatus("❌ API request failed.");
    }
  };

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
        <p>{appleSessionValue}</p>
        <button style={{ padding: "5px", fontSize: "16px", width: "300px", marginTop: 50, backgroundColor: 'green' }} onClick={() => { socket.emit("check_fastlane"); }}>Check Apple Session</button>
      </div>

      <div>
        <p>{appleTeamInfoDetails}</p>
        <button style={{ padding: "5px", fontSize: "16px", width: "300px", marginTop: 50, backgroundColor: 'green' }} onClick={fetchAppleTeam}>Get Apple Team Info</button>
      </div>

      <div>
        <p>{appleCertificates}</p>
        <button style={{ padding: "5px", fontSize: "16px", width: "300px", marginTop: 50, backgroundColor: 'green' }} onClick={fetchAppleCertificates}>Get Apple Certificates</button>
      </div>

      <div>
        <p>{downloadAppleCertificatesStatus}</p>
        <button style={{ padding: "5px", fontSize: "16px", width: "300px", marginTop: 50, backgroundColor: 'green' }} onClick={docwnloadAppleCertificates}>Download Apple Certificates</button>
      </div>

      <div>
          <button
            style={{ padding: "5px", fontSize: "16px", width: "300px", marginTop: 50, backgroundColor: 'red' }}
            onClick={() => { socket.emit("clear_fastlane_session"); }}
          >
            Clear Fastlane Session
          </button>
        </div>

      <button style={{ padding: "5px", fontSize: "16px", width: "300px", marginTop: 50, backgroundColor: 'green' }} onClick={() => { socket.emit("run_fastlane"); }}>Run Fastlane</button>
      <div>
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Token..."
          style={{ padding: "5px", fontSize: "16px", width: "300px", marginTop: 50 }}
        />
        <button style={{ padding: "5px", fontSize: "16px", width: "300px", marginTop: 50, backgroundColor: 'green' }} onClick={() => { socket.emit("send_2fa", token); }}>Submit token</button>
      </div>
    </div>
  );
};

export default TerminalComponent;

// helo

