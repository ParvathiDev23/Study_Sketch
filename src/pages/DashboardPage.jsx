import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import {
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc,
  query, where, orderBy, onSnapshot
} from 'firebase/firestore';
import './DashboardPage.css';

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [exams, setExams] = useState([]);
  const [topics, setTopics] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newExam, setNewExam] = useState({ name: '', date: '', topics: [] });
  const [topicInput, setTopicInput] = useState('');
  const [streakDays, setStreakDays] = useState([]);
  const [streak, setStreak] = useState(0);

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Student';

  // Load exams
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'exams'),
      where('userId', '==', currentUser.uid),
      orderBy('examDate', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setExams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [currentUser]);

  // Load topics for all exams
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'topics'),
      where('userId', '==', currentUser.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      setTopics(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [currentUser]);

  // Load study streak
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'studyDays'),
      where('userId', '==', currentUser.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const days = snap.docs.map(d => d.data().date);
      setStreakDays(days);
      // Calculate streak
      let count = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        if (days.includes(dateStr)) {
          count++;
        } else if (i > 0) break;
      }
      setStreak(count);
    });
    return unsub;
  }, [currentUser]);

  async function handleCreateExam() {
    if (!newExam.name || !newExam.date) return;
    const examRef = await addDoc(collection(db, 'exams'), {
      userId: currentUser.uid,
      name: newExam.name,
      examDate: newExam.date,
      createdAt: new Date().toISOString()
    });
    // Add topics
    for (const t of newExam.topics) {
      await addDoc(collection(db, 'topics'), {
        userId: currentUser.uid,
        examId: examRef.id,
        name: t,
        isCompleted: false
      });
    }
    setNewExam({ name: '', date: '', topics: [] });
    setTopicInput('');
    setShowModal(false);
  }

  async function handleDeleteExam(examId) {
    await deleteDoc(doc(db, 'exams', examId));
    // Delete associated topics
    const q = query(collection(db, 'topics'), where('examId', '==', examId));
    const snap = await getDocs(q);
    snap.forEach(async (d) => await deleteDoc(doc(db, 'topics', d.id)));
  }

  async function toggleTopic(topicId, current) {
    await updateDoc(doc(db, 'topics', topicId), { isCompleted: !current });
  }

  function addTopic() {
    if (!topicInput.trim()) return;
    setNewExam(prev => ({ ...prev, topics: [...prev.topics, topicInput.trim()] }));
    setTopicInput('');
  }

  function removeTopic(idx) {
    setNewExam(prev => ({ ...prev, topics: prev.topics.filter((_, i) => i !== idx) }));
  }

  // Generate last 28 days for streak grid
  const last28Days = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last28Days.push(d.toISOString().split('T')[0]);
  }
  const todayStr = new Date().toISOString().split('T')[0];

  const motivationalMessages = [
    "Keep going, you're doing great! 🌟",
    "Every page counts! 📚",
    "Your future self will thank you! 💪",
    "Small steps lead to big achievements! 🚀",
    "Stay curious, stay consistent! ✨"
  ];

  return (
    <div className="dashboard-page">
      {/* Welcome Banner */}
      <div className="welcome-banner sketch-card">
        <h1>Welcome, {displayName}!</h1>
        <button
          className="sketch-btn primary"
          onClick={() => setShowModal(true)}
          id="new-exam-btn"
        >
          + New Exam
        </button>
      </div>

      {/* Study Streak */}
      <div className="streak-section">
        <div className="streak-card sketch-card">
          <h2>🔥 Study Streak</h2>
          <div className="streak-info">
            <span className="streak-fire">🔥</span>
            <span className="streak-count">
              {streak} <small>day{streak !== 1 ? 's' : ''} streak</small>
            </span>
          </div>
          <div className="streak-grid">
            {last28Days.map(day => (
              <div
                key={day}
                className={`streak-day ${streakDays.includes(day) ? 'active' : ''} ${day === todayStr ? 'today' : ''}`}
                title={day}
              />
            ))}
          </div>
          <p className="streak-message">
            {motivationalMessages[streak % motivationalMessages.length]}
          </p>
        </div>
      </div>

      {/* Study Plan & My Exams */}
      <div className="dashboard-grid">
        <div className="dash-card sketch-card">
          <h2>Study Plan</h2>
          {topics.length === 0 ? (
            <p className="empty-text">Create an exam to see topics!</p>
          ) : (
            <ul className="topic-list">
              {topics.map(t => (
                <li key={t.id} className={`topic-item ${t.isCompleted ? 'completed' : ''}`}>
                  <input
                    type="checkbox"
                    checked={t.isCompleted}
                    onChange={() => toggleTopic(t.id, t.isCompleted)}
                  />
                  <span>{t.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="dash-card sketch-card">
          <h2>My Exams</h2>
          {exams.length === 0 ? (
            <p className="empty-text">Empty</p>
          ) : (
            <ul className="exam-list">
              {exams.map(exam => (
                <li key={exam.id} className="exam-item">
                  <div>
                    <span className="exam-name">{exam.name}</span>
                    <br />
                    <span className="exam-date">{new Date(exam.examDate).toLocaleDateString()}</span>
                  </div>
                  <button
                    className="delete-exam-btn"
                    onClick={() => handleDeleteExam(exam.id)}
                    title="Delete exam"
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* New Exam Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>📝 New Exam</h2>
            <div className="modal-form">
              <div>
                <label>Exam Name</label>
                <input
                  className="sketch-input"
                  placeholder="e.g. Math Final"
                  value={newExam.name}
                  onChange={e => setNewExam(prev => ({ ...prev, name: e.target.value }))}
                  id="exam-name-input"
                />
              </div>
              <div>
                <label>Exam Date</label>
                <input
                  type="date"
                  className="sketch-input"
                  value={newExam.date}
                  onChange={e => setNewExam(prev => ({ ...prev, date: e.target.value }))}
                  id="exam-date-input"
                />
              </div>
              <div className="topics-input-area">
                <label>Topics</label>
                <div className="topic-tag-list">
                  {newExam.topics.map((t, i) => (
                    <span key={i} className="topic-tag">
                      {t} <button onClick={() => removeTopic(i)}>×</button>
                    </span>
                  ))}
                </div>
                <div className="topic-input-row">
                  <input
                    className="sketch-input"
                    placeholder="Add a topic..."
                    value={topicInput}
                    onChange={e => setTopicInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                    id="topic-input"
                  />
                  <button className="sketch-btn" onClick={addTopic} type="button">+</button>
                </div>
              </div>
              <div className="modal-buttons">
                <button className="sketch-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="sketch-btn primary" onClick={handleCreateExam} id="create-exam-btn">
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
