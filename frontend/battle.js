const urlParams = new URLSearchParams(window.location.search);
const roomFromURL = urlParams.get("room");

if (roomFromURL) {
  localStorage.setItem("roomCode", roomFromURL);
}

const roomCode = localStorage.getItem("roomCode");
const handle = localStorage.getItem("handle");

if (!roomCode) {
  alert("Room code missing. Please rejoin the battle.");
  window.location.href = "/lobby.html";
}

const problemsContainer = document.getElementById("problems-container");

async function fetchBattleProblems() {
  try {
    const res = await fetch(`/problems/${roomCode}`);
    if (!res.ok) throw new Error("Failed to fetch problems");

    const problems = await res.json();
    displayProblems(problems);
  } catch (error) {
    console.error("Error fetching battle problems:", error);
    problemsContainer.innerHTML = `<p style="color:red;">Error loading problems.</p>`;
  }
}

function displayProblems(problems) {
  problemsContainer.innerHTML = "";

  problems.forEach((p) => {
    const card = document.createElement("div");
    card.classList.add("problem-card");

    card.innerHTML = `
      <h3>Problem ${p.number}: ${p.name}</h3>
      <p>Rating: ${p.rating || "N/A"} | Tags: ${p.tags.join(", ")}</p>

      <div class="problem-links">
        <a href="https://codeforces.com/problemset/problem/${p.contestId}/${
      p.index
    }" target="_blank">View Problem</a>
        <a href="https://codeforces.com/problemset/submit/${p.contestId}/${
      p.index
    }" target="_blank">Submit</a>
      </div>
    `;

    problemsContainer.appendChild(card);
  });
}

fetchBattleProblems();

const TOTAL_SECONDS = 60 * 60;
const countdown = document.getElementById("countdown");

const battleStartKey = `battle_start_${roomCode}`;

async function ensureBattleStart() {
  try {
    const res = await fetch(`/battle/${roomCode}?t=${Date.now()}`);
    const battle = await res.json();

    if (battle.status === "active") {
      if (!localStorage.getItem(battleStartKey)) {
        localStorage.setItem(battleStartKey, Date.now());
      }
    } else if (battle.status === "finished") {
      localStorage.removeItem(battleStartKey);
    }
  } catch (err) {
    console.error(err);
  }
}

ensureBattleStart();

let startTime = Number(localStorage.getItem(battleStartKey)) || Date.now();
if (!localStorage.getItem(battleStartKey)) {
  localStorage.setItem(battleStartKey, startTime);
}

const circle = document.querySelector(".big-timer-progress");
const BIG_RADIUS = 110;
const BIG_CIRC = 2 * Math.PI * BIG_RADIUS;

if (circle) {
  circle.style.strokeDasharray = `${BIG_CIRC}`;
  circle.style.strokeDashoffset = `${BIG_CIRC}`;
}

let timeLeft = TOTAL_SECONDS;

function updateTimerArc() {
  const percent = Math.max(0, timeLeft / TOTAL_SECONDS);
  circle.style.strokeDashoffset = BIG_CIRC * (1 - percent);
}

function updateTimer() {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  timeLeft = TOTAL_SECONDS - elapsed;

  if (timeLeft < 0) timeLeft = 0;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  countdown.textContent = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;

  updateTimerArc();

  if (timeLeft === 0) {
    clearInterval(timerInterval);
    localStorage.removeItem(battleStartKey);
    alert("⏰ Battle ended!");
    window.location.href = `/leaderboard.html?room=${roomCode}`;
  }
}

updateTimer();
const timerInterval = setInterval(updateTimer, 1000);

const verdictTableBody = document.querySelector("#verdictTable tbody");

setInterval(async () => {
  try {
    const res = await fetch(`/battle/${roomCode}?t=${Date.now()}`);
    const battle = await res.json();

    renderVerdicts(battle);

    if (battle.status === "finished") {
      clearInterval(timerInterval);
      localStorage.removeItem(battleStartKey);
      alert("🏁 Contest ended!");
      window.location.href = `/leaderboard.html?room=${roomCode}`;
    }
  } catch (err) {
    console.error("Verdict update error:", err);
  }
}, 1000);

function renderVerdicts(battle) {
  verdictTableBody.innerHTML = "";

  const myHandle = handle;
  const me = battle.players.find((p) => p.handle === myHandle);

  battle.problems.forEach((problem, idx) => {
    const solved = me.solved.includes(problem.name);

    verdictTableBody.innerHTML += `
      <tr>
        <td>${myHandle}</td>
        <td>Problem ${idx + 1}</td>
        <td class="${solved ? "status-solved" : "status-pending"}">
          ${solved ? "✅ Solved" : "⏳ Pending"}
        </td>
      </tr>
    `;
  });
}

document.getElementById("viewLeaderboard").addEventListener("click", () => {
  window.open(`/leaderboard.html?room=${roomCode}`, "_blank");
});
