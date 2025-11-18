const createBtn = document.getElementById("createBattle");
const joinBtn = document.getElementById("joinBattle");
const joinForm = document.getElementById("joinForm");
const submitJoin = document.getElementById("submitJoin");
const roomCodeInput = document.getElementById("roomCode");
const resultBox = document.getElementById("resultBox");

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

    resultBox.classList.remove("hidden");
    resultBox.innerHTML = `
      <div class="waiting-glass">
        <h2>⚔️ Battle Arena Ready ⚔️</h2>
        <p>Room Code: <span class="room-code">${data.roomCode}</span></p>
        <p class="share-text">Share this link with your opponent:</p>
        <div class="share-link">http://localhost:5000/battle.html?room=${data.roomCode}</div>
        <div class="glass-loader"></div>
        <p class="waiting-text">⏳ Summoning your opponent… Hold steady!</p>
      </div>
    `;

    const interval = setInterval(async () => {
      try {
        const res2 = await fetch(`/battle/${data.roomCode}?t=${Date.now()}`);
        const battle = await res2.json();

        if (battle.status === "active") {
          clearInterval(interval);

          localStorage.setItem("roomCode", data.roomCode);

          window.location.href = `/battle.html?room=${data.roomCode}`;
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

joinBtn.addEventListener("click", () => {
  joinForm.classList.toggle("show");
});

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

      localStorage.setItem("roomCode", data.roomCode || roomCode);

      window.location.href = `/battle.html?room=${data.roomCode || roomCode}`;
    } else {
      alert(data.msg || "Error joining battle");
    }
  } catch (error) {
    console.error(error);
    alert("Error connecting to server");
  }
});
