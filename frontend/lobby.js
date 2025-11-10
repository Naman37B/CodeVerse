// ==== ELEMENT REFERENCES ====
const createBtn = document.getElementById("createBattle");
const joinBtn = document.getElementById("joinBattle");
const joinForm = document.getElementById("joinForm");
const submitJoin = document.getElementById("submitJoin");
const roomCodeInput = document.getElementById("roomCode");
const resultBox = document.getElementById("resultBox");
const whooshSound = document.getElementById("whooshSound");

// ==== PARTICLE BACKGROUND ====
const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");
let particles = [];
const particleCount = 60;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function createParticles() {
  particles = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.3,
    });
  }
}
createParticles();

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

// ==== CREATE BATTLE ====
createBtn.addEventListener("click", async () => {
  try {
    const username = localStorage.getItem("username");
    const handle = localStorage.getItem("handle");

    if (!username || !handle) {
      alert("Please log in first!");
      window.location.href = "login.html";
      return;
    }

    const res = await fetch("/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, handle }),
    });
    const data = await res.json();

    whooshSound.currentTime = 0;
    whooshSound.play();

    // Waiting UI
    resultBox.classList.remove("hidden");
    resultBox.innerHTML = `
      <div class="waiting-glass">
        <h2>⚔️ Battle Arena Ready ⚔️</h2>
        <p>Room Code: <span class="room-code">${data.roomCode}</span></p>
        <p class="share-text">Share this link with your opponent:</p>
        <div class="share-link">http://localhost:5000/battle.html?room=${data.roomCode}</div>
        <div class="glass-loader"></div>
        <p class="waiting-text">Waiting for opponent to join...</p>
      </div>
    `;

    // Poll every 2s for opponent
    const interval = setInterval(async () => {
      try {
        const res2 = await fetch(`/battle/${data.roomCode}?t=${Date.now()}`);
        const battle = await res2.json();
        console.log("Polling:", battle.status);

        if (battle.status === "active") {
          clearInterval(interval);
          whooshSound.currentTime = 0;
          whooshSound.play();
          localStorage.setItem("roomCode", data.roomCode || roomCode);
          window.location.href = "/battle.html";
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);
  } catch (error) {
    console.error(error);
    alert("Error creating battle");
  }
});

// ==== JOIN BUTTON ====
joinBtn.addEventListener("click", () => {
  joinForm.classList.toggle("hidden");
});

// ==== JOIN EXISTING BATTLE ====
submitJoin.addEventListener("click", async () => {
  const roomCode = roomCodeInput.value.trim();
  if (!roomCode) return alert("Enter room code!");

  const username = localStorage.getItem("username");
  const handle = localStorage.getItem("handle");

  if (!username || !handle) {
    alert("Please log in first!");
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch("/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomCode, username, handle }),
    });

    const data = await res.json();
    if (res.ok) {
      whooshSound.currentTime = 0;
      whooshSound.play();
      localStorage.setItem("roomCode", data.roomCode || roomCode);
      window.location.href = "/battle.html";
    } else {
      alert(data.msg || "Error joining battle");
    }
  } catch (error) {
    console.error(error);
    alert("Error connecting to server");
  }
});
