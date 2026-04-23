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
  const [todos, setTodos] = useState([]);
  const [chartRange, setChartRange] = useState('week'); // week | month

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
    const unsubTodos = onSnapshot(
      query(collection(db, 'todos'), where('userId', '==', currentUser.uid)),
      (snap) => setTodos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => { unsubTopics(); unsubExams(); unsubSessions(); unsubTodos(); };
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

  // -- WEEKLY/MONTHLY CHART DATA --
  function getChartData() {
    const days = chartRange === 'week' ? 7 : 30;
    const labels = [];
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const dayLabel = chartRange === 'week'
        ? d.toLocaleDateString('en', { weekday: 'short' })
        : d.getDate().toString();
      labels.push(dayLabel);
      const dayMinutes = sessions
        .filter(s => s.completedAt && s.completedAt.startsWith(key))
        .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
      data.push(dayMinutes);
    }
    return { labels, data };
  }

  const chart = getChartData();
  const maxMinutes = Math.max(...chart.data, 1);

  // -- EXPORT PDF --
  function exportAsPDF() {
    const printContent = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Georgia', serif; padding: 40px; color: #2D2D2D; max-width: 700px; margin: 0 auto; }
  h1 { color: #6C7CE8; border-bottom: 2px solid #6C7CE8; padding-bottom: 8px; }
  h2 { color: #444; margin-top: 24px; }
  .stat { display: inline-block; text-align: center; margin-right: 30px; }
  .stat-num { font-size: 2rem; font-weight: bold; color: #6C7CE8; display: block; }
  .bar-container { display: flex; align-items: flex-end; gap: 4px; height: 100px; margin: 16px 0; }
  .bar { background: #6C7CE8; border-radius: 4px 4px 0 0; min-width: 20px; flex: 1; }
  .bar-label { text-align: center; font-size: 12px; color: #888; }
  .progress { background: #e0e0e0; height: 16px; border-radius: 8px; margin: 8px 0; }
  .fill { background: linear-gradient(90deg, #6C7CE8, #a0aaff); height: 100%; border-radius: 8px; }
  .exam-item { margin: 8px 0; }
  .todo-item { margin: 4px 0; }
  .footer { margin-top: 40px; font-size: 0.85rem; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 12px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <h1>📊 StudySketch Report</h1>
  <p>Generated on ${new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

  <h2>📈 Study Statistics</h2>
  <div class="stat"><span class="stat-num">${totalSessions}</span>Sessions</div>
  <div class="stat"><span class="stat-num">${totalMinutes}</span>Minutes</div>
  <div class="stat"><span class="stat-num">${totalHours}</span>Hours</div>

  <h2>📚 Course Progress — ${overallPct}%</h2>
  <div class="progress"><div class="fill" style="width: ${overallPct}%"></div></div>

  <h2>📝 Exam Breakdown</h2>
  ${examBreakdown.length === 0 ? '<p>No exams created yet.</p>' : examBreakdown.map(e => `
    <div class="exam-item">
      <strong>${e.name}</strong> — ${e.done}/${e.total} topics (${e.pct}%)
      <div class="progress"><div class="fill" style="width: ${e.pct}%; background: ${e.color}"></div></div>
    </div>
  `).join('')}

  <h2>✅ To-Do Summary</h2>
  <p>${todos.filter(t => t.isCompleted).length}/${todos.length} tasks completed</p>
  ${todos.slice(0, 20).map(t => `
    <div class="todo-item">${t.isCompleted ? '✅' : '⬜'} ${t.text || 'Untitled'}</div>
  `).join('')}

  <h2>📅 Last 7 Days Study Time</h2>
  <div class="bar-container">
    ${chart.data.map((mins, i) => `<div style="flex:1; text-align:center;"><div class="bar" style="height: ${Math.max(mins / maxMinutes * 80, 2)}px"></div><div class="bar-label">${chart.labels[i]}<br/>${mins}m</div></div>`).join('')}
  </div>

  <div class="footer">StudySketch — Study Smarter, Sketch Your Success</div>
</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(printContent);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }

  return (
    <div className="reports-page">
      <div className="reports-header">
        <h1>📊 Reports</h1>
        <button className="sketch-btn primary export-btn" onClick={exportAsPDF}>
          📥 Export PDF
        </button>
      </div>

      {/* Study Time Stats */}
      <div className="progress-card sketch-card">
        <h2>⏱️ Study Time</h2>
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

      {/* Weekly/Monthly Chart */}
      <div className="progress-card sketch-card">
        <div className="chart-header">
          <h2>📅 Study Activity</h2>
          <div className="chart-range-toggle">
            <button
              className={chartRange === 'week' ? 'active' : ''}
              onClick={() => setChartRange('week')}
            >Week</button>
            <button
              className={chartRange === 'month' ? 'active' : ''}
              onClick={() => setChartRange('month')}
            >Month</button>
          </div>
        </div>
        <div className="bar-chart">
          {chart.data.map((mins, i) => (
            <div key={i} className="bar-col">
              <div className="bar-value">{mins > 0 ? `${mins}m` : ''}</div>
              <div
                className="bar-fill"
                style={{ height: `${Math.max((mins / maxMinutes) * 100, 2)}%` }}
              />
              <div className="bar-label">{chart.labels[i]}</div>
            </div>
          ))}
        </div>
        {chart.data.every(d => d === 0) && (
          <p className="chart-empty">No study sessions yet. Start a Pomodoro to see your activity!</p>
        )}
      </div>

      {/* Course Progress */}
      <div className="progress-card sketch-card">
        <h2>📚 Course Progress</h2>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${overallPct}%` }} />
        </div>
        <p className="progress-text">{overallPct}% Completed ({completedTopics}/{totalTopics} topics)</p>
      </div>

      {/* Subject Breakdown */}
      <div className="progress-card sketch-card">
        <h2>📝 Subject Breakdown</h2>
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

      {/* To-Do Summary */}
      {todos.length > 0 && (
        <div className="progress-card sketch-card">
          <h2>✅ To-Do Progress</h2>
          <div className="todo-summary">
            <div className="todo-summary-stat">
              <span className="stat-number">{todos.filter(t => t.isCompleted).length}</span>
              <span className="stat-label">Done</span>
            </div>
            <div className="todo-summary-stat">
              <span className="stat-number">{todos.filter(t => !t.isCompleted).length}</span>
              <span className="stat-label">Pending</span>
            </div>
            <div className="todo-pct-ring">
              <svg viewBox="0 0 36 36" className="todo-ring-svg">
                <path
                  className="todo-ring-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="todo-ring-fill"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  strokeDasharray={`${todos.length > 0 ? Math.round((todos.filter(t => t.isCompleted).length / todos.length) * 100) : 0}, 100`}
                />
                <text x="18" y="20.5" className="todo-ring-text">
                  {todos.length > 0 ? Math.round((todos.filter(t => t.isCompleted).length / todos.length) * 100) : 0}%
                </text>
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
