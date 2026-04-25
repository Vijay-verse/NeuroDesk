import React, { useEffect, useState, useRef } from 'react';
import { Clock, Target, Flame, BookOpen, Zap, Plus, X } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const MOODS = [
  { id: 'amazing', emoji: '🤩', label: 'Amazing' },
  { id: 'happy', emoji: '😊', label: 'Happy' },
  { id: 'neutral', emoji: '😐', label: 'Neutral' },
  { id: 'sad', emoji: '😔', label: 'Sad' },
  { id: 'stressed', emoji: '😰', label: 'Stressed' },
];

const Dashboard = ({ user, addToast }) => {
  const [stats, setStats] = useState({ studyTime: '0h 0m', focusScore: 0, streak: 0, notesCount: 0 });
  const [greeting, setGreeting] = useState('');
  const [quickTasks, setQuickTasks] = useState(JSON.parse(localStorage.getItem('neurodesk_dashboard_tasks') || '[]'));
  const [newTask, setNewTask] = useState('');
  const [quickNote, setQuickNote] = useState(localStorage.getItem('neurodesk_quick_notes') || '');
  const [dailyMood, setDailyMood] = useState(null);
  const [moodSaved, setMoodSaved] = useState(false);
  const noteTimer = useRef(null);

  // Dynamic greeting
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting('Good Morning');
      else if (hour < 17) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');
    };
    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load stats
  useEffect(() => {
    const loadStats = () => {
      const xp = parseInt(localStorage.getItem('neurodesk_xp') || '0', 10);
      const streakData = JSON.parse(localStorage.getItem('neurodesk_streak') || '{"count":0}');
      const history = JSON.parse(localStorage.getItem('neurodesk_focus_history') || '[]');
      const totalMinutes = history.reduce((sum, h) => sum + (h.minutes || 0), 0);
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;

      // Count local notes
      const localNotes = JSON.parse(localStorage.getItem('neurodesk_notes_local') || '[]');

      setStats({
        studyTime: `${h}h ${m}m`,
        focusScore: xp,
        streak: streakData.count || 0,
        notesCount: localNotes.length
      });
    };

    loadStats();

    // Also try API
    const fetchFromAPI = async () => {
      try {
        const token = localStorage.getItem('neurodesk_token');
        if (!token) return;
        const headers = { 'Authorization': `Bearer ${token}` };
        const [notesRes, statsRes] = await Promise.all([
          fetch('/api/notes', { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/api/focus/stats', { headers }).then(r => r.ok ? r.json() : null).catch(() => null)
        ]);

        if (statsRes && typeof statsRes.totalSeconds === 'number') {
          const apiH = Math.floor(statsRes.totalSeconds / 3600);
          const apiM = Math.floor((statsRes.totalSeconds % 3600) / 60);
          setStats(prev => ({
            ...prev,
            studyTime: `${apiH}h ${apiM}m`,
            notesCount: Array.isArray(notesRes) ? notesRes.length : prev.notesCount
          }));
        }
      } catch { /* use local */ }
    };
    fetchFromAPI();

    // Load daily mood
    const todayStr = new Date().toISOString().split('T')[0];
    const savedMood = JSON.parse(localStorage.getItem('neurodesk_daily_mood') || 'null');
    if (savedMood && savedMood.date === todayStr) {
      setDailyMood(savedMood.mood);
      setMoodSaved(true);
    }
  }, []);

  // Save quick tasks
  useEffect(() => {
    localStorage.setItem('neurodesk_dashboard_tasks', JSON.stringify(quickTasks));
  }, [quickTasks]);

  // Auto-save quick notes (debounced)
  const handleNoteChange = (val) => {
    setQuickNote(val);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => {
      localStorage.setItem('neurodesk_quick_notes', val);
    }, 500);
  };

  const addQuickTask = () => {
    if (!newTask.trim()) return;
    setQuickTasks(prev => [...prev, { id: Date.now(), text: newTask.trim(), done: false }]);
    setNewTask('');
  };

  const toggleQuickTask = (id) => {
    setQuickTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteQuickTask = (id) => {
    setQuickTasks(prev => prev.filter(t => t.id !== id));
  };

  const selectMood = (moodId) => {
    setDailyMood(moodId);
    setMoodSaved(true);
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem('neurodesk_daily_mood', JSON.stringify({ date: todayStr, mood: moodId }));
    if (addToast) addToast('Mood saved! 💜', 'success');
  };

  // Chart data from local history
  const history = JSON.parse(localStorage.getItem('neurodesk_focus_history') || '[]');
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayData = history.filter(h => h.date === dateStr);
    last7.push({
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      sessions: dayData.reduce((s, h) => s + (h.sessions || 0), 0),
      minutes: dayData.reduce((s, h) => s + (h.minutes || 0), 0) / 60
    });
  }

  const themeRoot = getComputedStyle(document.documentElement);

  const chartData = {
    labels: last7.map(d => d.label),
    datasets: [
      {
        label: 'Focus Sessions',
        data: last7.map(d => d.sessions),
        borderColor: '#a78bfa',
        backgroundColor: 'rgba(167, 139, 250, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Study Hours',
        data: last7.map(d => d.minutes.toFixed(1)),
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(13, 13, 31, 0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#f1f5f9',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(128, 128, 128, 0.1)' },
        ticks: { color: 'rgba(128, 128, 128, 0.6)', font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(128, 128, 128, 0.6)', font: { size: 10 } }
      }
    }
  };

  const level = parseInt(localStorage.getItem('neurodesk_level') || '1', 10);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {greeting}, {user?.name?.split(' ')[0] || 'NeuroUser'}! 👋
          </h1>
          <p className="page-subtitle">Your mind is ready. Let's conquer today.</p>
        </div>
        <div className="date-badge">
          <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon={<Clock size={22} />} value={stats.studyTime} label="Total Focus Time" trend="↑ Keep going!" color="purple" />
        <StatCard icon={<Zap size={22} />} value={`Lv${level}`} label="Current Level" trend={`${stats.focusScore} XP`} color="blue" />
        <StatCard icon={<Flame size={22} />} value={`${stats.streak} Days`} label="Current Streak" trend="Keep it up!" color="orange" />
        <StatCard icon={<BookOpen size={22} />} value={stats.notesCount} label="Brain Notes" trend="Total saved" color="green" />
      </div>

      {/* Dashboard Widgets */}
      <div className="dashboard-widgets">
        {/* Quick Tasks */}
        <div className="widget-card glass-card quick-tasks-widget">
          <div className="widget-header">
            <h3>📋 Today's Tasks</h3>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {quickTasks.filter(t => t.done).length}/{quickTasks.length}
            </span>
          </div>
          <div className="quick-task-input-row">
            <input
              type="text" placeholder="Add a quick task…"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addQuickTask()}
            />
            <button className="btn-primary btn-sm" onClick={addQuickTask}><Plus size={14} /></button>
          </div>
          <div className="quick-task-list">
            {quickTasks.length > 0 ? quickTasks.map(t => (
              <div key={t.id} className={`quick-task-item ${t.done ? 'done' : ''}`}>
                <div
                  className={`qt-check ${t.done ? 'checked' : ''}`}
                  onClick={() => toggleQuickTask(t.id)}
                >✓</div>
                <span className="qt-text">{t.text}</span>
                <button className="qt-del" onClick={() => deleteQuickTask(t.id)}><X size={14} /></button>
              </div>
            )) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: 12 }}>
                No tasks yet. Add one above!
              </div>
            )}
          </div>
        </div>

        {/* Mood Tracker */}
        <div className="widget-card glass-card mood-widget">
          <div className="widget-header">
            <h3>😊 How are you feeling?</h3>
          </div>
          <div className="mood-row">
            {MOODS.map(m => (
              <button
                key={m.id}
                className={`mood-pick ${dailyMood === m.id ? 'active' : ''}`}
                onClick={() => selectMood(m.id)}
              >
                <span className="mp-emoji">{m.emoji}</span>
                <span className="mp-label">{m.label}</span>
              </button>
            ))}
          </div>
          {moodSaved && (
            <div className="mood-saved-msg">
              ✅ Today's mood recorded!
            </div>
          )}
        </div>

        {/* Quick Notes */}
        <div className="widget-card glass-card quick-notes-widget" style={{ gridColumn: '1 / -1' }}>
          <div className="widget-header">
            <h3>📝 Quick Notes</h3>
          </div>
          <textarea
            placeholder="Jot down quick thoughts, ideas, reminders…"
            value={quickNote}
            onChange={(e) => handleNoteChange(e.target.value)}
            style={{ minHeight: 80 }}
          />
          <div className="qn-save-status">Auto-saved to browser</div>
        </div>
      </div>

      <div className="dashboard-bottom">
        <div className="chart-card glass-card">
          <div className="card-header">
            <h3>Weekly Focus Activity</h3>
            <div className="chart-legend">
              <span className="legend-dot purple"></span> Focus Sessions
              <span className="legend-dot blue" style={{ marginLeft: '12px' }}></span> Study Hours
            </div>
          </div>
          <div className="chart-area" style={{ height: '200px' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="activity-card glass-card">
          <div className="card-header">
            <h3>Quick Stats</h3>
          </div>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-dot" style={{ background: '#a78bfa' }}></div>
              <div className="activity-text">Level {level} Achiever</div>
              <div className="activity-time">{stats.focusScore} XP</div>
            </div>
            <div className="activity-item">
              <div className="activity-dot" style={{ background: '#fb923c' }}></div>
              <div className="activity-text">Streak Active</div>
              <div className="activity-time">{stats.streak} days</div>
            </div>
            <div className="activity-item">
              <div className="activity-dot" style={{ background: '#4ade80' }}></div>
              <div className="activity-text">Tasks Done Today</div>
              <div className="activity-time">{quickTasks.filter(t => t.done).length}</div>
            </div>
            <div className="activity-item">
              <div className="activity-dot" style={{ background: '#38bdf8' }}></div>
              <div className="activity-text">Focus Time</div>
              <div className="activity-time">{stats.studyTime}</div>
            </div>
            {dailyMood && (
              <div className="activity-item">
                <div className="activity-dot" style={{ background: '#f472b6' }}></div>
                <div className="activity-text">Today's Mood</div>
                <div className="activity-time">{MOODS.find(m => m.id === dailyMood)?.emoji}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const StatCard = ({ icon, value, label, trend, color }) => (
  <div className="stat-card">
    <div className={`stat-icon icon-${color}`}>
      {icon}
    </div>
    <div className="stat-info">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
    <div className={`stat-trend ${typeof trend === 'string' && trend.includes('↑') ? 'up' : ''}`}>{trend}</div>
  </div>
);

export default Dashboard;
