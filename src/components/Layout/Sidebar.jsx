import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useState } from 'react';
import './Sidebar.css';

export default function Sidebar() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  const links = [
    { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/todo', icon: '📋', label: 'To-Do' },
    { to: '/reports', icon: '📊', label: 'Reports' },
    { to: '/pomodoro', icon: '⏱️', label: 'Pomodoro' },
    { to: '/flashcards', icon: '🃏', label: 'Flashcards' },
    { to: '/notes', icon: '📝', label: 'Sticky Notes' },
    { to: '/canvas', icon: '🎨', label: 'Whiteboard' },
    { to: '/profile', icon: '👤', label: 'Profile' },
  ];

  return (
    <>
      {/* Hamburger button for mobile */}
      <button
        className={`hamburger-btn ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(!mobileOpen)}
        id="hamburger-btn"
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <nav className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">StudySketch</div>

        <div className="sidebar-nav stagger-children">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
              id={`nav-${link.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <span className="icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Dark mode toggle */}
        <button className="sidebar-theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        <button className="sidebar-logout" onClick={handleLogout} id="logout-btn">
          <span className="icon">🚪</span>
          Logout
        </button>
      </nav>
    </>
  );
}

