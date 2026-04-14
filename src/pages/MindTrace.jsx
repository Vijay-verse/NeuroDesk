import React, { useState, useEffect } from 'react';
import { Save, Calendar } from 'lucide-react';

const MOODS = [
  { id: 'amazing', emoji: '🤩', label: 'Amazing' },
  { id: 'happy', emoji: '😊', label: 'Happy' },
  { id: 'neutral', emoji: '😐', label: 'Neutral' },
  { id: 'sad', emoji: '😔', label: 'Sad' },
  { id: 'anxious', emoji: '😰', label: 'Anxious' },
  { id: 'frustrated', emoji: '😤', label: 'Frustrated' }
];

const MindTrace = () => {
  const [selectedMood, setSelectedMood] = useState('neutral');
  const [wins, setWins] = useState('');
  const [content, setContent] = useState('');
  const [energy, setEnergy] = useState(5);
  const [entries, setEntries] = useState([]);

  const fetchEntries = async () => {
    try {
      const token = localStorage.getItem('neurodesk_token');
      const res = await fetch('/api/journal', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setEntries(data || []);
    } catch (err) {
      console.error('Failed to fetch journal entries');
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('neurodesk_token');
      // Find emoji from MOODS
      const moodInfo = MOODS.find(m => m.id === selectedMood);
      
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mood: selectedMood,
          moodEmoji: moodInfo?.emoji || '😐',
          wins,
          content,
          energy
        })
      });

      const data = await res.json();
      if (res.ok) {
        setWins('');
        setContent('');
        setEnergy(5);
        fetchEntries();
      } else {
        alert(data.error || 'Failed to preserve your thought. Try again.');
      }
    } catch (err) {
      console.error('Failed to save entry');
      alert('Connection lost. Please check your internet or server status.');
    }
  };

  return (
    <section className="page active">
      <div className="page-header">
        <div>
          <h1 className="page-title">MindTrace 🌊</h1>
          <p className="page-subtitle">Track your emotional landscape. Build self-awareness. Grow.</p>
        </div>
      </div>

      <div className="mindtrace-layout">
        <div className="glass-card journal-card">
          <h3 className="journal-heading">Today's Entry</h3>
          <p className="journal-date-label">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

          <div className="mood-section">
            <label className="field-label">How are you feeling?</label>
            <div className="mood-selector">
              {MOODS.map(m => (
                <button 
                  key={m.id}
                  className={`mood-btn ${selectedMood === m.id ? 'selected' : ''}`}
                  onClick={() => setSelectedMood(m.id)}
                >
                  <span className="mood-emoji">{m.emoji}</span>
                  <span className="mood-label">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="journal-fields">
            <div className="field-group">
              <label className="field-label">Today's Wins ✨</label>
              <input 
                type="text" placeholder="What went well today?" 
                value={wins} onChange={(e) => setWins(e.target.value)} 
              />
            </div>
            <div className="field-group">
              <label className="field-label">Journal Entry</label>
              <textarea 
                placeholder="Let your thoughts flow freely…" rows="5"
                value={content} onChange={(e) => setContent(e.target.value)} 
              ></textarea>
            </div>
            <div className="field-group">
              <label className="field-label">Energy Level</label>
              <div className="energy-slider-wrap">
                <input 
                  type="range" min="1" max="10" value={energy} 
                  onChange={(e) => setEnergy(e.target.value)}
                  className="energy-slider" 
                />
                <span className="energy-label">{energy}/10</span>
              </div>
            </div>
          </div>

          <button className="btn-primary btn-save-journal" onClick={handleSave}>
            <Save size={16} /> Save Entry
          </button>
        </div>

        <div className="mood-history-panel">
          <div className="glass-card past-logs-card">
            <div className="card-header">
              <h3>Past Entries</h3>
              <span className="log-count">{entries.length} entries</span>
            </div>
            <div className="past-logs-list">
              {entries.length > 0 ? entries.map(entry => (
                <div key={entry.id} className="past-log-item">
                  <div className="past-log-header">
                    <div className="past-log-mood">
                      <span>{MOODS.find(m => m.id === entry.mood)?.emoji || '😐'}</span>
                      <span style={{ textTransform: 'capitalize' }}>{entry.mood}</span>
                    </div>
                    <span className="past-log-date">Today</span>
                  </div>
                  <p className="past-log-content">{entry.content}</p>
                  <div className="past-log-energy">Energy: {entry.energy}/10</div>
                </div>
              )) : (
                <div className="log-empty">Start journaling to see your history.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MindTrace;
