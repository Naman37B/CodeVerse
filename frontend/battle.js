// ==== PARTICLE BACKGROUND ====
const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

let particles = [];
const particleCount = 70;

function initParticles() {
  particles = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.6 + 0.3,
    });
  }
}
initParticles();

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
    ctx.fill();

    p.x += p.speedX;
    p.y += p.speedY;

    if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
    if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
  });
  requestAnimationFrame(animateParticles);
}
animateParticles();

// ==== GET ROOM CODE & HANDLE ====
const roomCode = localStorage.getItem("roomCode");
const handle = localStorage.getItem("handle");
const problemsContainer = document.getElementById("problems-container");

// ==== FETCH SAME PROBLEMS FOR BOTH PLAYERS ====
async function fetchBattleProblems() {
  try {
    const res = await fetch(`/problems/${roomCode}`);
    if (!res.ok) throw new Error("Failed to fetch problems");

    const problems = await res.json();
    displayProblems(problems);
  } catch (error) {
    console.error("Error fetching battle problems:", error);
    problemsContainer.innerHTML = `<p style="color:red;">Error loading problems. Please try again.</p>`;
  }
}

// ==== DISPLAY PROBLEMS ====
function displayProblems(problems) {
  problemsContainer.innerHTML = "";

  problems.forEach((p, index) => {
    const card = document.createElement("div");
    card.classList.add("problem-card");

    // ✅ use number instead of index (backend now provides p.number = "1", "2", "3")
    card.innerHTML = `
      <h3>Problem ${p.number}: ${p.name}</h3>
      <p>Rating: ${p.rating || "N/A"} | Tags: ${p.tags.join(", ")}</p>
      <div class="problem-links">
        <a href="https://codeforces.com/problemset/problem/${p.contestId}/${p.index}" target="_blank">View Problem</a>
        <a href="https://codeforces.com/problemset/submit/${p.contestId}/${p.index}" target="_blank">Submit</a>
      </div>
    `;

    problemsContainer.appendChild(card);
  });
}

// ==== CALL FUNCTION ON PAGE LOAD ====
fetchBattleProblems();

// ==== TIMER (1 hour countdown) ====
const countdown = document.getElementById("countdown");
let timeLeft = 60 * 60; // 1 hour

function updateTimer() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  countdown.textContent = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;

  if (timeLeft > 0) {
    timeLeft--;
  } else {
    clearInterval(timer);
    alert("⏰ Battle ended!");
    window.location.href = "/leaderboard.html";
  }
}
const timer = setInterval(updateTimer, 1000);

const verdictTableBody = document.querySelector("#verdictTable tbody");

// ==== UPDATE VERDICTS EVERY SECOND ====
setInterval(async () => {
  try {
    const res = await fetch(`/battle/${roomCode}?t=${Date.now()}`);
    const battle = await res.json();

    renderVerdicts(battle);

    if (battle.status === "finished") {
      clearInterval(timer);
      alert("🏁 Contest ended! All problems solved!");
      window.location.href = "/leaderboard.html";
    }
  } catch (err) {
    console.error("Error updating verdicts:", err);
  }
}, 1000);

// ==== RENDER VERDICTS ====
function renderVerdicts(battle) {
  verdictTableBody.innerHTML = "";

  const myHandle = handle;
  const me = battle.players.find((p) => p.handle === myHandle);

  if (!me) {
    verdictTableBody.innerHTML = `<tr><td colspan="3">❌ Your handle (${myHandle}) not found in this battle</td></tr>`;
    console.warn("Handles in battle:", battle.players.map((p) => p.handle));
    return;
  }

  battle.problems.forEach((problem, index) => {
    const solved = me.solved.includes(problem.name);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${myHandle}</td>
      <td>Problem ${index + 1}</td> <!-- ✅ Now shows numeric problem ID -->
      <td class="${solved ? "status-solved" : "status-pending"}">
        ${solved ? "✅ Solved" : "⏳ Pending"}
      </td>
    `;
    verdictTableBody.appendChild(row);
  });
}

// ==== 🏆 LEADERBOARD BUTTON ====
const leaderboardBtn = document.getElementById("viewLeaderboard");
if (leaderboardBtn) {
  leaderboardBtn.addEventListener("click", () => {
    window.open("/leaderboard.html", "_blank"); // opens leaderboard in new tab
  });
}
