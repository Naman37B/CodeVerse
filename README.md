# 🌌 CodeVerse

> **Enter the Arena. Code your Destiny.**

CodeVerse is a futuristic, real-time competitive coding platform designed for 1v1 battles. It connects developers in a virtual arena where they can challenge opponents to solve algorithmic problems under time pressure. Featuring a sleek, glassmorphism-inspired UI and seamless real-time synchronization, CodeVerse transforms standard coding practice into an intense e-sport experience.

**Github link**  = https://github.com/Naman37B/CodeVerse

---

## ✨ Features

### ⚔️ **Real-Time Battle Arena**
* **1v1 Duels:** Create private rooms and invite friends using a unique Room Code.
* **Live Synchronization:** Powered by **Socket.io**, battle states (timers, scores, and submission verdicts) are synced instantly between players.
* **Dynamic Problem Set:** Fetches real coding problems from the **Codeforces API** (Ratings 800-1200) or uses a robust fallback set if the API is unavailable.

### 🚀 **Futuristic User Experience**
* **Immersive UI:** Custom particle background effects, neon aesthetics, and glassmorphism design.
* **Interactive Feedback:** Anime.js animations for smooth transitions and alerts.
* **Live Leaderboard:** Real-time tracking of solved problems and penalties during the match.

### 🛠 **Backend Systems**
* **JSON-Based Persistence:** Lightweight, file-based database system for users, battles, and leaderboards (no external database setup required).
* **Automated Judging Simulation:** Simulates a judging environment where submissions are verified against Codeforces user status (polling mechanism).

---

## 🛠️ Tech Stack

**Frontend**
* HTML, CSS
* JavaScript
* [Socket.io Client](https://socket.io/) - Real-time events

**Backend**
* [Node.js](https://nodejs.org/) - Runtime environment
* [Express.js](https://expressjs.com/) - Web framework
* [Socket.io](https://socket.io/) - WebSocket server
* [Node-fetch](https://www.npmjs.com/package/node-fetch) - API requests

---

## ⚙️ Installation & Setup

Follow these steps to get CodeVerse running locally on your machine.

### 1. Prerequisites
Ensure you have **Node.js** (v14 or higher) installed.

### 2. Clone the Repository
```bash
git clone [https://github.com/naman37b/codeverse.git](https://github.com/naman37b/codeverse.git)
cd codeverse
```

### 3. Install Backend Dependencies
Navigate to the backend folder and install the required packages:
```bash
cd backend
npm install
```
### 4. Start the Server
You can run the server in development mode (with nodemon) or standard mode:

```bash
# Development mode (auto-restarts on changes)
npm run dev

# OR Standard start
npm start
```

The server will start on `http://localhost:5000`.

---

## 🎮 How to Play

1.  **Access the App:** Open your browser and go to `http://localhost:5000`.
2.  **Sign Up / Login:** Create a user account. Provide your real **Codeforces Handle** during signup to allow the system to track your actual submissions on Codeforces.
3.  **The Lobby:**
    * **Create Battle:** Generates a Room Code. Share this with a friend.
    * **Join Battle:** Enter a Room Code to connect to an existing lobby.
4.  **The Battle:**
    * Once both players join, the battle begins!
    * Solve the 3 provided problems on Codeforces.
    * The system polls your Codeforces account status to verify submissions.
    * **Scoring:**
        * Problem 1: 100 pts
        * Problem 2: 150 pts
        * Problem 3: 200 pts
        * Penalty: -20 pts per wrong submission.
5.  **Victory:** The battle ends when time runs out or both players solve all problems.

---

## 📂 Project Structure
```
codeverse/
├── .gitignore              # Git ignore configuration
├── README.md               # Project documentation
│
├── backend/
│   ├── data/
│   │   ├── battles.json    # Storage for active and past battles
│   │   └── users.json      # Storage for user credentials
│   ├── package.json        # Backend dependencies and scripts
│   ├── package-lock.json   # Dependency lock file
│   └── server.js           # Main server entry point & Socket.io logic
│
└── frontend/
    ├── auth.css            # Styles for Login/Signup pages
    ├── battle.css          # Styles for the Battle Arena
    ├── battle.html         # Battle Arena HTML structure
    ├── battle.js           # Battle logic (timer, fetching problems)
    ├── leaderboard.html    # Leaderboard page HTML
    ├── lobby.css           # Styles for the Lobby
    ├── lobby.html          # Lobby page HTML
    ├── lobby.js            # Lobby logic (create/join rooms)
    ├── login.html          # Login page HTML
    ├── particles.js        # Background particle animation script
    ├── script.js           # Global scripts (Leaderboard fetch & Socket init)
    ├── script1.js          # Auth scripts (Login/Signup fetch logic)
    ├── signup.html         # Signup page HTML
    └── style.css           # Global styles
```
<img width="2880" height="1800" alt="01-login" src="https://github.com/user-attachments/assets/717f141f-92f6-4aec-8097-394da49b3922" />
<img width="2880" height="1800" alt="02-signup" src="https://github.com/user-attachments/assets/a3470e6c-10e6-4f2a-b9d1-83cc6b63e165" />
<img width="2880" height="1800" alt="03-lobby" src="https://github.com/user-attachments/assets/070e7ae4-16a9-4755-9c81-1ae723595cc4" />
<img width="2880" height="1800" alt="04-lobby-join-form" src="https://github.com/user-attachments/assets/d1434aa2-e510-4ec4-9864-807f312ec890" />
<img width="2880" height="1800" alt="05-battle" src="https://github.com/user-attachments/assets/0ea80307-3395-4953-b246-82ddd66d38c9" />
<img width="2880" height="1800" alt="06-leaderboard" src="https://github.com/user-attachments/assets/5ce69ea7-c406-4508-8acb-88e3f2639f77" />
