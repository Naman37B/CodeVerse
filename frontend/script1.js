function signup() {
  const username = document.querySelector(".username").value;
  const password = document.querySelector(".password").value;

  fetch("http://localhost:3000/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById("msg").innerText = data.message;

      document.querySelector(".username").value = "";
      document.querySelector(".password").value = "";
    });
}

function login() {
  const username = document.querySelector(".username").value;
  const password = document.querySelector(".password").value;

  fetch("http://localhost:3000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById("msg").innerText = data.message;

      document.querySelector(".username").value = "";
      document.querySelector(".password").value = "";
    });
}
