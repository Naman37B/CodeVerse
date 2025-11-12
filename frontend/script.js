// ===== SOCKET.IO + API CONNECTION =====
const socket = io("http://localhost:5000");
const API_URL = "http://localhost:5000/leaderboard";

// === Function to safely get problem score (supports 1/2/3 or A/B/C keys) ===
function getProblemScore(problems, key) {
  if (!problems) return 0;

  // Check numeric keys first
  if (problems[key] !== undefined) return problems[key];

  // Fallback for old keys A/B/C
  const mapping = { 1: "A", 2: "B", 3: "C" };
  const altKey = mapping[key];
  if (altKey && problems[altKey] !== undefined) return problems[altKey];

  return 0;
}

// === Function to load & render leaderboard ===
async function loadLeaderboard() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    renderLeaderboard(data);
  } catch (error) {
    console.error("⚠️ Error loading leaderboard:", error);
    document.getElementById("updated").textContent = "⚠️ Error fetching data";
  }
}

// === Function to render leaderboard ===
function renderLeaderboard(data) {
  const tbody = document.getElementById("leaderboardBody");
  const updated = document.getElementById("updated");

  tbody.innerHTML = "";

  data.forEach((player, index) => {
    const username = player.username;
    const problems = player.problems || {};
    const score = player.score || 0;

    // 🧩 Support numeric 1,2,3 or old A,B,C keys
    const score1 = getProblemScore(problems, "1");
    const score2 = getProblemScore(problems, "2");
    const score3 = getProblemScore(problems, "3");

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

// === Initial Load ===
loadLeaderboard();

// === Real-Time WebSocket Updates ===
socket.on("connect", () => {
  console.log("🟢 Connected to server");
});

socket.on("leaderboardUpdated", (data) => {
  console.log("⚡ Real-time update received!");
  renderLeaderboard(data);
});

socket.on("disconnect", () => {
  console.log("🔴 Disconnected from server");
});

// ===== STAR PARTICLE BACKGROUND =====
const canvas = document.getElementById("particleCanvas");
if (canvas) {
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
}
