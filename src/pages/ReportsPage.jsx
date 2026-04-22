import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import './ReportsPage.css';

const subjectColors = ['#6C7CE8', '#FFD54F', '#81C784', '#E57373', '#4FC3F7', '#BA68C8', '#FF8A65'];

export default function ReportsPage() {
  const { currentUser } = useAuth();
  const [topics, setTopics] = useState([]);
  const [exams, setExams] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    const unsubTopics = onSnapshot(
      query(collection(db, 'topics'), where('userId', '==', currentUser.uid)),
      (snap) => setTopics(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubExams = onSnapshot(
      query(collection(db, 'exams'), where('userId', '==', currentUser.uid)),
      (snap) => setExams(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubSessions = onSnapshot(
      query(collection(db, 'pomodoroSessions'), where('userId', '==', currentUser.uid)),
      (snap) => setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => { unsubTopics(); unsubExams(); unsubSessions(); };
  }, [currentUser]);

  // Calculate overall progress
  const totalTopics = topics.length;
  const completedTopics = topics.filter(t => t.isCompleted).length;
  const overallPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Per-exam breakdown
  const examBreakdown = exams.map((exam, idx) => {
    const examTopics = topics.filter(t => t.examId === exam.id);
    const done = examTopics.filter(t => t.isCompleted).length;
    const total = examTopics.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { ...exam, done, total, pct, color: subjectColors[idx % subjectColors.length] };
  });

  // Study stats
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const totalSessions = sessions.length;

  return (
    <div className="reports-page">
      <h1>📊 Reports</h1>

      {/* Course Progress */}
      <div className="progress-card sketch-card">
        <h2>Course Progress</h2>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${overallPct}%` }} />
        </div>
        <p className="progress-text">{overallPct}% Completed</p>
      </div>

      {/* Subject Breakdown */}
      <div className="progress-card sketch-card">
        <h2>Subject Breakdown</h2>
        {examBreakdown.length === 0 ? (
          <p style={{ color: 'var(--color-muted)' }}>No exams yet. Create one from the Dashboard!</p>
        ) : (
          <div className="subject-list">
            {examBreakdown.map(exam => (
              <div key={exam.id} className="subject-item">
                <div className="subject-header">
                  <span className="subject-name">{exam.name}</span>
                  <span className="subject-pct">{exam.done}/{exam.total} topics ({exam.pct}%)</span>
                </div>
                <div className="subject-bar">
                  <div
                    className="subject-bar-fill"
                    style={{ width: `${exam.pct}%`, background: exam.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Study Time Stats */}
      <div className="progress-card sketch-card">
        <h2>Study Time</h2>
        <div className="stats-grid">
          <div className="stat-box">
            <span className="stat-number">{totalSessions}</span>
            <span className="stat-label">Sessions</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">{totalMinutes}</span>
            <span className="stat-label">Minutes</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">{totalHours}</span>
            <span className="stat-label">Hours</span>
          </div>
        </div>
      </div>
    </div>
  );
}
