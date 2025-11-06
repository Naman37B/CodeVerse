// const express = require('express');
// const cors = require('cors');
// const fs = require('fs');
// const path = require('path'); 
// const app = express();

// app.use(cors());
// app.use(express.json());


// let users = [];

// // Load users from file
// if (fs.existsSync('data/users.json')) {
//   users = JSON.parse(fs.readFileSync('data/users.json', 'utf8'));
// }

// // Signup route
// app.post('/signup', (req, res) => {
//   const { username, password } = req.body;
//   if (users.find(u => u.username === username)) {
//     return res.json({ message: 'User already exists' });
//   }
//   users.push({ username, password });
//   fs.writeFileSync('data/users.json', JSON.stringify(users, null, 2));
//   res.json({ message: 'Signup successful!' });
// });

// // Login route
// app.post('/login', (req, res) => {
//   const { username, password } = req.body;
//   const user = users.find(u => u.username === username && u.password === password);
//   if (user) res.json({ message: 'Login successful!' });
//   else res.json({ message: 'Invalid username or password' });
// });

// app.listen(3000, () => console.log('Server running on port 3000'));

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path'); 
const app = express();

app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

let users = [];

// Load users from file
const usersFile = path.join(__dirname, 'data/users.json');
if (fs.existsSync(usersFile)) {
  users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
}

// Signup route
app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) {
    return res.json({ message: 'User already exists' });
  }
  users.push({ username, password });
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  res.json({ message: 'Signup successful!' });
});

// Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) res.json({ message: 'Login successful!' });
  else res.json({ message: 'Invalid username or password' });
});

app.listen(3000, () => console.log('Server running on port 3000'));



