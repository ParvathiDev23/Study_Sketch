import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import './PomodoroPage.css';

const PRESETS = [
  { label: '15m', seconds: 15 * 60 },
  { label: '25m', seconds: 25 * 60 },
  { label: '45m', seconds: 45 * 60 },
  { label: '60m', seconds: 60 * 60 },
];

const AUDIO_OPTIONS = [
  { label: 'None (Silent)', value: '' },
  { label: '🎵 Lo-fi Beats', value: 'lofi' },
  { label: '🌧️ Rain Sounds', value: 'rain' },
  { label: '☕ Café Ambiance', value: 'cafe' },
  { label: '🐦 Forest Birds', value: 'forest' },
];

// Generate audio using Web Audio API (synthesized ambient sounds)
function createAmbientAudio(type, ctx) {
  if (type === 'rain') {
    // White noise filtered for rain
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    source.connect(filter);
    return { source, output: filter };
  }
  if (type === 'lofi') {
    // Gentle oscillator with modulation
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 220;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.3;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 15;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    osc.connect(filter);
    return { source: osc, output: filter, extra: [lfo] };
  }
  if (type === 'cafe') {
    // Brown noise for café ambiance
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (last + (0.02 * white)) / 1.02;
      last = data[i];
      data[i] *= 3.5;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return { source, output: source };
  }
  if (type === 'forest') {
    // Higher filtered noise for forest ambiance
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.2;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 0.5;
    source.connect(filter);
    return { source, output: filter };
  }
  return null;
}

export default function PomodoroPage() {
  const { currentUser } = useAuth();
  const [mode, setMode] = useState('timer'); // timer | stopwatch
  const [preset, setPreset] = useState(1); // index in PRESETS
  const [timeLeft, setTimeLeft] = useState(PRESETS[1].seconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Stopwatch
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [laps, setLaps] = useState([]);

  // Audio
  const [audioType, setAudioType] = useState('');
  const [volume, setVolume] = useState(0.5);
  const audioCtxRef = useRef(null);
  const audioNodesRef = useRef(null);
  const gainNodeRef = useRef(null);

  const intervalRef = useRef(null);

  const totalSeconds = PRESETS[preset].seconds;
  const circumference = 2 * Math.PI * 105;

  // Timer countdown
  useEffect(() => {
    if (mode !== 'timer' || !isRunning || isComplete) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          setIsComplete(true);
          // Save session
          saveSession(PRESETS[preset].seconds / 60);
          // Record study day
          recordStudyDay();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [mode, isRunning, isComplete, preset]);

  // Stopwatch
  useEffect(() => {
    if (mode !== 'stopwatch' || !isRunning) return;
    intervalRef.current = setInterval(() => {
      setStopwatchTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [mode, isRunning]);

  // Audio management
  useEffect(() => {
    // Cleanup previous audio
    if (audioNodesRef.current) {
      try {
        audioNodesRef.current.source.stop();
        if (audioNodesRef.current.extra) {
          audioNodesRef.current.extra.forEach(n => n.stop());
        }
      } catch (e) { /* ignore */ }
      audioNodesRef.current = null;
    }

    if (!audioType) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    const nodes = createAmbientAudio(audioType, ctx);
    if (!nodes) return;

    const gain = ctx.createGain();
    gain.gain.value = volume;
    gainNodeRef.current = gain;
    nodes.output.connect(gain);
    gain.connect(ctx.destination);
    nodes.source.start();
    audioNodesRef.current = nodes;

    return () => {
      try {
        nodes.source.stop();
        if (nodes.extra) nodes.extra.forEach(n => n.stop());
      } catch (e) { /* ignore */ }
    };
  }, [audioType]);

  // Volume changes
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  async function saveSession(minutes) {
    if (!currentUser) return;
    await addDoc(collection(db, 'pomodoroSessions'), {
      userId: currentUser.uid,
      durationMinutes: minutes,
      completedAt: new Date().toISOString()
    });
  }

  async function recordStudyDay() {
    if (!currentUser) return;
    const today = new Date().toISOString().split('T')[0];
    await addDoc(collection(db, 'studyDays'), {
      userId: currentUser.uid,
      date: today
    });
  }

  function handleStartPause() {
    if (isComplete) return;
    setIsRunning(!isRunning);
  }

  function handleReset() {
    setIsRunning(false);
    setIsComplete(false);
    if (mode === 'timer') {
      setTimeLeft(PRESETS[preset].seconds);
    } else {
      setStopwatchTime(0);
      setLaps([]);
    }
  }

  function handlePresetChange(idx) {
    setPreset(idx);
    setTimeLeft(PRESETS[idx].seconds);
    setIsRunning(false);
    setIsComplete(false);
  }

  function handleLap() {
    setLaps(prev => [...prev, stopwatchTime]);
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  const displayTime = mode === 'timer' ? timeLeft : stopwatchTime;
  const progress = mode === 'timer'
    ? ((totalSeconds - timeLeft) / totalSeconds) * circumference
    : 0;

  return (
    <div className="pomodoro-page">
      <div className={`pomodoro-card sketch-card ${isComplete ? 'timer-complete' : ''}`}>
        <h1>Focus Session</h1>

        {/* Mode Toggle */}
        <div className="mode-toggle">
          <button
            className={mode === 'timer' ? 'active' : ''}
            onClick={() => { setMode('timer'); handleReset(); }}
          >
            Timer
          </button>
          <button
            className={mode === 'stopwatch' ? 'active' : ''}
            onClick={() => { setMode('stopwatch'); handleReset(); }}
          >
            Stopwatch
          </button>
        </div>

        {/* Presets (timer mode only) */}
        {mode === 'timer' && (
          <div className="preset-buttons">
            {PRESETS.map((p, i) => (
              <button
                key={p.label}
                className={`preset-btn ${preset === i ? 'active' : ''}`}
                onClick={() => handlePresetChange(i)}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Timer Circle */}
        <div className="timer-circle-container">
          <svg className="timer-circle-svg" viewBox="0 0 220 220">
            <circle className="timer-circle-fill" cx="110" cy="110" r="100" />
            <circle className="timer-circle-bg" cx="110" cy="110" r="105" />
            <circle
              className="timer-circle-fg"
              cx="110" cy="110" r="105"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
            />
          </svg>
          <div className="timer-display">{formatTime(displayTime)}</div>
        </div>

        {/* Controls */}
        <div className="timer-controls">
          <button
            className="sketch-btn primary"
            onClick={handleStartPause}
            id="timer-start-btn"
          >
            {isComplete ? '✅ Done!' : isRunning ? 'Pause' : 'Start'}
          </button>
          {mode === 'stopwatch' && isRunning && (
            <button className="sketch-btn" onClick={handleLap} id="lap-btn">
              Lap
            </button>
          )}
          <button
            className="sketch-btn"
            onClick={handleReset}
            id="timer-reset-btn"
            style={{ color: 'var(--color-danger)' }}
          >
            Reset
          </button>
        </div>

        {/* Stopwatch Laps */}
        {mode === 'stopwatch' && laps.length > 0 && (
          <div className="stopwatch-laps">
            <ul className="lap-list">
              {laps.map((lap, i) => (
                <li key={i} className="lap-item">
                  <span className="lap-number">Lap {i + 1}</span>
                  <span>{formatTime(lap)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Ambient Audio */}
        <div className="audio-section">
          <h3>🎧 Ambient Audio</h3>
          <div className="audio-controls">
            <select
              className="sketch-select"
              value={audioType}
              onChange={e => setAudioType(e.target.value)}
              id="audio-select"
            >
              {AUDIO_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {audioType && (
              <input
                type="range"
                className="volume-slider"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                title="Volume"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
