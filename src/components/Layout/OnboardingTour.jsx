import { useState, useEffect } from 'react';
import './OnboardingTour.css';

const steps = [
  {
    target: '.sidebar-logo',
    title: 'Welcome to StudySketch! ✏️',
    content: 'Let me show you around your new sketch-themed study hub.',
    position: 'right'
  },
  {
    target: '#new-exam-btn',
    title: 'Plan Your Exams 📚',
    content: 'Add exams manually or let our AI analyze your notes to generate a study plan instantly!',
    position: 'bottom'
  },
  {
    target: '#nav-pomodoro',
    title: 'Stay Focused ⏱️',
    content: 'Use the Pomodoro timer with ambient sounds to get in the zone and track your study hours.',
    position: 'right'
  },
  {
    target: '#nav-to-do',
    title: 'Manage Tasks 📋',
    content: 'Keep track of your daily assignments and set priorities.',
    position: 'right'
  },
  {
    target: '#nav-reports',
    title: 'Track Progress 📈',
    content: 'View your study stats and export them to PDF!',
    position: 'right'
  }
];

export default function OnboardingTour({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  useEffect(() => {
    function updateHighlight() {
      const el = document.querySelector(steps[currentStep].target);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        // Scroll into view if needed
        if (rect.bottom > window.innerHeight || rect.top < 0) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        setTargetRect(null);
      }
    }

    // Small delay to allow DOM to render to catch elements
    const timer = setTimeout(updateHighlight, 300);
    window.addEventListener('resize', updateHighlight);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateHighlight);
    };
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const step = steps[currentStep];

  return (
    <>
      <div className="onboarding-overlay" />
      
      {targetRect && (
        <div 
          className="onboarding-highlight"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16
          }}
        />
      )}

      <div 
        className="onboarding-tooltip sketch-card"
        style={getTooltipStyle(targetRect, step.position)}
      >
        <button className="tour-skip" onClick={onComplete}>Skip</button>
        <h3>{step.title}</h3>
        <p>{step.content}</p>
        <div className="tour-footer">
          <span className="tour-progress">{currentStep + 1} of {steps.length}</span>
          <button className="sketch-btn primary" onClick={handleNext}>
            {currentStep === steps.length - 1 ? "Let's Go! 🚀" : 'Next'}
          </button>
        </div>
      </div>
    </>
  );
}

function getTooltipStyle(rect, position) {
  if (!rect) {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }
  
  // Default fallback (center of screen) if window is too small
  if (window.innerWidth < 600) {
     return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }

  const offset = 24; // Distance from highlight
  
  if (position === 'right') {
    return {
      top: Math.max(20, rect.top + rect.height/2 - 100), // Approximate half-height
      left: rect.right + offset
    };
  }
  
  if (position === 'bottom') {
    return {
      top: rect.bottom + offset,
      left: Math.max(20, rect.left + rect.width/2 - 150) // Approximate half-width
    };
  }

  return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
}
