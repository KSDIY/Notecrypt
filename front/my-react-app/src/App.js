import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'https://notecrypt-mdkz.onrender.com';

function App() {
  // ============================================
  // STATE DECLARATIONS
  // ============================================
  // Stores user credentials and login status
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Stores notes data
  const [notes, setNotes] = useState([]);
  const [recycleBin, setRecycleBin] = useState([]);
  const [currentNote, setCurrentNote] = useState({ title: '', content: '' });
  const [editingId, setEditingId] = useState(null);
  
  // UI control states
  const [activeTab, setActiveTab] = useState('create'); // Which tab is currently active
  const [showNotesList, setShowNotesList] = useState(false);
  const [error, setError] = useState('');
  
  // Text formatting states
  const [textFormat, setTextFormat] = useState({
    fontSize: 16,
    isBold: false,
    isItalic: false,
    isUnderline: false
  });

  // ============================================
  // FUNCTION: AUTO-LOGIN ON PAGE REFRESH
  // Purpose: Keep user logged in when they refresh the page
  // ============================================
  useEffect(() => {
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
      setUsername(savedUsername);
      setIsLoggedIn(true);
      fetchNotesForUser(savedUsername);
    }
  }, []);

  // ============================================
  // FUNCTION: FETCH NOTES FOR SPECIFIC USER
  // Purpose: Load all notes and recycle bin items for a user
  // ============================================
  const fetchNotesForUser = async (user) => {
    try {
      const res = await axios.get(`${API_URL}/api/notes/${user}`);
      setNotes(res.data);
      const recycleRes = await axios.get(`${API_URL}/api/notes/${user}/recycle`);
      setRecycleBin(recycleRes.data);
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  };

  // ============================================
  // FUNCTION: HANDLE USER LOGIN
  // Purpose: Authenticate user and load their data
  // ============================================
  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }

    try {
      await axios.post(`${API_URL}/api/users/login`, {
        username: username.trim(),
        password
      });

      setIsLoggedIn(true);
      setError('');
      localStorage.setItem('username', username.trim()); // Save username to browser
      fetchNotes();
      fetchRecycleBin();
    } catch (err) {
      setError(err.response?.data?.message || 'Wrong password!');
    }
  };

  // ============================================
  // FUNCTION: HANDLE USER REGISTRATION
  // Purpose: Create new user account
  // ============================================
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
      await axios.post(`${API_URL}/api/users/register`, {
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

  // ============================================
  // FUNCTION: FETCH NOTES
  // Purpose: Get all active notes for logged-in user
  // ============================================
  const fetchNotes = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/notes/${username}`);
      setNotes(res.data);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Error fetching notes. Please try again.');
    }
  };

  // ============================================
  // FUNCTION: FETCH RECYCLE BIN
  // Purpose: Get all deleted notes for logged-in user
  // ============================================
  const fetchRecycleBin = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/notes/${username}/recycle`);
      setRecycleBin(res.data);
    } catch (err) {
      console.error('Error fetching recycle bin:', err);
      setError('Error fetching recycle bin. Please try again.');
    }
  };

  // ============================================
  // FUNCTION: TOGGLE BOLD FORMATTING
  // Purpose: Turn bold on/off in textarea
  // ============================================
  const toggleBold = () => {
    setTextFormat({ ...textFormat, isBold: !textFormat.isBold });
  };

  // ============================================
  // FUNCTION: TOGGLE ITALIC FORMATTING
  // Purpose: Turn italic on/off in textarea
  // ============================================
  const toggleItalic = () => {
    setTextFormat({ ...textFormat, isItalic: !textFormat.isItalic });
  };

  // ============================================
  // FUNCTION: TOGGLE UNDERLINE FORMATTING
  // Purpose: Turn underline on/off in textarea
  // ============================================
  const toggleUnderline = () => {
    setTextFormat({ ...textFormat, isUnderline: !textFormat.isUnderline });
  };

  // ============================================
  // FUNCTION: INCREASE FONT SIZE
  // Purpose: Make text bigger (max 32px)
  // ============================================
  const increaseFontSize = () => {
    if (textFormat.fontSize < 32) {
      setTextFormat({ ...textFormat, fontSize: textFormat.fontSize + 2 });
    }
  };

  // ============================================
  // FUNCTION: DECREASE FONT SIZE
  // Purpose: Make text smaller (min 12px)
  // ============================================
  const decreaseFontSize = () => {
    if (textFormat.fontSize > 12) {
      setTextFormat({ ...textFormat, fontSize: textFormat.fontSize - 2 });
    }
  };

  // ============================================
  // FUNCTION: SAVE NOTE
  // Purpose: Create new note or update existing one
  // Prevents double-save by disabling button while saving
  // ============================================
  const saveNote = async () => {
    if (!currentNote.title.trim() || !currentNote.content.trim()) {
      setError('Title and content are required');
      return;
    }

    // Prevent double-save by disabling button
    const saveButton = document.querySelector('.save-btn');
    if (saveButton) {
      saveButton.disabled = true;
      saveButton.textContent = 'Saving...';
    }

    try {
      if (editingId) {
        // Update existing note
        await axios.put(`${API_URL}/api/notes/${editingId}`, currentNote);
      } else {
        // Create new note
        await axios.post(`${API_URL}/api/notes`, { ...currentNote, username });
      }
      setCurrentNote({ title: '', content: '' });
      setEditingId(null);
      setError('');
      await fetchNotes();
      setShowNotesList(true);
      setActiveTab('notes'); // Switch to notes tab after saving
    } catch (err) {
      console.error('Error saving note:', err);
      setError('Error saving note. Please try again.');
    } finally {
      // Re-enable button
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = editingId ? 'Update Note' : 'Save Note';
      }
    }
  };

  // ============================================
  // FUNCTION: DELETE NOTE
  // Purpose: Move note to recycle bin (soft delete)
  // ============================================
  const deleteNote = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/notes/${id}`);
      fetchNotes();
      fetchRecycleBin();
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Error deleting note. Please try again.');
    }
  };

  // ============================================
  // FUNCTION: RESTORE NOTE
  // Purpose: Bring note back from recycle bin
  // ============================================
  const restoreNote = async (id) => {
    try {
      await axios.put(`${API_URL}/api/notes/${id}/restore`);
      fetchNotes();
      fetchRecycleBin();
    } catch (err) {
      console.error('Error restoring note:', err);
      setError('Error restoring note. Please try again.');
    }
  };

  // ============================================
  // FUNCTION: EMPTY RECYCLE BIN
  // Purpose: Permanently delete all notes in recycle bin
  // ============================================
  const emptyRecycleBin = async () => {
    if (!window.confirm('Permanently delete all notes in recycle bin? This cannot be undone!')) {
      return;
    }

    try {
      await Promise.all(
        recycleBin.map(note =>
          axios.delete(`${API_URL}/api/notes/${note._id}/permanent`)
        )
      );
      fetchRecycleBin();
    } catch (err) {
      console.error('Error emptying recycle bin:', err);
      setError('Error emptying recycle bin. Please try again.');
    }
  };

  // ============================================
  // FUNCTION: EDIT NOTE
  // Purpose: Load note into editor for editing
  // ============================================
  const editNote = (note) => {
    setCurrentNote({ title: note.title, content: note.content });
    setEditingId(note._id);
    setActiveTab('create'); // Switch to create tab when editing
    setShowNotesList(false);
  };

  // ============================================
  // FUNCTION: LOGOUT
  // Purpose: Clear all user data and return to login screen
  // ============================================
  const logout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    localStorage.removeItem('username'); // Clear saved username
    setNotes([]);
    setRecycleBin([]);
    setCurrentNote({ title: '', content: '' });
    setEditingId(null);
    setIsNewUser(false);
    setShowNotesList(false);
    setActiveTab('create');
  };

  // ============================================
  // FUNCTION: HANDLE TAB CLICK
  // Purpose: Switch between Create Note, My Notes, and Recycle Bin tabs
  // ============================================
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === 'notes') {
      setShowNotesList(true);
    } else if (tab === 'create') {
      setShowNotesList(false);
    }
  };

  // ============================================
  // RENDER: LOGIN SCREEN
  // Shows when user is not logged in
  // ============================================
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

  // ============================================
  // RENDER: MAIN APPLICATION
  // Shows after user logs in
  // ============================================
  return (
    <div className="app">
      {/* ============================================
          SECTION: HEADER
          Shows app name, username, and logout button
          ============================================ */}
      <header>
        <h1>Notecrypt</h1>
        <div className="user-info">
          <span>Welcome, {username}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      {/* ============================================
          SECTION: TABS
          Buttons to switch between Create Note, My Notes, and Recycle Bin
          ============================================ */}
      <div className="tabs">
        <button
          className={activeTab === 'create' ? 'active' : ''}
          onClick={() => handleTabClick('create')}
        >
          Create Note
        </button>
        <button
          className={activeTab === 'notes' ? 'active' : ''}
          onClick={() => handleTabClick('notes')}
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

      {/* ============================================
          SECTION: ERROR DISPLAY
          Shows error messages if something goes wrong
          ============================================ */}
      {error && <div className="error">{error}</div>}

      {/* ============================================
          SECTION: CREATE NOTE TAB (CENTERED)
          Only shows when 'Create Note' tab is active
          Contains: Title input, formatting toolbar, textarea, save button
          ============================================ */}
      {activeTab === 'create' && (
        <div className="main-content">
          <div className="note-editor">
            <h2>{editingId ? 'Edit Note' : 'Create New Note'}</h2>
            
            {/* Note Title Input */}
            <input
              type="text"
              placeholder="Note Title"
              value={currentNote.title}
              onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
            />

            {/* Text Formatting Toolbar */}
            <div className="formatting-toolbar">
              {/* Font Size Controls */}
              <button
                type="button"
                onClick={decreaseFontSize}
                className="format-btn"
                title="Decrease font size"
              >
                A-
              </button>

              <span className="font-size-display">{textFormat.fontSize}px</span>

              <button
                type="button"
                onClick={increaseFontSize}
                className="format-btn"
                title="Increase font size"
              >
                A+
              </button>

              <div className="toolbar-divider"></div>

              {/* Bold Button */}
              <button
                type="button"
                onClick={toggleBold}
                className={`format-btn ${textFormat.isBold ? 'active' : ''}`}
                title="Bold"
              >
                <strong>B</strong>
              </button>

              {/* Italic Button */}
              <button
                type="button"
                onClick={toggleItalic}
                className={`format-btn ${textFormat.isItalic ? 'active' : ''}`}
                title="Italic"
              >
                <em>I</em>
              </button>

              {/* Underline Button */}
              <button
                type="button"
                onClick={toggleUnderline}
                className={`format-btn ${textFormat.isUnderline ? 'active' : ''}`}
                title="Underline"
              >
                <u>U</u>
              </button>
            </div>

            {/* Note Content Textarea */}
            <textarea
              placeholder="Write your note here..."
              value={currentNote.content}
              onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
              rows="10"
              style={{
                fontSize: `${textFormat.fontSize}px`,
                fontWeight: textFormat.isBold ? 'bold' : 'normal',
                fontStyle: textFormat.isItalic ? 'italic' : 'normal',
                textDecoration: textFormat.isUnderline ? 'underline' : 'none'
              }}
            />

            {/* Save and Cancel Buttons */}
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
        </div>
      )}

      {/* ============================================
          SECTION: MY NOTES TAB
          Only shows when 'My Notes' tab is active
          Displays all saved notes with edit/delete buttons
          ============================================ */}
      {activeTab === 'notes' && (
        <div className="notes-list">
          <h2>Your Notes</h2>
          {notes.length === 0 ? (
            <p className="empty-state">No notes yet. Create your first note!</p>
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
      )}

      {/* ============================================
          SECTION: RECYCLE BIN TAB
          Only shows when 'Recycle Bin' tab is active
          Shows deleted notes with restore button and empty bin option
          ============================================ */}
      {activeTab === 'recycle' && (
        <div className="recycle-bin">
          {/* Header with Empty Bin button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>Recycle Bin</h2>
            {recycleBin.length > 0 && (
              <button
                onClick={emptyRecycleBin}
                className="delete-btn"
                style={{ padding: '8px 16px' }}
              >
                🗑️ Empty Bin
              </button>
            )}
          </div>
          
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
                  {' '}(Expires: {new Date(note.expiresAt).toLocaleDateString()})
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
