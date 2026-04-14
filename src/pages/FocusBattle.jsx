import React, { useState, useEffect, useRef } from 'react';

const MODES = {
  pomodoro:   { label: 'Focus',       seconds: 25 * 60 },
  shortbreak: { label: 'Short Break', seconds: 5 * 60 },
  longbreak:  { label: 'Long Break',  seconds: 15 * 60 }
};

const FocusBattle = () => {
  const [mode, setMode] = useState('pomodoro');
  const [secondsLeft, setSecondsLeft] = useState(MODES.pomodoro.seconds);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(1);
  const [distractions, setDistractions] = useState({
    Instagram: 0, YouTube: 0, Twitter: 0, WhatsApp: 0, Gaming: 0, Other: 0
  });
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionLogs, setSessionLogs] = useState([]);
  const [focusTask, setFocusTask] = useState('');

  const timerRef = useRef(null);

  const startTimer = () => {
    setIsRunning(true);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    clearInterval(timerRef.current);
  };

  const resetTimer = () => {
    pauseTimer();
    setSecondsLeft(MODES[mode].seconds);
  };

  const skipTimer = () => {
    pauseTimer();
    handleTimerComplete();
  };

  const handleTimerComplete = async () => {
    setIsRunning(false);
    const wasFocus = mode === 'pomodoro';
    const elapsed = MODES[mode].seconds - secondsLeft;
    const score = wasFocus ? 15 : 5;

    if (wasFocus) {
      setSessionScore(prev => prev + score);
      setSessionCount(prev => (prev % 4) + 1);
      
      // Save to API
      try {
        const token = localStorage.getItem('neurodesk_token');
        await fetch('/api/focus', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            seconds: MODES[mode].seconds,
            score,
            task: focusTask,
            distractions: Object.values(distractions).reduce((a, b) => a + b, 0)
          })
        });
      } catch (err) {
        console.error('Failed to log focus session');
      }
    }

    setSessionLogs(prev => [{
      mode: MODES[mode].label,
      seconds: MODES[mode].seconds,
      score,
      date: new Date().toISOString()
    }, ...prev].slice(0, 10));

    // Reset for next
    setSecondsLeft(MODES[mode].seconds);
  };

  const changeMode = (newMode) => {
    if (isRunning) return;
    setMode(newMode);
    setSecondsLeft(MODES[newMode].seconds);
  };

  const logDistraction = (type) => {
    setDistractions(prev => ({ ...prev, [type]: prev[type] + 1 }));
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const circumference = 2 * Math.PI * 115;
  const strokeDashoffset = circumference * (1 - (secondsLeft / MODES[mode].seconds));

  return (
    <section className="page active">
      <div className="page-header">
        <div>
          <h1 className="page-title">Focus Battle ⚡</h1>
          <p className="page-subtitle">Enter the zone. Eliminate distractions. Win your session.</p>
        </div>
        <div className="focus-score-badge">
          <span className="focus-badge-label">Session Score</span>
          <span className="focus-badge-value">{sessionScore}</span>
        </div>
      </div>

      <div className="focus-layout">
        <div className="timer-card glass-card">
          <div className="timer-mode-tabs">
            {Object.keys(MODES).map(m => (
              <button 
                key={m}
                className={`mode-tab ${mode === m ? 'active' : ''}`}
                onClick={() => changeMode(m)}
              >
                {MODES[m].label}
              </button>
            ))}
          </div>

          <div className="timer-display-wrap">
            <svg className="timer-ring" width="260" height="260" viewBox="0 0 260 260">
              <circle className="ring-bg" cx="130" cy="130" r="115" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10"/>
              <circle 
                className="ring-progress" cx="130" cy="130" r="115" fill="none" 
                stroke="url(#ringGrad)" strokeWidth="10" strokeLinecap="round" 
                strokeDasharray={circumference} 
                strokeDashoffset={strokeDashoffset} 
                transform="rotate(-90 130 130)"
              />
              <defs>
                <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop stopColor="#a78bfa"/>
                  <stop offset="1" stopColor="#38bdf8"/>
                </linearGradient>
              </defs>
            </svg>
            <div className="timer-inner">
              <div className="timer-time">{formatTime(secondsLeft)}</div>
              <div className="timer-status">{isRunning ? 'Focusing...' : 'Ready'}</div>
              <div className="timer-session-count">Session {sessionCount}/4</div>
            </div>
          </div>

          <div className="timer-controls">
            <button className="btn-timer-secondary" onClick={resetTimer}>Reset</button>
            <button 
              className="btn-timer-primary" 
              onClick={isRunning ? pauseTimer : startTimer}
              style={{ background: isRunning ? 'linear-gradient(135deg, #f87171, #fb923c)' : '' }}
            >
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button className="btn-timer-secondary" onClick={skipTimer}>Skip</button>
          </div>

          <div className="focus-task-input">
            <label>What are you focusing on?</label>
            <input 
              type="text" value={focusTask} 
              placeholder="e.g. Chapter 5 – Thermodynamics…" 
              onChange={(e) => setFocusTask(e.target.value)}
            />
          </div>
        </div>

        <div className="distraction-panel">
          <div className="glass-card distraction-card">
            <h3 className="distraction-title">⚔️ Distraction Blockers</h3>
            <p className="distraction-sub">Tap to log a distraction urge. Stay strong!</p>
            <div className="distraction-buttons">
              {Object.keys(distractions).map(type => (
                <button key={type} className="distraction-btn" onClick={() => logDistraction(type)}>
                  <span className="dist-icon">
                    {type === 'Instagram' ? '📸' : type === 'YouTube' ? '▶️' : type === 'Twitter' ? '🐦' : type === 'WhatsApp' ? '💬' : type === 'Gaming' ? '🎮' : '🌐'}
                  </span>
                  <span>{type}</span>
                  {distractions[type] > 0 && <span className="dist-count visible">{distractions[type]}</span>}
                </button>
              ))}
            </div>
            <div className="distraction-total">
              Total distractions avoided: <strong>{Object.values(distractions).reduce((a, b) => a + b, 0)}</strong>
            </div>
          </div>

          <div className="glass-card session-log-card">
            <h3>📋 Session Log</h3>
            <div className="session-log-list">
              {sessionLogs.length > 0 ? sessionLogs.map((log, i) => (
                <div key={i} className="session-log-item">
                  <span style={{ fontSize: '16px' }}>✅</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 12, color: '#f1f5f9' }}>{log.mode}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{Math.floor(log.seconds / 60)}m Session</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#4ade80', fontWeight: 700, fontSize: 12 }}>+{log.score}</div>
                    <div style={{ fontSize: 11, color: '#475569' }}>Today</div>
                  </div>
                </div>
              )) : (
                <div className="log-empty">Complete sessions to see logs.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FocusBattle;
