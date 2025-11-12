import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataFile = path.join(__dirname, "../data/leaderboardData.json");

const PROBLEM_POINTS = { 1: 100, 2: 150, 3: 200 };
const PENALTY = 20;

// === Read/Write utilities ===
function readLeaderboard() {
  if (!fs.existsSync(dataFile)) return [];
  try {
    return JSON.parse(fs.readFileSync(dataFile, "utf8"));
  } catch {
    console.error("⚠️ Error reading leaderboard file");
    return [];
  }
}

function writeLeaderboard(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// === POST /submissions/submit ===
router.post("/submit", (req, res) => {
  const { username, problem, result } = req.body;
  if (!username || !problem || !result)
    return res
      .status(400)
      .json({ error: "username, problem, and result are required" });

  const leaderboard = readLeaderboard();
  let user = leaderboard.find((u) => u.username === username);

  const problemKey = problem.toString().trim();
  const problemScore = PROBLEM_POINTS[problemKey] || 0;
  const currentTime = new Date().toISOString();

  // === Create new user if missing ===
  if (!user) {
    user = {
      username,
      score: 0,
      problems: { 1: 0, 2: 0, 3: 0 },
      penalties: { 1: 0, 2: 0, 3: 0 },
      solved: { 1: false, 2: false, 3: false },
      lastSubmission: currentTime,
    };
    leaderboard.push(user);
  }

  // Ensure structures exist
  user.problems ||= { 1: 0, 2: 0, 3: 0 };
  user.penalties ||= { 1: 0, 2: 0, 3: 0 };
  user.solved ||= { 1: false, 2: false, 3: false };
  if (typeof user.score !== "number") user.score = 0;

  // === Skip if already solved ===
  if (user.solved[problemKey]) {
    return res.json({ message: "Already solved — no score change", leaderboard });
  }

  // === WRONG submission ===
  if (result === "wrong") {
    user.penalties[problemKey] = (user.penalties[problemKey] || 0) + 1;
    const penaltyTotal = user.penalties[problemKey] * PENALTY;
    user.problems[problemKey] = -penaltyTotal; // show cumulative penalty
    user.score =
      (user.problems["1"] || 0) +
      (user.problems["2"] || 0) +
      (user.problems["3"] || 0);

    user.lastSubmission = currentTime;
    writeLeaderboard(leaderboard);
    req.app.get("io").emit("leaderboardUpdated", leaderboard);

    return res.json({
      message: `Wrong submission (-${penaltyTotal})`,
      leaderboard,
    });
  }

  // === CORRECT submission ===
  if (result === "correct") {
    const totalPenalty = (user.penalties[problemKey] || 0) * PENALTY;
    const finalScore = Math.max(problemScore - totalPenalty, 0);

    user.problems[problemKey] = finalScore;
    user.solved[problemKey] = true;

    // Recalculate total
    user.score =
      (user.problems["1"] || 0) +
      (user.problems["2"] || 0) +
      (user.problems["3"] || 0);

    user.lastSubmission = currentTime;
    writeLeaderboard(leaderboard);

    req.app.get("io").emit("leaderboardUpdated", leaderboard);
    return res.json({
      message: `Correct! Final score: ${finalScore} (Penalty: -${totalPenalty})`,
      leaderboard,
    });
  }

  res.json({ message: "No change", leaderboard });
});

export default router;
