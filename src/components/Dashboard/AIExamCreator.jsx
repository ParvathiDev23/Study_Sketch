import { useState, useRef } from 'react';
import { analyzeNotesWithAI, getYouTubeSearchUrl, getArticleSearchUrl } from '../../lib/gemini';
import { extractTextFromFiles } from '../../lib/fileProcessor';
import './AIExamCreator.css';

const GEMINI_KEY_STORAGE = 'studysketch_gemini_key';

export default function AIExamCreator({ onCreateExam, onCancel }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(GEMINI_KEY_STORAGE) || '');
  const [apiKeyInput, setApiKeyInput] = useState(apiKey);
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [error, setError] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const fileInputRef = useRef(null);

  function saveApiKey() {
    localStorage.setItem(GEMINI_KEY_STORAGE, apiKeyInput);
    setApiKey(apiKeyInput);
  }

  function handleFiles(newFiles) {
    const fileArray = Array.from(newFiles);
    const valid = fileArray.filter(f =>
      f.type === 'application/pdf' ||
      f.type.startsWith('text/') ||
      f.name.endsWith('.txt') ||
      f.name.endsWith('.md') ||
      f.type.startsWith('image/')
    );
    setFiles(prev => [...prev, ...valid]);
  }

  function removeFile(idx) {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  }

  function getFileIcon(file) {
    if (file.type === 'application/pdf') return '📄';
    if (file.type?.startsWith('image/')) return '🖼️';
    return '📝';
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  async function handleAnalyze() {
    if (files.length === 0) return;
    if (!apiKey) {
      setError('Please set your Gemini API key first.');
      return;
    }

    setLoading(true);
    setError('');
    setAiResult(null);

    try {
      // Step 1: Extract text from files
      setLoadingStage('📖 Reading your notes...');
      const extracted = await extractTextFromFiles(files);
      const combinedText = extracted
        .map(r => `--- ${r.name} ---\n${r.text}`)
        .join('\n\n');

      if (combinedText.trim().length < 20) {
        throw new Error('Could not extract enough text from the uploaded files. Please try different files.');
      }

      // Step 2: Analyze with AI
      setLoadingStage('🧠 AI is analyzing your notes...');
      const result = await analyzeNotesWithAI(combinedText, apiKey);

      // Step 3: Process results
      setLoadingStage('✨ Generating study plan...');
      await new Promise(r => setTimeout(r, 500)); // Brief pause for UX

      setAiResult(result);
      setExamName(result.examName || '');
      setSelectedTopics(result.topics.map((_, i) => i)); // Select all by default

    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    }

    setLoading(false);
    setLoadingStage('');
  }

  function toggleTopic(idx) {
    setSelectedTopics(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  }

  function handleCreate() {
    if (!examName.trim() || !examDate || selectedTopics.length === 0) return;

    const topics = selectedTopics.map(idx => ({
      name: aiResult.topics[idx].name,
      estimatedMinutes: aiResult.topics[idx].estimatedMinutes,
      youtubeQuery: aiResult.topics[idx].youtubeQuery,
      articleQuery: aiResult.topics[idx].articleQuery,
    }));

    onCreateExam({
      name: examName.trim(),
      date: examDate,
      topics,
      aiGenerated: true,
      totalEstimatedHours: aiResult.totalEstimatedHours,
      summary: aiResult.summary,
    });
  }

  // ====== RENDER: API Key Setup ======
  const renderApiKeySection = () => (
    <div className="api-key-section">
      <p>
        🔑 Enter your free <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Gemini API key</a> to enable AI analysis
      </p>
      <div className="api-key-row">
        <input
          className="sketch-input"
          type="password"
          placeholder="Paste API key here..."
          value={apiKeyInput}
          onChange={e => setApiKeyInput(e.target.value)}
        />
        <button className="sketch-btn primary" onClick={saveApiKey} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          Save
        </button>
      </div>
      {apiKey && (
        <div className="api-key-saved">✅ API key saved</div>
      )}
    </div>
  );

  // ====== RENDER: File Upload ======
  const renderUploadArea = () => (
    <>
      <div
        className={`file-drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
      >
        <span className="drop-icon">📂</span>
        <span className="drop-text">Drop your notes here</span>
        <span className="drop-hint">PDF, TXT, MD files supported</span>
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept=".pdf,.txt,.md,.text"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="uploaded-files">
          {files.map((file, idx) => (
            <div key={idx} className="uploaded-file">
              <div className="file-info">
                <span className="file-icon">{getFileIcon(file)}</span>
                <div>
                  <span className="file-name">{file.name}</span>
                  <br />
                  <span className="file-size">{formatSize(file.size)}</span>
                </div>
              </div>
              <button className="remove-file" onClick={() => removeFile(idx)}>✕</button>
            </div>
          ))}
        </div>
      )}

      <button
        className="sketch-btn primary analyze-btn"
        onClick={handleAnalyze}
        disabled={files.length === 0 || !apiKey}
      >
        🧠 Analyze with AI
      </button>
    </>
  );

  // ====== RENDER: Loading ======
  const renderLoading = () => (
    <div className="ai-loading">
      <div className="loading-spinner" />
      <p>Analyzing your notes...</p>
      <p className="loading-stage">{loadingStage}</p>
    </div>
  );

  // ====== RENDER: Results ======
  const renderResults = () => (
    <div className="ai-results">
      {/* Summary */}
      <div className="ai-summary">
        <strong>📋 Summary:</strong> {aiResult.summary}
      </div>

      {/* Time Estimate */}
      <div className="time-estimate">
        <span className="time-icon">⏱️</span>
        <span>
          Estimated study time: <strong>{aiResult.totalEstimatedHours} hours</strong>
          {' '}({aiResult.topics.length} topics)
        </span>
      </div>

      {/* Exam name + date */}
      <div className="exam-name-edit">
        <label>Exam Name</label>
        <input
          className="sketch-input"
          value={examName}
          onChange={e => setExamName(e.target.value)}
          placeholder="Exam name..."
        />
      </div>
      <div className="exam-name-edit">
        <label>Exam Date</label>
        <input
          type="date"
          className="sketch-input"
          value={examDate}
          onChange={e => setExamDate(e.target.value)}
        />
      </div>

      {/* Topics */}
      <div className="ai-topics-section">
        <h3>📚 Study Plan ({selectedTopics.length}/{aiResult.topics.length} selected)</h3>
        <ul className="ai-topics-list">
          {aiResult.topics.map((topic, idx) => (
            <li key={idx} className="ai-topic-item">
              <input
                type="checkbox"
                checked={selectedTopics.includes(idx)}
                onChange={() => toggleTopic(idx)}
              />
              <div className="ai-topic-details">
                <span className="ai-topic-name">{topic.name}</span>
                <div className="ai-topic-meta">
                  <span className="ai-topic-time">
                    ⏱️ ~{topic.estimatedMinutes} min
                  </span>
                  <div className="ai-topic-links">
                    <a
                      href={getYouTubeSearchUrl(topic.youtubeQuery)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="youtube-link"
                    >
                      ▶ YouTube
                    </a>
                    <a
                      href={getArticleSearchUrl(topic.articleQuery)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="article-link"
                    >
                      📖 Articles
                    </a>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Action buttons */}
      <div className="modal-buttons">
        <button className="sketch-btn" onClick={onCancel}>Cancel</button>
        <button
          className="sketch-btn primary"
          onClick={handleCreate}
          disabled={!examName.trim() || !examDate || selectedTopics.length === 0}
        >
          ✅ Create Exam
        </button>
      </div>
    </div>
  );

  // ====== RENDER: Error ======
  const renderError = () => (
    <div className="ai-error">
      <p>❌ {error}</p>
      <button className="sketch-btn" onClick={() => { setError(''); setAiResult(null); }}>
        Try Again
      </button>
    </div>
  );

  return (
    <div className="ai-creator">
      {!apiKey && renderApiKeySection()}
      {apiKey && !loading && !aiResult && !error && renderApiKeySection()}

      {loading ? renderLoading() : error ? renderError() : aiResult ? renderResults() : (apiKey && renderUploadArea())}
    </div>
  );
}
