const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = 3000;

// Create HTTP server and bind Socket.IO to it
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // allow frontend access
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const leaderboardRoutes = require('./routes/leaderboard');
const submissionRoutes = require('./routes/submissions');

// Attach io to app so routes can emit events
app.set('io', io);

app.use('/leaderboard', leaderboardRoutes);
app.use('/submissions', submissionRoutes);

// Socket.IO connection listener
io.on('connection', (socket) => {
  console.log('🟢 New WebSocket client connected');
  socket.on('disconnect', () => console.log('🔴 Client disconnected'));
});

// Start the server
server.listen(PORT, () => {
  console.log(`✅ Server + WebSocket running at http://localhost:${PORT}`);
});
