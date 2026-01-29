import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); 
  const [isNewUser, setIsNewUser] = useState(false); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notes, setNotes] = useState([]);
  const [recycleBin, setRecycleBin] = useState([]);
  const [currentNote, setCurrentNote] = useState({ title: '', content: '' });
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState('notes');
  const [error, setError] = useState('');

  // Login/Register
const handleLogin = async () => {
  if (!username.trim() || !password.trim()) {
    setError('Username and password are required');
    return;
  }
  
  try {
    await axios.post(`${API_URL}/users/login`, { 
      username: username.trim(), 
      password 
    });
    
    setIsLoggedIn(true);
    setError('');
    fetchNotes();
    fetchRecycleBin();
  } catch (err) {
    setError(err.response?.data?.message || 'Wrong password!');
  }
}; 
// Handle register function
const handleRegister = async () => {
  if (!username.trim() || !password.trim()) {
    setError('Username and password are required');
    return;
  }
  
  if (password.length < 4) {
    setError('Password must be at least 4 characters');
    return;
  }
  
  try {
    await axios.post(`${API_URL}/users/register`, { 
      username: username.trim(), 
      password 
    });
    
    setError('Account created! Now login.');
    setIsNewUser(false);
    setPassword('');
  } catch (err) {
    setError(err.response?.data?.message || 'Error creating account');
  }
};


  // Fetch notes
  const fetchNotes = async () => {
    try {
      const res = await axios.get(`${API_URL}/notes/${username}`);
      setNotes(res.data);
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  };

  // Fetch recycle bin
  const fetchRecycleBin = async () => {
    try {
      const res = await axios.get(`${API_URL}/notes/${username}/recycle`);
      setRecycleBin(res.data);
    } catch (err) {
      console.error('Error fetching recycle bin:', err);
    }
  };

  // Create or Update note
  const saveNote = async () => {
    if (!currentNote.title.trim() || !currentNote.content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      if (editingId) {
        await axios.put(`${API_URL}/notes/${editingId}`, currentNote);
      } else {
        await axios.post(`${API_URL}/notes`, { ...currentNote, username });
      }
      setCurrentNote({ title: '', content: '' });
      setEditingId(null);
      setError('');
      fetchNotes();
    } catch (err) {
      setError('Error saving note');
    }
  };

  // Delete note (move to recycle bin)
  const deleteNote = async (id) => {
    try {
      await axios.delete(`${API_URL}/notes/${id}`);
      fetchNotes();
      fetchRecycleBin();
    } catch (err) {
      setError('Error deleting note');
    }
  };

  // Restore note from recycle bin
  const restoreNote = async (id) => {
    try {
      await axios.put(`${API_URL}/notes/${id}/restore`);
      fetchNotes();
      fetchRecycleBin();
    } catch (err) {
      setError('Error restoring note');
    }
  };

  // Edit note
  const editNote = (note) => {
    setCurrentNote({ title: note.title, content: note.content });
    setEditingId(note._id);
  };

  // Logout
  const logout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setNotes([]);
    setRecycleBin([]);
    setCurrentNote({ title: '', content: '' });
    setEditingId(null);
    setIsNewUser(false);
  };

  if (!isLoggedIn) {
  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Notecrypt</h1>
        <p>{isNewUser ? 'Create your account' : 'Login to continue'}</p>
        {error && <div className="error">{error}</div>}
        
        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (isNewUser ? handleRegister() : handleLogin())}
        />
        
        {isNewUser ? (
          <>
            <button onClick={handleRegister}>Create Account</button>
            <p className="switch-mode">
              Already have an account? 
              <span onClick={() => { setIsNewUser(false); setError(''); setPassword(''); }}>
                Login here
              </span>
            </p>
          </>
        ) : (
          <>
            <button onClick={handleLogin}>Login</button>
            <p className="switch-mode">
              Don't have an account? 
              <span onClick={() => { setIsNewUser(true); setError(''); setPassword(''); }}>
                Create one
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}


  return (
    <div className="app">
      <header>
        <h1>Notecrypt</h1>
        <div className="user-info">
          <span>Welcome, {username}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="tabs">
        <button 
          className={activeTab === 'notes' ? 'active' : ''} 
          onClick={() => setActiveTab('notes')}
        >
          My Notes ({notes.length})
        </button>
        <button 
          className={activeTab === 'recycle' ? 'active' : ''} 
          onClick={() => setActiveTab('recycle')}
        >
          🗑️ Recycle Bin ({recycleBin.length})
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {activeTab === 'notes' && (
        <div className="main-content">
          <div className="note-editor">
            <h2>{editingId ? 'Edit Note' : 'Create New Note'}</h2>
            <input
              type="text"
              placeholder="Note Title"
              value={currentNote.title}
              onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
            />
            <textarea
              placeholder="Write your note here..."
              value={currentNote.content}
              onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
              rows="8"
            />
            <div className="editor-buttons">
              <button onClick={saveNote} className="save-btn">
                {editingId ? 'Update Note' : 'Save Note'}
              </button>
              {editingId && (
                <button 
                  onClick={() => {
                    setCurrentNote({ title: '', content: '' });
                    setEditingId(null);
                  }} 
                  className="cancel-btn"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          <div className="notes-list">
            <h2>Your Notes</h2>
            {notes.length === 0 ? (
              <p className="empty-state">No notes yet. Create your first note above!</p>
            ) : (
              notes.map((note) => (
                <div key={note._id} className="note-card">
                  <h3>{note.title}</h3>
                  <p>{note.content}</p>
                  <small>{new Date(note.createdAt).toLocaleDateString()}</small>
                  <div className="note-actions">
                    <button onClick={() => editNote(note)}>✏️ Edit</button>
                    <button onClick={() => deleteNote(note._id)} className="delete-btn">
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'recycle' && (
        <div className="recycle-bin">
          <h2>Recycle Bin</h2>
          <p className="recycle-info">Notes will be permanently deleted after 30 days</p>
          {recycleBin.length === 0 ? (
            <p className="empty-state">Recycle bin is empty</p>
          ) : (
            recycleBin.map((note) => (
              <div key={note._id} className="note-card deleted">
                <h3>{note.title}</h3>
                <p>{note.content}</p>
                <small>
                  Deleted: {new Date(note.deletedAt).toLocaleDateString()} 
                  (Expires: {new Date(note.expiresAt).toLocaleDateString()})
                </small>
                <div className="note-actions">
                  <button onClick={() => restoreNote(note._id)} className="restore-btn">
                    ♻️ Restore
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default App;
