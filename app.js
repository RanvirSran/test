import { dir, error } from 'console';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'naturaltalent';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', __dirname); 
const port = 3000;

mongoose.connect('mongodb://127.0.0.1:27017/YouMattr', {})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true }
});

const User = mongoose.model('User', userSchema);

async function generateUsername() {
  let username;
  let exists = true;
  while (exists) {
    username = 'user' + Math.floor(10000 + Math.random() * 90000);
    exists = await User.exists({ username });
  }
  return username;
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Missing token' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/landing.html');
});

app.get('/chat', authenticateToken, (req, res) => {
  res.render(__dirname + '/index', { username: req.user.username });
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

app.post('/register', async (req, res) => {
  const { email, password } = req.body;
 
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({error: 'Email already registered'});
    const username = await generateUsername();
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, password: hashedPassword, email });
    await newUser.save();
    res.status(200).json({ message: 'User registered successfully', username });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(5000, () => {
  console.log(`Server is running at http://localhost:${5000}`);
});
