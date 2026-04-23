import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import './ProfilePage.css';

const AVATARS = ['🎓', '📚', '✏️', '🧠', '🦉', '🐱', '🌟', '🎨', '🚀', '🎯', '🌸', '🦊'];

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('🎓');
  const [studyGoal, setStudyGoal] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Badge States
  const [badges, setBadges] = useState({
    nightOwl: false,
    ironFocus: false,
    fireStarter: false,
  });

  useEffect(() => {
    if (!currentUser) return;
    async function loadProfile() {
      try {
        const ref = doc(db, 'profiles', currentUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setDisplayName(data.displayName || currentUser.displayName || '');
          setAvatar(data.avatar || '🎓');
          setStudyGoal(data.studyGoal || '');
        } else {
          setDisplayName(currentUser.displayName || currentUser.email?.split('@')[0] || '');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setDisplayName(currentUser.displayName || currentUser.email?.split('@')[0] || '');
      }

      // Check Badges
      try {
        const qStudy = query(collection(db, 'studyDays'), where('userId', '==', currentUser.uid));
        const snapStudy = await getDocs(qStudy);
        
        const qPomo = query(collection(db, 'pomodoroSessions'), where('userId', '==', currentUser.uid));
        const snapPomo = await getDocs(qPomo);
        
        const sessions = snapPomo.docs.map(d => d.data());
        const days = snapStudy.docs.length;

        // Condition 1: Fire Starter (>= 7 logged study days)
        const fireStarter = days >= 7;

        // Condition 2: Focus Master (Total focus minutes >= 120)
        const totalFocus = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
        const ironFocus = totalFocus >= 120;

        // Condition 3: Night Owl (Session completed between 10 PM and 4 AM)
        const nightOwl = sessions.some(s => {
          if (!s.completedAt) return false;
          const hour = new Date(s.completedAt).getHours();
          return hour >= 22 || hour <= 4;
        });

        setBadges({ nightOwl, ironFocus, fireStarter });
      } catch (err) {
        console.error('Error fetching badge data:', err);
      }

      setLoading(false);
    }
    loadProfile();
  }, [currentUser]);

  async function handleSave() {
    await setDoc(doc(db, 'profiles', currentUser.uid), {
      displayName,
      avatar,
      studyGoal,
      email: currentUser.email,
      updatedAt: new Date().toISOString()
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <div className="profile-page"><p>Loading...</p></div>;

  return (
    <div className="profile-page">
      <h1 className="page-title">👤 Profile</h1>

      <div className="profile-card sketch-card">
        {/* Avatar Selection */}
        <div className="profile-section">
          <h2>Choose Avatar</h2>
          <div className="avatar-grid">
            {AVATARS.map(a => (
              <button
                key={a}
                className={`avatar-option ${avatar === a ? 'selected' : ''}`}
                onClick={() => setAvatar(a)}
              >
                {a}
              </button>
            ))}
          </div>
          <div className="current-avatar">{avatar}</div>
        </div>

        {/* Display Name */}
        <div className="profile-section">
          <h2>Display Name</h2>
          <input
            className="sketch-input"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Your name..."
          />
        </div>

        {/* Study Goal */}
        <div className="profile-section">
          <h2>Study Goal</h2>
          <textarea
            className="sketch-input"
            value={studyGoal}
            onChange={e => setStudyGoal(e.target.value)}
            placeholder="e.g. Study 2 hours daily, Ace my finals..."
            rows={3}
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Theme Toggle */}
        <div className="profile-section">
          <h2>Theme</h2>
          <div className="theme-toggle-row">
            <span>{theme === 'light' ? '☀️ Light Mode' : '🌙 Dark Mode'}</span>
            <button className="theme-toggle-btn" onClick={toggleTheme}>
              <div className={`toggle-track ${theme === 'dark' ? 'dark' : ''}`}>
                <div className="toggle-thumb" />
              </div>
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="profile-section">
          <h2>Account</h2>
          <p className="account-email">📧 {currentUser?.email}</p>
        </div>

        <button className="sketch-btn primary save-btn" onClick={handleSave}>
          {saved ? '✅ Saved!' : '💾 Save Profile'}
        </button>
      </div>

      <div className="achievements-section sticker-card sketch-card">
        <h2>🏆 Trophy Case</h2>
        <p className="achievements-desc">Study hard to unlock these hand-drawn badges!</p>
        
        <div className="badges-grid">
          <div className={`badge-item ${badges.nightOwl ? 'unlocked' : 'locked'}`}>
            <span className="badge-icon">🦉</span>
            <h4>Night Owl</h4>
            <p>Study past 10 PM</p>
          </div>
          <div className={`badge-item ${badges.ironFocus ? 'unlocked' : 'locked'}`}>
            <span className="badge-icon">🧘‍♂️</span>
            <h4>Focus Master</h4>
            <p>Log 120 total minutes</p>
          </div>
          <div className={`badge-item ${badges.fireStarter ? 'unlocked' : 'locked'}`}>
            <span className="badge-icon">🔥</span>
            <h4>Fire Starter</h4>
            <p>Log 7 total study days</p>
          </div>
        </div>
      </div>
    </div>
  );
}
