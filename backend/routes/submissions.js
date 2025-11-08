const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const dataFile = path.join(__dirname, "../leaderboardData.json");

// ✅ Contest configuration
const PROBLEM_POINTS = {
  A: 100,
  B: 150,
  C: 200,
  D: 250,
};
const PENALTY = 20; // penalty for wrong submission

// Utility functions
function readLeaderboard() {
  if (!fs.existsSync(dataFile)) return [];
  return JSON.parse(fs.readFileSync(dataFile, "utf8"));
}

function writeLeaderboard(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// 🧠 POST /submissions/submit
router.post("/submit", (req, res) => {
  const { username, problem, result } = req.body;

  if (!username || !problem || !result) {
    return res
      .status(400)
      .json({ error: "username, problem, and result are required" });
  }

  const leaderboard = readLeaderboard();
  let user = leaderboard.find((u) => u.username === username);
  const problemScore = PROBLEM_POINTS[problem] || 0;
  const currentTime = new Date().toISOString();

  if (!user) {
    user = {
      username,
      score: 0,
      problems: {
        A: 0,
        B: 0,
        C: 0,
        D: 0,
      },
      solved: {
        A: false,
        B: false,
        C: false,
        D: false,
      },
      lastSubmission: currentTime,
    };
    leaderboard.push(user);
  }

  // 🚫 If already solved, ignore all future submissions for that problem
  if (user.solved[problem]) {
    return res.json({ message: "Already solved — no changes made", leaderboard });
  }

  // 🟥 Wrong submission → apply penalty if not solved yet
  if (result === "wrong") {
    user.problems[problem] -= PENALTY;
    user.score -= PENALTY;
    user.lastSubmission = currentTime;
  }

  // 🟩 Correct submission → award points minus previous penalties
  else if (result === "correct") {
    const gained = problemScore - Math.max(user.problems[problem], 0);
    user.problems[problem] += gained;
    user.score += gained;
    user.solved[problem] = true; // lock this problem now
    user.lastSubmission = currentTime;
  }

  // Sort leaderboard (by score, then by earliest submission)
  leaderboard.sort((a, b) => {
    if (b.score === a.score) {
      return new Date(a.lastSubmission) - new Date(b.lastSubmission);
    }
    return b.score - a.score;
  });

  writeLeaderboard(leaderboard);
  res.json({ message: "Submission processed", leaderboard });
});

module.exports = router;
