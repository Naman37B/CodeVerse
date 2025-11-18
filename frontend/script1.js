function signup() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const handle = document.getElementById("handle").value;

  fetch("http://localhost:5000/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, handle }),
  })
    .then((res) => res.json())
    .then((data) => {
      const msg = document.getElementById("msg");
      msg.style.opacity = 1;
      msg.style.textAlign = "center";

      if (data.message.toLowerCase().includes("success")) {
        msg.className = "success show";
        msg.innerHTML = `🎉 Welcome to CodeVerse, <strong>${username}</strong>!<br>Your account has been created successfully.<br><small>Redirecting to login...</small>`;

        anime({
          targets: msg,
          scale: [0.9, 1],
          opacity: [0, 1],
          easing: "easeOutElastic(1, .6)",
          duration: 1000,
        });

        setTimeout(() => (window.location.href = "login.html"), 4000);
      } else {
        msg.className = "error show";
        msg.textContent = data.message;
      }
    })
    .catch((err) => {
      console.error(err);
      const msg = document.getElementById("msg");
      msg.className = "error show";
      msg.textContent = "⚠️ Something went wrong. Please try again.";
    });
}

function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  fetch("http://localhost:5000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then((res) => res.json())
    .then((data) => {
      const msg = document.getElementById("msg");
      msg.style.opacity = 1;
      msg.style.textAlign = "center";

      if (data.message === "Login successful!") {
        localStorage.setItem("username", username);
        localStorage.setItem("handle", data.handle);

        msg.className = "success show";
        msg.innerHTML = `✅ Welcome back, <strong>${username}</strong>!<br>You’re entering the CodeVerse...`;

        anime({
          targets: msg,
          scale: [0.9, 1],
          opacity: [0, 1],
          easing: "easeOutElastic(1, .7)",
          duration: 900,
        });

        setTimeout(() => {
          window.location.href = "lobby.html";
        }, 2000);
      } else {
        msg.className = "error show";
        msg.textContent = data.message;
      }
    })
    .catch((err) => {
      console.error(err);
      const msg = document.getElementById("msg");
      msg.className = "error show";
      msg.textContent = "⚠️ Login failed. Please try again.";
    });
}
