import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AppLayout from './components/Layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ReportsPage from './pages/ReportsPage';
import PomodoroPage from './pages/PomodoroPage';
import FlashcardsPage from './pages/FlashcardsPage';
import StickyNotesPage from './pages/StickyNotesPage';
import CanvasPage from './pages/CanvasPage';
import TodoPage from './pages/TodoPage';
import ProfilePage from './pages/ProfilePage';

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'var(--font-heading)',
        fontSize: '2rem',
        color: 'var(--color-primary)'
      }}>
        <span style={{ animation: 'pulse 1.5s ease infinite' }}>Loading...</span>
      </div>
    );
  }
  return currentUser ? children : <Navigate to="/" />;
}

function PublicRoute({ children }) {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  return currentUser ? <Navigate to="/dashboard" /> : children;
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } />
            <Route element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/todo" element={<TodoPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/pomodoro" element={<PomodoroPage />} />
              <Route path="/flashcards" element={<FlashcardsPage />} />
              <Route path="/notes" element={<StickyNotesPage />} />
              <Route path="/canvas" element={<CanvasPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;

