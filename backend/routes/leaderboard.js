import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// Recreate __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Correct absolute path to leaderboardData.json
const dataFile = path.join(__dirname, "../data/leaderboardData.json");

// Helper: Read leaderboard
function readLeaderboard() {
  if (!fs.existsSync(dataFile)) return [];
  try {
    const data = fs.readFileSync(dataFile, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading leaderboard:", err);
    return [];
  }
}

// Helper: Write leaderboard
function writeLeaderboard(data) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing leaderboard:", err);
  }
}

// Route: GET leaderboard
router.get("/", (req, res) => {
  const leaderboard = readLeaderboard().sort((a, b) => b.score - a.score);
  res.json(leaderboard);
});

// Route: POST (optional) update leaderboard manually
router.post("/update", (req, res) => {
  const { username, score } = req.body;
  if (!username || typeof score !== "number") {
    return res.status(400).json({ message: "Invalid data" });
  }

  let leaderboard = readLeaderboard();
  const user = leaderboard.find((u) => u.username === username);

  if (user) {
    user.score = score;
  } else {
    leaderboard.push({ username, score, submissions: 0 });
  }

  writeLeaderboard(leaderboard);
  res.json({ message: "Leaderboard updated", leaderboard });
});

export default router;
