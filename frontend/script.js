const socket = io("http://localhost:5000");

const urlParams = new URLSearchParams(window.location.search);
const roomCode = urlParams.get("room");
const isRoomMode = !!roomCode;

const API_URL = isRoomMode
  ? `http://localhost:5000/battle/${roomCode}`
  : "/leaderboard";

function getProblemScore(problems, key) {
  if (!problems) return 0;

  if (problems[key] !== undefined) return problems[key];

  const mapping = { 1: "A", 2: "B", 3: "C" };
  const altKey = mapping[key];
  if (altKey && problems[altKey] !== undefined) return problems[altKey];

  return 0;
}

function adaptBattleToLeaderboard(battle) {
  if (!battle || !battle.players) return [];

  const POINTS_MAP = [100, 150, 200];
  const PENALTY_AMOUNT = 20;

  return battle.players
    .map((player) => {
      const problems = {};
      let totalScore = 0;

      battle.problems.forEach((prob, idx) => {
        const pNum = (idx + 1).toString();
        const basePoints = POINTS_MAP[idx] || 0;

        const penaltyCount = player.penalties[prob.name] || 0;

        if (player.solved.includes(prob.name)) {
          const penaltyDeduction = penaltyCount * PENALTY_AMOUNT;
          const finalScore = Math.max(basePoints - penaltyDeduction, 0);

          problems[pNum] = finalScore;
          totalScore += finalScore;
        } else {
          const cumulativePenalty = penaltyCount * PENALTY_AMOUNT;
          problems[pNum] = -cumulativePenalty;
          totalScore -= cumulativePenalty;
        }
      });

      return {
        username: player.username,
        problems: problems,
        score: totalScore,
      };
    })
    .sort((a, b) => b.score - a.score);
}

async function loadLeaderboard() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    if (isRoomMode) {
      const leaderboardData = adaptBattleToLeaderboard(data);
      renderLeaderboard(leaderboardData);
    } else {
      const tbody = document.getElementById("leaderboardBody");
      tbody.innerHTML =
        '<tr><td colspan="7">Global Leaderboard is now disabled. Please join a battle room.</td></tr>';
      document.getElementById("updated").textContent =
        "Global Leaderboard removed.";
    }
  } catch (error) {
    console.error("Error loading leaderboard:", error);
    document.getElementById("updated").textContent =
      "Error fetching data or room not found";
  }
}

function renderLeaderboard(data) {
  const tbody = document.getElementById("leaderboardBody");
  const updated = document.getElementById("updated");

  tbody.innerHTML = "";

  if (isRoomMode) {
    const title = document.querySelector("h1");
    if (title) title.textContent = `Leaderboard`;
  } else {
    tbody.innerHTML =
      '<tr><td colspan="7">Global Leaderboard is now disabled. Please join a battle room.</td></tr>';
    document.getElementById("updated").textContent =
      "Global Leaderboard removed.";
    return;
  }

  data.forEach((player, index) => {
    const username = player.username;
    const problems = player.problems || {};
    const score = player.score || 0;

    const score1 = problems["1"] !== undefined ? problems["1"] : 0;
    const score2 = problems["2"] !== undefined ? problems["2"] : 0;
    const score3 = problems["3"] !== undefined ? problems["3"] : 0;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${username}</td>
      <td>${score1}</td>
      <td>${score2}</td>
      <td>${score3}</td>
      <td>${score}</td>
    `;
    tbody.appendChild(row);
  });

  const now = new Date().toLocaleTimeString();
  updated.textContent = "Last updated: " + now;
}

loadLeaderboard();

socket.on("connect", () => {
  console.log("Connected to server");
});

if (isRoomMode) {
  socket.on("battleUpdate", (data) => {
    if (data.roomCode === roomCode) {
      console.log("Room update received!");
      loadLeaderboard();
    }
  });
  socket.on("battleFinished", (data) => {
    if (data.roomCode === roomCode) {
      loadLeaderboard();
    }
  });
}

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});
