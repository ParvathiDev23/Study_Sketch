import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import {
  collection, addDoc, deleteDoc, doc, updateDoc,
  query, where, orderBy, onSnapshot
} from 'firebase/firestore';
import './TodoPage.css';

const PRIORITIES = [
  { value: 'high', label: '🔴 High', color: '#E57373' },
  { value: 'medium', label: '🟡 Medium', color: '#FFD54F' },
  { value: 'low', label: '🟢 Low', color: '#81C784' },
];

export default function TodoPage() {
  const { currentUser } = useAuth();
  const [todos, setTodos] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState('medium');
  const [filter, setFilter] = useState('all'); // all | active | completed

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'todos'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setTodos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [currentUser]);

  async function addTodo() {
    if (!newTask.trim()) return;
    await addDoc(collection(db, 'todos'), {
      userId: currentUser.uid,
      text: newTask.trim(),
      priority,
      isCompleted: false,
      createdAt: new Date().toISOString()
    });
    setNewTask('');
  }

  async function toggleTodo(id, current) {
    await updateDoc(doc(db, 'todos', id), { isCompleted: !current });
  }

  async function deleteTodo(id) {
    await deleteDoc(doc(db, 'todos', id));
  }

  const filtered = todos.filter(t => {
    if (filter === 'active') return !t.isCompleted;
    if (filter === 'completed') return t.isCompleted;
    return true;
  });

  const completedCount = todos.filter(t => t.isCompleted).length;

  return (
    <div className="todo-page">
      <h1 className="page-title">📋 To-Do List</h1>

      {/* Progress bar */}
      {todos.length > 0 && (
        <div className="todo-progress sketch-card">
          <div className="todo-progress-info">
            <span>{completedCount}/{todos.length} tasks done</span>
            <span className="todo-percent">{Math.round((completedCount / todos.length) * 100)}%</span>
          </div>
          <div className="todo-progress-bar">
            <div
              className="todo-progress-fill"
              style={{ width: `${(completedCount / todos.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Add task */}
      <div className="todo-add sketch-card">
        <div className="todo-add-row">
          <input
            className="sketch-input"
            placeholder="What do you need to do?"
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTodo()}
          />
          <select
            className="sketch-select todo-priority-select"
            value={priority}
            onChange={e => setPriority(e.target.value)}
          >
            {PRIORITIES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <button className="sketch-btn primary" onClick={addTodo}>Add</button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="todo-filters">
        {['all', 'active', 'completed'].map(f => (
          <button
            key={f}
            className={`todo-filter ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'all' && ` (${todos.length})`}
            {f === 'active' && ` (${todos.length - completedCount})`}
            {f === 'completed' && ` (${completedCount})`}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="todo-list">
        {filtered.length === 0 ? (
          <div className="todo-empty sketch-card">
            <span className="todo-empty-icon">{filter === 'completed' ? '🎉' : '✨'}</span>
            <p>{filter === 'completed' ? 'No completed tasks yet' : 'No tasks! Add one above'}</p>
          </div>
        ) : (
          filtered.map(todo => (
            <div
              key={todo.id}
              className={`todo-item sketch-card ${todo.isCompleted ? 'completed' : ''}`}
            >
              <input
                type="checkbox"
                checked={todo.isCompleted}
                onChange={() => toggleTodo(todo.id, todo.isCompleted)}
              />
              <span
                className="todo-priority-dot"
                style={{ background: PRIORITIES.find(p => p.value === todo.priority)?.color }}
              />
              <span className="todo-text">{todo.text}</span>
              <button className="todo-delete" onClick={() => deleteTodo(todo.id)}>✕</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
