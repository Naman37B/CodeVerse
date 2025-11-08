const socket = io("http://localhost:3000");
const API_URL = "http://localhost:3000/leaderboard";

async function loadLeaderboard() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    const tbody = document.getElementById("leaderboardBody");
    const updated = document.getElementById("updated");

    tbody.innerHTML = "";

    data.forEach((player, index) => {
      const { username, problems, score } = player;
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${username}</td>
        <td>${problems?.A || 0}</td>
        <td>${problems?.B || 0}</td>
        <td>${problems?.C || 0}</td>
        <td>${problems?.D || 0}</td>
        <td>${score}</td>
      `;
      tbody.appendChild(row);
    });

    const now = new Date().toLocaleTimeString();
    updated.textContent = "Last updated: " + now;
  } catch (error) {
    console.error("Error loading leaderboard:", error);
    document.getElementById("updated").textContent = "⚠️ Error fetching data";
  }
}

loadLeaderboard();
setInterval(loadLeaderboard, 5000);

socket.on("leaderboardUpdated", () => {
  console.log("⚡ Real-time update received!");
  loadLeaderboard();
});
