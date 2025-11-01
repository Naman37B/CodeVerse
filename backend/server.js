const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory leaderboard data
let leaderboard = [
  { username: "Alice", score: 95 },
  { username: "Bob", score: 88 },
  { username: "Charlie", score: 82 }
];

// GET route — return leaderboard
app.get("/leaderboard", (req, res) => {
  res.json(leaderboard);
});

// POST route — add new score
app.post("/leaderboard", (req, res) => {
  const { username, score } = req.body;
  if (!username || typeof score !== "number") {
    return res.status(400).json({ error: "Invalid input" });
  }

  leaderboard.push({ username, score });
  leaderboard.sort((a, b) => b.score - a.score);
  res.json({
    message: "Score added!",
    leaderboard
  });
});

app.listen(PORT, "0.0.0.0", () =>
  console.log(`✅ Server running on port ${PORT}`)
);
