import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!username.trim()) {
          setError('Username is required');
          setLoading(false);
          return;
        }
        await signup(email, password, username);
      } else {
        await login(email, password);
      }
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'Email already in use'
        : err.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : err.code === 'auth/weak-password'
        ? 'Password should be at least 6 characters'
        : err.code === 'auth/invalid-email'
        ? 'Invalid email address'
        : 'Something went wrong. Please try again.';
      setError(msg);
    }
    setLoading(false);
  }

  return (
    <div className="login-page">
      {/* Decorative doodles */}
      <div className="login-doodle top-left">✏️</div>
      <div className="login-doodle bottom-right">📖</div>

      <div className="login-card sketch-card">
        <h1 className="login-logo">StudySketch</h1>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className={`username-field ${isSignUp ? 'show' : ''}`}>
            <input
              type="text"
              className="sketch-input"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              id="username-input"
              autoComplete="username"
            />
          </div>

          <input
            type="email"
            className="sketch-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            id="email-input"
            autoComplete="email"
          />

          <input
            type="password"
            className="sketch-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            id="password-input"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
          />

          {error && <p className="login-error">{error}</p>}

          <div className="login-buttons">
            {isSignUp ? (
              <button
                type="submit"
                className="sketch-btn primary"
                disabled={loading}
                id="signup-btn"
              >
                {loading ? 'Creating...' : 'Sign Up'}
              </button>
            ) : (
              <button
                type="submit"
                className="sketch-btn primary"
                disabled={loading}
                id="login-btn"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            )}
          </div>
        </form>

        <p className="login-toggle">
          {isSignUp ? (
            <>Already have an account? <span onClick={() => { setIsSignUp(false); setError(''); }}>Login</span></>
          ) : (
            <>Don't have an account? <span onClick={() => { setIsSignUp(true); setError(''); }}>Sign Up</span></>
          )}
        </p>
      </div>
    </div>
  );
}
