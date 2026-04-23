import { useState, useEffect, useRef } from 'react';
import './AmbientPlayer.css';

const AUDIO_OPTIONS = [
  { label: 'None (Silent)', value: '' },
  { label: '🎵 Lo-fi Beats', value: 'lofi' },
  { label: '🌧️ Rain Sounds', value: 'rain' },
  { label: '☕ Café Ambiance', value: 'cafe' },
  { label: '🐦 Forest Birds', value: 'forest' },
];

function createAmbientAudio(type, ctx) {
  if (type === 'rain') {
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
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    source.connect(filter);
    return { source, output: filter };
  }
  if (type === 'forest') {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 2000;
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 2;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 500;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();
    
    // Chirp gating
    const gate = ctx.createGain();
    gate.gain.value = 0;
    const gateLfo = ctx.createOscillator();
    gateLfo.type = 'square';
    gateLfo.frequency.value = 0.5;
    gateLfo.connect(gate.gain);
    gateLfo.start();
    osc.connect(gate);
    
    return { source: osc, output: gate, extra: [lfo, gateLfo] };
  }
  return null;
}

export default function AmbientPlayer() {
  const [audioType, setAudioType] = useState('');
  const [volume, setVolume] = useState(0.2);
  const [isOpen, setIsOpen] = useState(false);
  const audioCtxRef = useRef(null);
  const gainNodeRef = useRef(null);
  const audioNodesRef = useRef(null);

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
    
    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
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

  // Handle interacting to resume audio context
  const handleInteraction = () => {
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  return (
    <div className={`ambient-player-widget ${isOpen ? 'open' : ''} sticker-card sketch-card`} onClick={handleInteraction}>
      <button 
        className="ambient-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Ambient Sounds"
      >
        {audioType ? '🎧 Playing' : '🎵 Sounds'}
      </button>

      {isOpen && (
        <div className="ambient-controls animate-fade-in-up">
          <div className="ambient-header">
            <h4>Focus Sounds</h4>
          </div>
          
          <select
            className="sketch-select ambient-select"
            value={audioType}
            onChange={(e) => setAudioType(e.target.value)}
          >
            {AUDIO_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {audioType !== '' && (
            <div className="ambient-volume">
              <label>Volume: {Math.round(volume * 100)}%</label>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="sketch-range"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
