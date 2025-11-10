function signup() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const handle = document.getElementById("handle").value;

  fetch("http://localhost:5000/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, handle })
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById("msg").innerText = data.message;
    });
}

function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  fetch("http://localhost:5000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById("msg").innerText = data.message;
      if (data.message === "Login successful!") {
        localStorage.setItem("username", username);
        localStorage.setItem("handle", data.handle);
        setTimeout(() => {
          window.location.href = "lobby.html";
        }, 800);
      }
    });
}
