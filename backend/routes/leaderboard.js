// backend/routes/leaderboard.js
const express = require('express');
const router = express.Router();

// Sample leaderboard data
let leaderboard = [
  { username: 'Alice', score: 95 },
  { username: 'Bob', score: 88 },
  { username: 'Charlie', score: 82 },
];

// GET route to fetch leaderboard
router.get('/', (req, res) => {
  res.json(leaderboard);
});

// POST route to add new player score
router.post('/', (req, res) => {
  const { username, score } = req.body;
  leaderboard.push({ username, score });
  leaderboard.sort((a, b) => b.score - a.score); // sort by score desc
  res.json({ message: 'Score added!', leaderboard });
});

module.exports = router;
