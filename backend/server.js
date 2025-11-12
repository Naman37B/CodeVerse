// backend/server.js
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import http from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import leaderboardRouter from "./routes/leaderboard.js";
import submissionsRouter from "./routes/submissions.js";

// ===== Setup =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.set("io", io);

// ===== Serve Frontend =====
app.use(express.static(path.join(__dirname, "../frontend")));

// ===== User Data (Login + Signup) =====
const usersFile = path.join(__dirname, "data/users.json");
let users = [];
if (fs.existsSync(usersFile)) {
  users = JSON.parse(fs.readFileSync(usersFile, "utf8"));
}

app.post("/signup", (req, res) => {
  const { username, password, handle } = req.body;
  if (users.find((u) => u.username === username))
    return res.json({ message: "User already exists" });

  users.push({ username, password, handle });
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  res.json({ message: "Signup successful!" });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (u) => u.username === username && u.password === password
  );
  if (user) res.json({ message: "Login successful!", handle: user.handle });
  else res.json({ message: "Invalid username or password" });
});

// ====== Battle Persistence ======
const battlesFile = path.join(__dirname, "data/battles.json");
let battles = {};

function loadBattles() {
  if (fs.existsSync(battlesFile)) {
    try {
      battles = JSON.parse(fs.readFileSync(battlesFile, "utf8"));
    } catch (err) {
      console.error("⚠️ Error reading battles file:", err);
      battles = {};
    }
  }
}
function saveBattles() {
  try {
    fs.writeFileSync(battlesFile, JSON.stringify(battles, null, 2));
  } catch (err) {
    console.error("⚠️ Error saving battles:", err);
  }
}
loadBattles();

// ====== Battle Logic ======

// --- Create Battle ---
app.post("/create", async (req, res) => {
  const { username, handle } = req.body;
  const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();

  let selected = [];
  try {
    const cfRes = await fetch("https://codeforces.com/api/problemset.problems");
    const cfData = await cfRes.json();
    const all = cfData.result.problems.filter(
      (p) => p.rating >= 800 && p.rating <= 1200
    );
    for (let i = 0; i < 3; i++) {
      selected.push(all[Math.floor(Math.random() * all.length)]);
    }
  } catch {
    console.log("⚠️ Using mock problems due to CF error");
    selected = [
      { contestId: 1000, index: "A", name: "Watermelon", rating: 800, tags: ["math"] },
      { contestId: 1001, index: "B", name: "Lucky Numbers", rating: 900, tags: ["brute force"] },
      { contestId: 1002, index: "C", name: "Binary Search", rating: 1000, tags: ["binary search"] },
    ];
  }

  const numbered = selected.map((p, i) => ({ ...p, number: (i + 1).toString() }));

  battles[roomCode] = {
    roomCode,
    players: [{ username, handle, solved: [] }],
    problems: numbered,
    status: "waiting",
  };

  saveBattles();
  console.log(`✅ Battle created by ${username} (${handle}) → ${roomCode}`);
  res.json({ roomCode, joinLink: `/battle.html?room=${roomCode}` });
});

// --- Join Battle ---
app.post("/join", (req, res) => {
  const { roomCode, username, handle } = req.body;
  const battle = battles[roomCode];
  if (!battle) return res.status(404).json({ msg: "Room not found" });

  if (battle.players.some((p) => p.username === username))
    return res.json({ msg: "Already joined", battle });
  if (battle.players.length >= 2)
    return res.status(400).json({ msg: "Room already full" });

  battle.players.push({ username, handle, solved: [] });
  if (battle.players.length === 2) battle.status = "active";

  saveBattles();
  res.json({ msg: "Joined successfully", battle });
});

// --- Get full battle ---
app.get("/battle/:roomCode", (req, res) => {
  const battle = battles[req.params.roomCode];
  if (!battle) return res.status(404).json({ msg: "Room not found" });
  res.json(battle);
});

// --- Get problems for a room ---
app.get("/problems/:roomCode", (req, res) => {
  const battle = battles[req.params.roomCode];
  if (!battle) return res.status(404).json({ msg: "Room not found" });
  res.json(battle.problems);
});

// ====== Leaderboard & Submissions ======
app.use("/leaderboard", leaderboardRouter);
app.use("/submissions", submissionsRouter);

// ====== Polling for Codeforces Submissions ======
setInterval(async () => {
  for (const roomCode in battles) {
    const battle = battles[roomCode];
    if (battle.status !== "active") continue;

    for (const player of battle.players) {
      try {
        const r = await fetch(
          `https://codeforces.com/api/user.status?handle=${player.handle}&from=1&count=10`
        );
        const d = await r.json();
        if (d.status !== "OK") continue;
        const subs = d.result;

        for (const sub of subs) {
          if (sub.verdict === "OK") {
            for (let i = 0; i < battle.problems.length; i++) {
              const p = battle.problems[i];
              if (
                sub.problem.contestId === p.contestId &&
                sub.problem.index === p.index &&
                !player.solved.includes(p.name)
              ) {
                player.solved.push(p.name);
                console.log(`✅ ${player.handle} solved Problem ${i + 1}: ${p.name}`);

                await fetch("http://localhost:5000/submissions/submit", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    username: player.username,
                    problem: (i + 1).toString(),
                    result: "correct",
                  }),
                });

                saveBattles();
                io.emit("battleUpdate", { roomCode, handle: player.handle, problem: p.name });
              }
            }
          }
        }

        if (player.solved.length === 3 && battle.status !== "finished") {
          battle.status = "finished";
          console.log(`🏁 ${player.username} finished ${roomCode}`);
          saveBattles();
          io.emit("battleFinished", { roomCode, winner: player.username });
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }
  }
}, 15000);

// ===== Test Solve (simulate local submission, supports correct & wrong) =====
app.post("/testsolve", async (req, res) => {
  const { roomCode, handle, problemName, result = "correct" } = req.body;
  const battle = battles[roomCode];
  if (!battle) return res.status(404).json({ msg: "Room not found" });

  const player = battle.players.find((p) => p.handle === handle);
  if (!player) return res.status(404).json({ msg: "Player not found" });

  const problem = battle.problems.find((p) => p.name === problemName);
  if (!problem) return res.status(404).json({ msg: "Problem not found" });

  const problemNumber =
    battle.problems.findIndex((p) => p.name === problemName) + 1;

  if (result === "wrong") {
    console.log(`❌ Simulated wrong submission: ${handle} → ${problem.name}`);
    await fetch("http://localhost:5000/submissions/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: player.username,
        problem: problemNumber.toString(),
        result: "wrong",
      }),
    });
    return res.json({ msg: "Marked as wrong submission", battle });
  }

  // Handle correct submission
  if (!player.solved.includes(problem.name)) {
    player.solved.push(problem.name);
    console.log(`🧪 Simulated solve: ${handle} solved ${problem.name}`);

    await fetch("http://localhost:5000/submissions/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: player.username,
        problem: problemNumber.toString(),
        result: "correct",
      }),
    });

    saveBattles();
    io.emit("battleUpdate", { roomCode, handle, problem: problem.name });
  }

  if (player.solved.length === 3 && battle.status !== "finished") {
    battle.status = "finished";
    console.log(`🏁 ${player.handle} finished battle ${roomCode}`);
    saveBattles();
    io.emit("battleFinished", { roomCode, winner: player.handle });
  }

  res.json({ msg: "Marked as solved", battle });
});

// ===== Socket.IO =====
io.on("connection", (socket) => {
  console.log("🟢 New WebSocket client connected");
  socket.on("disconnect", () => console.log("🔴 Client disconnected"));
});

// ===== Root =====
app.get("/", (req, res) => res.redirect("/login.html"));

// ===== Start Server =====
server.listen(5000, () =>
  console.log("🚀 Backend + Socket.IO running on http://localhost:5000")
);
