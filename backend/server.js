// backend/server.js
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// 🚫 Disable caching (important for polling)
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// ===== Serve Frontend =====
app.use(express.static(path.join(__dirname, "../frontend")));

// ====== User Data (Login + Signup) ======
const usersFile = path.join(__dirname, "data/users.json");
let users = [];
if (fs.existsSync(usersFile)) {
  users = JSON.parse(fs.readFileSync(usersFile, "utf8"));
}

// --- Signup ---
app.post("/signup", (req, res) => {
  const { username, password, handle } = req.body;
  if (users.find((u) => u.username === username))
    return res.json({ message: "User already exists" });

  users.push({ username, password, handle });
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  res.json({ message: "Signup successful!" });
});

// --- Login ---
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (u) => u.username === username && u.password === password
  );
  if (user) {
    res.json({ message: "Login successful!", handle: user.handle });
  } else {
    res.json({ message: "Invalid username or password" });
  }
});

// ====== Battles ======
const battles = {}; // { roomCode: { players, problems, status } }

// --- Create Battle ---
app.post("/create", async (req, res) => {
  const { username, handle } = req.body;
  const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();

  // Fetch problems from Codeforces
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
  } catch (err) {
    console.log("⚠️ Using mock problems due to CF error");
    selected = [
      {
        contestId: 1000,
        index: "A",
        name: "Watermelon",
        rating: 800,
        tags: ["math"],
      },
      {
        contestId: 1001,
        index: "B",
        name: "Lucky Numbers",
        rating: 900,
        tags: ["brute force"],
      },
      {
        contestId: 1002,
        index: "A",
        name: "Binary Search",
        rating: 1000,
        tags: ["binary search"],
      },
    ];
  }

  // Add creator as player 1
  battles[roomCode] = {
    roomCode,
    players: [{ username, handle, solved: [] }],
    problems: selected,
    status: "waiting",
  };

  console.log(`✅ Battle created by ${username} (${handle}) → ${roomCode}`);
  res.json({ roomCode, joinLink: `/battle.html?room=${roomCode}` });
});

// --- Join Battle ---
app.post("/join", (req, res) => {
  const { roomCode, username, handle } = req.body;
  const battle = battles[roomCode];
  if (!battle) return res.status(404).json({ msg: "Room not found" });

  // Already joined
  if (battle.players.some((p) => p.username === username)) {
    return res.json({ msg: "Already joined", battle });
  }
  if (battle.players.length >= 2)
    return res.status(400).json({ msg: "Room already full" });

  battle.players.push({ username, handle, solved: [] });

  if (battle.players.length === 2) {
    battle.status = "active";
    console.log(
      `🔥 Battle ${roomCode} active between ${battle.players[0].username} and ${battle.players[1].username}`
    );
  } else {
    console.log(
      `👤 ${username} joined room ${roomCode} (${battle.players.length}/2)`
    );
  }

  res.json({ msg: "Joined successfully", battle });
});

// --- Get full battle (state for polling) ---
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

// --- Polling for submissions (optional feature) ---
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
            for (const p of battle.problems) {
              if (
                sub.problem.contestId === p.contestId &&
                sub.problem.index === p.index &&
                !player.solved.includes(p.name)
              ) {
                player.solved.push(p.name);
                console.log(`✅ ${player.handle} solved ${p.name}`);
              }
            }
          }
        }
        if (player.solved.length === 3) {
          battle.status = "finished";
          console.log(`🏁 ${player.username} finished ${roomCode}`);
        }
      } catch {}
    }
  }
}, 15000);

// ⚙️ TEST ROUTE — mark a problem solved manually (for testing only)
app.post("/testsolve", (req, res) => {
  const { roomCode, handle, problemName } = req.body;
  const battle = battles[roomCode];
  if (!battle) return res.status(404).json({ msg: "Room not found" });

  const player = battle.players.find((p) => p.handle === handle);
  if (!player) return res.status(404).json({ msg: "Player not found" });

  const problem = battle.problems.find((p) => p.name === problemName);
  if (!problem) return res.status(404).json({ msg: "Problem not found" });

  if (!player.solved.includes(problem.name)) {
    player.solved.push(problem.name);
    console.log(`🧪 Simulated solve: ${handle} solved ${problem.name}`);
  }

  if (player.solved.length === 3 && battle.status !== "finished") {
    battle.status = "finished";
    console.log(`🏁 ${player.handle} finished battle ${roomCode}`);
  }

  res.json({ msg: "Marked as solved", battle });
});

// --- Root route ---
app.get("/", (req, res) => {
  res.send("✅ CodeVerse unified backend running!");
});

app.listen(5000, () =>
  console.log("🚀 Unified server running on http://localhost:5000")
);
