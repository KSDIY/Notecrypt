const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const app = express();

// Middleware
const corsOptions = {
  origin: 'https://notecrypt-front.onrender.com/', // Replace with your actual frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors({
  origin: ['https://notecrypt-front.onrender.com', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI ||'mongodb+srv://notecrypt:7811@cluster0.oplmq2j.mongodb.net/notecrypt?appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// ==================== MODELS ====================

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Note Schema
const noteSchema = new mongoose.Schema({
  username: { type: String, required: true, index: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-delete expired notes (30 days in recycle bin)
noteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Note = mongoose.model('Note', noteSchema);

// ==================== ROUTES ====================

// Register new user
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    const existingUser = await User.findOne({ username: username.trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      username: username.trim(), 
      password: hashedPassword 
    });
    await user.save();
    
    res.status(201).json({ message: 'Account created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login existing user
app.post('/api/users/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    const user = await User.findOne({ username: username.trim() });
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Wrong password' });
    }
    
    res.json({ message: 'Login successful', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 2. Get all notes for a user (excluding deleted)
app.get('/api/notes/:username', async (req, res) => {
  try {
    const notes = await Note.find({ 
      username: req.params.username, 
      isDeleted: false 
    }).sort({ updatedAt: -1 });
    
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notes', error: error.message });
  }
});

// 3. Get recycle bin notes
app.get('/api/notes/:username/recycle', async (req, res) => {
  try {
    const notes = await Note.find({ 
      username: req.params.username, 
      isDeleted: true 
    }).sort({ deletedAt: -1 });
    
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recycle bin', error: error.message });
  }
});

// 4. Create new note
app.post('/api/notes', async (req, res) => {
  try {
    const { username, title, content } = req.body;
    
    if (!username || !title || !content) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const note = new Note({ username, title, content });
    await note.save();
    
    res.status(201).json({ message: 'Note created', note });
  } catch (error) {
    res.status(500).json({ message: 'Error creating note', error: error.message });
  }
});

// 5. Update note
app.put('/api/notes/:id', async (req, res) => {
  try {
    const { title, content } = req.body;
    
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { title, content, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    res.json({ message: 'Note updated', note });
  } catch (error) {
    res.status(500).json({ message: 'Error updating note', error: error.message });
  }
});

// 6. Delete note (move to recycle bin)
app.delete('/api/notes/:id', async (req, res) => {
  try {
    const deletedAt = new Date();
    const expiresAt = new Date(deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { 
        isDeleted: true, 
        deletedAt, 
        expiresAt 
      },
      { new: true }
    );
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    res.json({ message: 'Note moved to recycle bin', note });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting note', error: error.message });
  }
});

// 7. Restore note from recycle bin
app.put('/api/notes/:id/restore', async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { 
        isDeleted: false, 
        deletedAt: null, 
        expiresAt: null 
      },
      { new: true }
    );
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    res.json({ message: 'Note restored', note });
  } catch (error) {
    res.status(500).json({ message: 'Error restoring note', error: error.message });
  }
});

// Permanently delete note
app.delete('/api/notes/:id/permanent', async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    res.json({ message: 'Note permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting note', error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
