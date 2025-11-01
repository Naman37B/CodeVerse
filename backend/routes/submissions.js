const express = require('express');
const axios = require('axios'); // we'll install axios in the next step if not present
const router = express.Router();

/**
 * POST /submissions/submit
 * Body: { username: string, code: string }
 *
 * This route simulates judging the submission. If judged "accepted",
 * it sends a POST to /leaderboard to add/update the player's score.
 *
 * NOTE: This is a simple simulated judge. Replace the // JUDGE LOGIC //
 * block with your real judging/execution when you integrate the arena.
 */
router.post('/submit', async (req, res) => {
  try {
    const { username, code } = req.body;
    if (!username || typeof code !== 'string') {
      return res.status(400).json({ error: 'Invalid submission payload' });
    }

    // ----- SIMULATED JUDGE LOGIC -----
    // Replace this with real evaluation. For demo, we'll accept every submission
    // and assign a score. You can change scoring rules here.
    const accepted = true;                    // whether judge accepted the submission
    const score = Math.floor(Math.random() * 50) + 50; // random score 50-99 for demo
    // ----------------------------------

    if (accepted) {
      // Post result to leaderboard endpoint on the same server
      // Use the container-local address so it works both locally and in Codespaces
      const leaderboardUrl = process.env.LEADERBOARD_URL || 'http://localhost:3000/leaderboard';

      await axios.post(leaderboardUrl, { username, score });

      return res.json({ message: 'Submission accepted', username, score });
    } else {
      return res.json({ message: 'Submission rejected' });
    }
  } catch (err) {
    console.error('Submission error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
