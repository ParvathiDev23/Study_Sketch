import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import {
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc,
  query, where, onSnapshot, orderBy
} from 'firebase/firestore';
import './FlashcardsPage.css';

export default function FlashcardsPage() {
  const { currentUser } = useAuth();
  const [decks, setDecks] = useState([]);
  const [activeDeck, setActiveDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showNewDeck, setShowNewDeck] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  // Load decks
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'flashcardDecks'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setDecks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [currentUser]);

  // Load cards for active deck
  useEffect(() => {
    if (!activeDeck) { setCards([]); return; }
    const q = query(
      collection(db, 'flashcards'),
      where('deckId', '==', activeDeck.id)
    );
    const unsub = onSnapshot(q, (snap) => {
      setCards(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [activeDeck]);

  async function createDeck() {
    if (!newDeckTitle.trim()) return;
    await addDoc(collection(db, 'flashcardDecks'), {
      userId: currentUser.uid,
      title: newDeckTitle.trim(),
      createdAt: new Date().toISOString()
    });
    setNewDeckTitle('');
    setShowNewDeck(false);
  }

  async function deleteDeck(deckId) {
    // Delete all cards first
    const q = query(collection(db, 'flashcards'), where('deckId', '==', deckId));
    const snap = await getDocs(q);
    snap.forEach(async (d) => await deleteDoc(doc(db, 'flashcards', d.id)));
    await deleteDoc(doc(db, 'flashcardDecks', deckId));
    if (activeDeck?.id === deckId) {
      setActiveDeck(null);
      setCurrentCard(0);
    }
  }

  async function addCard() {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    await addDoc(collection(db, 'flashcards'), {
      deckId: activeDeck.id,
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      isKnown: false
    });
    setNewQuestion('');
    setNewAnswer('');
  }

  async function markCard(cardId, known) {
    await updateDoc(doc(db, 'flashcards', cardId), { isKnown: known });
    // Auto-advance
    if (currentCard < cards.length - 1) {
      setCurrentCard(prev => prev + 1);
      setIsFlipped(false);
    }
  }

  function openDeck(deck) {
    setActiveDeck(deck);
    setCurrentCard(0);
    setIsFlipped(false);
  }

  // Deck list view
  if (!activeDeck) {
    return (
      <div className="flashcards-page">
        <div className="flashcard-header">
          <h1>🃏 Flashcards</h1>
          <button
            className="sketch-btn primary"
            onClick={() => setShowNewDeck(true)}
            id="new-deck-btn"
          >
            + New Deck
          </button>
        </div>

        {decks.length === 0 && !showNewDeck && (
          <div className="empty-decks">
            <div className="empty-icon">🃏</div>
            <p>No decks yet. Create your first flashcard deck!</p>
          </div>
        )}

        {showNewDeck && (
          <div className="modal-overlay" onClick={() => setShowNewDeck(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2>New Deck</h2>
              <div className="modal-form">
                <input
                  className="sketch-input"
                  placeholder="Deck title (e.g. Biology Chapter 3)"
                  value={newDeckTitle}
                  onChange={e => setNewDeckTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createDeck()}
                  id="deck-title-input"
                  autoFocus
                />
                <div className="modal-buttons">
                  <button className="sketch-btn" onClick={() => setShowNewDeck(false)}>Cancel</button>
                  <button className="sketch-btn primary" onClick={createDeck}>Create</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="deck-grid stagger-children">
          {decks.map(deck => (
            <div key={deck.id} className="deck-item sketch-card" onClick={() => openDeck(deck)}>
              <h3>{deck.title}</h3>
              <div className="deck-actions" onClick={e => e.stopPropagation()}>
                <button onClick={() => openDeck(deck)}>📖 Study</button>
                <button className="delete-deck" onClick={() => deleteDeck(deck.id)}>🗑️ Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Card viewer
  const card = cards[currentCard];

  return (
    <div className="flashcards-page">
      <div className="flashcard-viewer">
        <div className="viewer-header">
          <h2>{activeDeck.title}</h2>
          <button className="back-btn" onClick={() => setActiveDeck(null)}>← Back to Decks</button>
        </div>

        {cards.length === 0 ? (
          <div className="empty-decks">
            <div className="empty-icon">📝</div>
            <p>No cards yet. Add some below!</p>
          </div>
        ) : (
          <>
            <p className="flip-hint">Click card to flip</p>
            <div className="flip-card-wrapper" onClick={() => setIsFlipped(!isFlipped)}>
              <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`}>
                <div className="flip-card-front">
                  <span className="flip-card-label">Question</span>
                  <span className="flip-card-text">{card?.question}</span>
                </div>
                <div className="flip-card-back">
                  <span className="flip-card-label">Answer</span>
                  <span className="flip-card-text">{card?.answer}</span>
                </div>
              </div>
            </div>

            <div className="card-nav">
              <button
                onClick={() => { setCurrentCard(prev => prev - 1); setIsFlipped(false); }}
                disabled={currentCard === 0}
              >
                ← Prev
              </button>
              <span className="card-counter">{currentCard + 1} / {cards.length}</span>
              <button
                onClick={() => { setCurrentCard(prev => prev + 1); setIsFlipped(false); }}
                disabled={currentCard >= cards.length - 1}
              >
                Next →
              </button>
            </div>

            <div className="mark-buttons">
              <button
                className="mark-btn known"
                onClick={() => markCard(card.id, true)}
              >
                ✅ Known
              </button>
              <button
                className="mark-btn review"
                onClick={() => markCard(card.id, false)}
              >
                🔄 Review Again
              </button>
            </div>
          </>
        )}

        {/* Add card form */}
        <div className="add-card-inline">
          <h3>Add New Card</h3>
          <div className="add-card-form">
            <textarea
              placeholder="Question..."
              value={newQuestion}
              onChange={e => setNewQuestion(e.target.value)}
              id="card-question-input"
            />
            <textarea
              placeholder="Answer..."
              value={newAnswer}
              onChange={e => setNewAnswer(e.target.value)}
              id="card-answer-input"
            />
            <button className="sketch-btn primary" onClick={addCard} id="add-card-btn">
              + Add Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
