import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import OnboardingTour from './OnboardingTour';
import AmbientPlayer from '../AudioPlayer/AmbientPlayer';
import './AppLayout.css';

export default function AppLayout() {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('studysketch_tour_complete');
    if (!hasSeenTour) {
      setShowTour(true);
    }
  }, []);

  function handleCompleteTour() {
    localStorage.setItem('studysketch_tour_complete', 'true');
    setShowTour(false);
  }

  return (
    <div className="app-layout">
      {showTour && <OnboardingTour onComplete={handleCompleteTour} />}
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
      <AmbientPlayer />
    </div>
  );
}
