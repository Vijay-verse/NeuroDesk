import React, { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_MODES = {
  pomodoro:   { label: 'Focus',       seconds: 25 * 60 },
  shortbreak: { label: 'Short Break', seconds: 5 * 60 },
  longbreak:  { label: 'Long Break',  seconds: 15 * 60 }
};

// XP thresholds per level
const LEVEL_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000, 5000, 6200, 7600, 9200, 11000, 13000, 15500, 18500, 22000];

const BADGES = [
  { id: 'first_session', name: 'First Focus', icon: '🎯', desc: 'Complete 1 session', check: (d) => d.totalSessions >= 1 },
  { id: 'five_sessions', name: 'Getting Serious', icon: '⚡', desc: 'Complete 5 sessions', check: (d) => d.totalSessions >= 5 },
  { id: 'ten_sessions', name: 'Focus Warrior', icon: '🗡️', desc: 'Complete 10 sessions', check: (d) => d.totalSessions >= 10 },
  { id: 'fifty_sessions', name: 'Grandmaster', icon: '👑', desc: 'Complete 50 sessions', check: (d) => d.totalSessions >= 50 },
  { id: 'one_hour', name: 'Hour Power', icon: '⏰', desc: '1 hour total focus', check: (d) => d.totalMinutes >= 60 },
  { id: 'five_hours', name: 'Marathon Mind', icon: '🏃', desc: '5 hours total focus', check: (d) => d.totalMinutes >= 300 },
  { id: 'streak_3', name: 'Consistency', icon: '🔥', desc: '3-day streak', check: (d) => d.streak >= 3 },
  { id: 'streak_7', name: 'Unstoppable', icon: '💎', desc: '7-day streak', check: (d) => d.streak >= 7 },
  { id: 'no_distract', name: 'Zen Mode', icon: '🧘', desc: 'Session with 0 distractions', check: (d) => d.hadPerfectSession },
  { id: 'level_5', name: 'Rising Star', icon: '⭐', desc: 'Reach Level 5', check: (d) => d.level >= 5 },
  { id: 'level_10', name: 'Elite Focus', icon: '🌟', desc: 'Reach Level 10', check: (d) => d.level >= 10 },
  { id: 'early_bird', name: 'Early Bird', icon: '🌅', desc: 'Focus before 8 AM', check: (d) => d.earlyBird },
];

const getLevel = (xp) => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
};

const getXPForNextLevel = (level) => {
  if (level >= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 5000;
  return LEVEL_THRESHOLDS[level]; // next level threshold
};

const FocusBattle = ({ addToast }) => {
  const [mode, setMode] = useState('pomodoro');
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_MODES.pomodoro.seconds);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(1);
  const [distractions, setDistractions] = useState({
    Instagram: 0, YouTube: 0, Twitter: 0, WhatsApp: 0, Gaming: 0, Other: 0
  });
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionLogs, setSessionLogs] = useState([]);
  const [focusTask, setFocusTask] = useState('');
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);

  // Gamification state
  const [xp, setXp] = useState(parseInt(localStorage.getItem('neurodesk_xp') || '0', 10));
  const [level, setLevel] = useState(parseInt(localStorage.getItem('neurodesk_level') || '1', 10));
  const [earnedBadges, setEarnedBadges] = useState(JSON.parse(localStorage.getItem('neurodesk_badges') || '[]'));

  const timerRef = useRef(null);
  const tabSwitchRef = useRef(0);

  // Tab switch detection
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && isRunning && mode === 'pomodoro') {
        tabSwitchRef.current += 1;
        setTabSwitches(tabSwitchRef.current);
        setShowTabWarning(true);
        setTimeout(() => setShowTabWarning(false), 3000);

        // Deduct XP
        const currentXP = parseInt(localStorage.getItem('neurodesk_xp') || '0', 10);
        const newXP = Math.max(0, currentXP - 5);
        localStorage.setItem('neurodesk_xp', newXP.toString());
        setXp(newXP);

        if (addToast) addToast('Tab switch detected! -5 XP ⚠️', 'warning');

        // Play warning sound
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 440;
          gain.gain.value = 0.1;
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
        } catch { /* no audio */ }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isRunning, mode, addToast]);

  const startTimer = () => {
    setIsRunning(true);
    tabSwitchRef.current = 0;
    setTabSwitches(0);
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
    setSecondsLeft(DEFAULT_MODES[mode].seconds);
  };

  const skipTimer = () => {
    pauseTimer();
    handleTimerComplete();
  };

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    clearInterval(timerRef.current);
    const wasFocus = mode === 'pomodoro';
    const totalDistractions = Object.values(distractions).reduce((a, b) => a + b, 0);
    const totalTabSwitches = tabSwitchRef.current;

    // Calculate XP
    let earnedXP = wasFocus ? 25 : 5;
    if (wasFocus && totalDistractions === 0 && totalTabSwitches === 0) earnedXP += 10; // Perfect session bonus
    const streakData = JSON.parse(localStorage.getItem('neurodesk_streak') || '{"count":0}');
    if (streakData.count >= 3) earnedXP = Math.floor(earnedXP * 1.5); // Streak multiplier

    // Update XP
    const currentXP = parseInt(localStorage.getItem('neurodesk_xp') || '0', 10);
    const newXP = currentXP + earnedXP;
    const oldLevel = getLevel(currentXP);
    const updatedLevel = getLevel(newXP);

    localStorage.setItem('neurodesk_xp', newXP.toString());
    localStorage.setItem('neurodesk_level', updatedLevel.toString());
    setXp(newXP);
    setLevel(updatedLevel);

    // Level up?
    if (updatedLevel > oldLevel) {
      setNewLevel(updatedLevel);
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
      if (addToast) addToast(`🎉 Level Up! You're now Level ${updatedLevel}!`, 'success');
    }

    // Update streak
    if (wasFocus) {
      const today = new Date().toISOString().split('T')[0];
      const lastDate = streakData.lastDate;
      let newCount = streakData.count;

      if (lastDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        newCount = lastDate === yesterday ? newCount + 1 : 1;
      }

      localStorage.setItem('neurodesk_streak', JSON.stringify({ count: newCount, lastDate: today }));

      // Update focus history
      const history = JSON.parse(localStorage.getItem('neurodesk_focus_history') || '[]');
      const todayEntry = history.find(h => h.date === today);
      if (todayEntry) {
        todayEntry.minutes += DEFAULT_MODES[mode].seconds / 60;
        todayEntry.sessions += 1;
        todayEntry.xp += earnedXP;
      } else {
        history.push({ date: today, minutes: DEFAULT_MODES[mode].seconds / 60, sessions: 1, xp: earnedXP });
      }
      localStorage.setItem('neurodesk_focus_history', JSON.stringify(history));

      // Check for perfect session
      if (totalDistractions === 0 && totalTabSwitches === 0) {
        localStorage.setItem('neurodesk_perfect_session', 'true');
      }

      // Early bird check
      if (new Date().getHours() < 8) {
        localStorage.setItem('neurodesk_early_bird', 'true');
      }

      setSessionCount(prev => (prev % 4) + 1);
      setSessionScore(prev => prev + earnedXP);
    }

    // Check badges
    const totalHistory = JSON.parse(localStorage.getItem('neurodesk_focus_history') || '[]');
    const totalSessions = totalHistory.reduce((s, h) => s + h.sessions, 0);
    const totalMinutes = totalHistory.reduce((s, h) => s + h.minutes, 0);
    const updatedStreak = JSON.parse(localStorage.getItem('neurodesk_streak') || '{"count":0}');

    const badgeCheckData = {
      totalSessions,
      totalMinutes,
      streak: updatedStreak.count,
      level: updatedLevel,
      hadPerfectSession: localStorage.getItem('neurodesk_perfect_session') === 'true',
      earlyBird: localStorage.getItem('neurodesk_early_bird') === 'true',
    };

    const currentBadges = JSON.parse(localStorage.getItem('neurodesk_badges') || '[]');
    const newBadges = [...currentBadges];
    BADGES.forEach(badge => {
      if (!newBadges.includes(badge.id) && badge.check(badgeCheckData)) {
        newBadges.push(badge.id);
        if (addToast) addToast(`🏆 Badge earned: ${badge.name}!`, 'success');
      }
    });
    localStorage.setItem('neurodesk_badges', JSON.stringify(newBadges));
    setEarnedBadges(newBadges);

    // Dispatch event for topbar to update
    window.dispatchEvent(new Event('neurodesk_xp_update'));

    // Save to API (fire and forget)
    try {
      const token = localStorage.getItem('neurodesk_token');
      if (token && wasFocus) {
        fetch('/api/focus', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            seconds: DEFAULT_MODES[mode].seconds,
            score: earnedXP,
            task: focusTask,
            distractions: totalDistractions
          })
        }).catch(() => {});
      }
    } catch { /* ignore */ }

    // Session log
    setSessionLogs(prev => [{
      mode: DEFAULT_MODES[mode].label,
      seconds: DEFAULT_MODES[mode].seconds,
      score: earnedXP,
      date: new Date().toISOString()
    }, ...prev].slice(0, 10));

    // Play completion sound
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.08;
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch { /* no audio */ }

    if (addToast) addToast(`Session complete! +${earnedXP} XP 🎉`, 'success');
    setSecondsLeft(DEFAULT_MODES[mode].seconds);
  }, [mode, distractions, focusTask, addToast]);

  const changeMode = (newMode) => {
    if (isRunning) return;
    setMode(newMode);
    setSecondsLeft(DEFAULT_MODES[newMode].seconds);
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
  const strokeDashoffset = circumference * (1 - (secondsLeft / DEFAULT_MODES[mode].seconds));
  const xpForNext = getXPForNextLevel(level);
  const xpForCurrent = LEVEL_THRESHOLDS[level - 1] || 0;
  const xpProgress = xpForNext > xpForCurrent ? ((xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100 : 100;

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Focus Battle ⚡</h1>
          <p className="page-subtitle">Enter the zone. Eliminate distractions. Win your session.</p>
        </div>
        <div className="xp-level-display">
          <div className="level-badge">
            <span className="level-icon">⭐</span> Level {level}
          </div>
          <div className="xp-bar-wrap">
            <div className="xp-bar-fill" style={{ width: `${Math.min(xpProgress, 100)}%` }}></div>
          </div>
          <div className="xp-text">{xp} / {xpForNext} XP</div>
        </div>
      </div>

      <div className="focus-layout">
        <div className="timer-card glass-card">
          <div className="timer-mode-tabs">
            {Object.keys(DEFAULT_MODES).map(m => (
              <button
                key={m}
                className={`mode-tab ${mode === m ? 'active' : ''}`}
                onClick={() => changeMode(m)}
              >
                {DEFAULT_MODES[m].label}
              </button>
            ))}
          </div>

          <div className="timer-display-wrap">
            <svg className="timer-ring" width="260" height="260" viewBox="0 0 260 260">
              <circle className="ring-bg" cx="130" cy="130" r="115" fill="none" stroke="rgba(128,128,128,0.1)" strokeWidth="10"/>
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

          {showTabWarning && (
            <div className="tab-warning">
              ⚠️ Tab switch detected! -5 XP. Stay focused!
            </div>
          )}

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
              {tabSwitches > 0 && <> | Tab switches: <strong>{tabSwitches}</strong></>}
            </div>
          </div>

          {/* Badges */}
          <div className="glass-card badges-card">
            <div className="card-header">
              <h3>🏆 Badges</h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{earnedBadges.length}/{BADGES.length}</span>
            </div>
            <div className="badges-grid">
              {BADGES.map(badge => (
                <div key={badge.id} className={`badge-item ${earnedBadges.includes(badge.id) ? 'earned' : 'locked'}`}>
                  <span className="badge-icon">{badge.icon}</span>
                  <span className="badge-name">{badge.name}</span>
                  <span className="badge-desc">{badge.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card session-log-card">
            <h3>📋 Session Log</h3>
            <div className="session-log-list">
              {sessionLogs.length > 0 ? sessionLogs.map((log, i) => (
                <div key={i} className="session-log-item">
                  <span style={{ fontSize: '16px' }}>✅</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)' }}>{log.mode}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{Math.floor(log.seconds / 60)}m Session</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#4ade80', fontWeight: 700, fontSize: 12 }}>+{log.score} XP</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Today</div>
                  </div>
                </div>
              )) : (
                <div className="log-empty">Complete sessions to see logs.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Level Up Toast */}
      {showLevelUp && (
        <div className="level-up-toast">
          <div className="lu-emoji">🎉</div>
          <h2>Level {newLevel}!</h2>
          <p>You've reached a new level. Keep pushing!</p>
        </div>
      )}
    </section>
  );
};

export default FocusBattle;
