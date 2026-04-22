import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import {
  collection, addDoc, deleteDoc, doc, updateDoc,
  query, where, onSnapshot, orderBy
} from 'firebase/firestore';
import './StickyNotesPage.css';

const NOTE_COLORS = [
  { name: 'yellow', hex: '#FFF9C4' },
  { name: 'pink', hex: '#F8BBD0' },
  { name: 'blue', hex: '#BBDEFB' },
  { name: 'green', hex: '#C8E6C9' },
  { name: 'purple', hex: '#E1BEE7' },
  { name: 'orange', hex: '#FFE0B2' },
];

export default function StickyNotesPage() {
  const { currentUser } = useAuth();
  const [notes, setNotes] = useState([]);
  const [selectedColor, setSelectedColor] = useState('yellow');
  const debounceTimers = useRef({});

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'stickyNotes'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [currentUser]);

  async function addNote() {
    await addDoc(collection(db, 'stickyNotes'), {
      userId: currentUser.uid,
      content: '',
      color: selectedColor,
      createdAt: new Date().toISOString()
    });
  }

  async function deleteNote(noteId) {
    await deleteDoc(doc(db, 'stickyNotes', noteId));
  }

  function handleContentChange(noteId, content) {
    // Update local state immediately for responsive typing
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, content } : n));
    // Debounce Firestore update
    if (debounceTimers.current[noteId]) {
      clearTimeout(debounceTimers.current[noteId]);
    }
    debounceTimers.current[noteId] = setTimeout(() => {
      updateDoc(doc(db, 'stickyNotes', noteId), { content });
    }, 500);
  }

  function formatDate(isoStr) {
    return new Date(isoStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div className="notes-page">
      <div className="notes-header">
        <h1>📝 Sticky Notes</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="color-picker">
            {NOTE_COLORS.map(c => (
              <div
                key={c.name}
                className={`color-dot ${selectedColor === c.name ? 'active' : ''}`}
                style={{ background: c.hex }}
                onClick={() => setSelectedColor(c.name)}
                title={c.name}
              />
            ))}
          </div>
          <button className="sketch-btn primary" onClick={addNote} id="add-note-btn">
            + Add Note
          </button>
        </div>
      </div>

      <div className="notes-board">
        {notes.length === 0 && (
          <div className="empty-notes">
            <div className="empty-icon">📝</div>
            <p>No sticky notes yet. Add one to get started!</p>
          </div>
        )}

        {notes.map((note, idx) => (
          <div
            key={note.id}
            className={`sticky-note ${note.color}`}
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <textarea
              className="note-textarea"
              placeholder="Write something..."
              value={note.content}
              onChange={e => handleContentChange(note.id, e.target.value)}
            />
            <div className="note-footer">
              <span className="note-date">{formatDate(note.createdAt)}</span>
              <button
                className="delete-note-btn"
                onClick={() => deleteNote(note.id)}
                title="Delete note"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
