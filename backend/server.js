import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import http from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";

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

const PROBLEM_POINTS = { 1: 100, 2: 150, 3: 200 };
const PENALTY = 20;

app.use(express.static(path.join(__dirname, "../frontend")));

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

const battlesFile = path.join(__dirname, "data/battles.json");
let battles = {};

function loadBattles() {
  if (fs.existsSync(battlesFile)) {
    try {
      battles = JSON.parse(fs.readFileSync(battlesFile, "utf8"));
    } catch (err) {
      console.error("Error reading battles file:", err);
      battles = {};
    }
  }
}
function saveBattles() {
  try {
    fs.writeFileSync(battlesFile, JSON.stringify(battles, null, 2));
  } catch (err) {
    console.error("Error saving battles:", err);
  }
}
loadBattles();

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
    console.log("Using mock problems due to CF error");
    selected = [
      {
        contestId: 4,
        index: "A",
        name: "Watermelon",
        rating: 800,
        tags: ["math"],
      },
      {
        contestId: 1808,
        index: "A",
        name: "Lucky Numbers",
        rating: 900,
        tags: ["brute force"],
      },
      {
        contestId: 1436,
        index: "C",
        name: "Binary Search",
        rating: 1000,
        tags: ["binary search"],
      },
    ];
  }

  const numbered = selected.map((p, i) => ({
    ...p,
    number: (i + 1).toString(),
  }));

  battles[roomCode] = {
    roomCode,
    players: [{ username, handle, solved: [], penalties: {} }],
    problems: numbered,
    status: "waiting",
  };

  saveBattles();
  res.json({ roomCode, joinLink: `/battle.html?room=${roomCode}` });
});

app.post("/join", (req, res) => {
  const { roomCode, username, handle } = req.body;
  const battle = battles[roomCode];
  if (!battle) return res.status(404).json({ msg: "Room not found" });

  if (battle.players.some((p) => p.username === username))
    return res.json({ msg: "Already joined", battle });

  if (battle.players.length >= 2)
    return res.status(400).json({ msg: "Room already full" });

  battle.players.push({ username, handle, solved: [], penalties: {} });
  if (battle.players.length === 2) battle.status = "active";

  saveBattles();
  res.json({ msg: "Joined successfully", battle });
});

app.get("/battle/:roomCode", (req, res) => {
  const battle = battles[req.params.roomCode];
  if (!battle) return res.status(404).json({ msg: "Room not found" });
  res.json(battle);
});

app.get("/problems/:roomCode", (req, res) => {
  const battle = battles[req.params.roomCode];
  if (!battle) return res.status(404).json({ msg: "Room not found" });
  res.json(battle.problems);
});

async function updateBattleSubmission(roomCode, player, problem, result) {
  const battle = battles[roomCode];

  if (player.solved.includes(problem.name)) return;

  player.penalties = player.penalties || {};
  player.penalties[problem.name] = player.penalties[problem.name] || 0;

  if (result === "wrong") {
    player.penalties[problem.name]++;

    saveBattles();
    io.emit("battleUpdate", {
      roomCode,
      handle: player.handle,
      problem: problem.name,
    });
  } else if (result === "correct") {
    player.solved.push(problem.name);

    saveBattles();
    io.emit("battleUpdate", {
      roomCode,
      handle: player.handle,
      problem: problem.name,
    });
  }
}

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

        for (const sub of d.result) {
          const problemIndex = battle.problems.findIndex(
            (p) =>
              p.contestId === sub.problem.contestId &&
              p.index === sub.problem.index
          );

          if (problemIndex !== -1) {
            const p = battle.problems[problemIndex];

            if (!player.solved.includes(p.name)) {
              const result = sub.verdict === "OK" ? "correct" : "wrong";

              await updateBattleSubmission(roomCode, player, p, result);
            }
          }
        }

        const allSolved =
          battle.players.length === 2 &&
          battle.players.every(
            (pl) => pl.solved.length === battle.problems.length
          );

        if (allSolved && battle.status !== "finished") {
          battle.status = "finished";
          saveBattles();
          io.emit("battleFinished", { roomCode, winner: "Both Players" });
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }
  }
}, 15000);

app.post("/testsolve", async (req, res) => {
  const { roomCode, handle, problemName, result = "correct" } = req.body;
  const battle = battles[roomCode];
  if (!battle) return res.status(404).json({ msg: "Room not found" });

  const player = battle.players.find((p) => p.handle === handle);
  if (!player) return res.status(404).json({ msg: "Player not found" });

  const problem = battle.problems.find((p) => p.name === problemName);
  if (!problem) return res.status(404).json({ msg: "Problem not found" });

  await updateBattleSubmission(roomCode, player, problem, result);

  const allSolved =
    battle.players.length === 2 &&
    battle.players.every((pl) => pl.solved.length === battle.problems.length);

  if (allSolved && battle.status !== "finished") {
    battle.status = "finished";
    saveBattles();
    io.emit("battleFinished", { roomCode, winner: "Both Players" });
  }

  res.json({ msg: `Submission marked as ${result}`, battle });
});

io.on("connection", (socket) => {
  console.log("New WebSocket client connected");
  socket.on("disconnect", () => console.log("Client disconnected"));
});

app.get("/", (req, res) => res.redirect("/login.html"));

server.listen(5000, () =>
  console.log("Backend running on http://localhost:5000")
);
