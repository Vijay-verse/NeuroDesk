import React, { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const Analytics = () => {
  const [history, setHistory] = useState([]);
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [avgDaily, setAvgDaily] = useState(0);

  useEffect(() => {
    const hist = JSON.parse(localStorage.getItem('neurodesk_focus_history') || '[]');
    setHistory(hist);

    const streakData = JSON.parse(localStorage.getItem('neurodesk_streak') || '{"count":0}');
    setStreak(streakData.count || 0);
    setXp(parseInt(localStorage.getItem('neurodesk_xp') || '0', 10));
    setLevel(parseInt(localStorage.getItem('neurodesk_level') || '1', 10));

    const ts = hist.reduce((s, h) => s + (h.sessions || 0), 0);
    const tm = hist.reduce((s, h) => s + (h.minutes || 0), 0);
    setTotalSessions(ts);
    setTotalMinutes(Math.round(tm));
    setAvgDaily(hist.length > 0 ? Math.round(tm / hist.length) : 0);
    setLongestStreak(Math.max(streakData.count || 0, 0));
  }, []);

  // Last 7 days data
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayData = history.filter(h => h.date === dateStr);
    last7.push({
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateShort: d.getDate().toString(),
      minutes: dayData.reduce((s, h) => s + (h.minutes || 0), 0),
      sessions: dayData.reduce((s, h) => s + (h.sessions || 0), 0),
      xp: dayData.reduce((s, h) => s + (h.xp || 0), 0),
    });
  }

  // Last 28 days for streak calendar
  const last28 = [];
  const historyDates = new Set(history.map(h => h.date));
  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    last28.push({
      date: dateStr,
      dayNum: d.getDate(),
      active: historyDates.has(dateStr),
      isToday: i === 0
    });
  }

  const barData = {
    labels: last7.map(d => d.label),
    datasets: [{
      label: 'Focus Minutes',
      data: last7.map(d => Math.round(d.minutes)),
      backgroundColor: 'rgba(167, 139, 250, 0.6)',
      borderColor: '#a78bfa',
      borderWidth: 1,
      borderRadius: 6,
      borderSkipped: false,
    }]
  };

  const lineData = {
    labels: last7.map(d => d.label),
    datasets: [
      {
        label: 'Sessions',
        data: last7.map(d => d.sessions),
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'XP Earned',
        data: last7.map(d => d.xp),
        borderColor: '#a78bfa',
        backgroundColor: 'rgba(167, 139, 250, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top', labels: { color: 'rgba(128,128,128,0.7)', font: { size: 11 } } },
      tooltip: {
        backgroundColor: 'rgba(13, 13, 31, 0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#f1f5f9',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
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

  const formatTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics 📊</h1>
          <p className="page-subtitle">Track your progress. Visualize your growth. Stay accountable.</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="analytics-summary">
        <div className="as-item">
          <div className="as-value">{formatTime(totalMinutes)}</div>
          <div className="as-label">Total Focus Time</div>
        </div>
        <div className="as-item">
          <div className="as-value">{totalSessions}</div>
          <div className="as-label">Total Sessions</div>
        </div>
        <div className="as-item">
          <div className="as-value">{streak} 🔥</div>
          <div className="as-label">Current Streak</div>
        </div>
        <div className="as-item">
          <div className="as-value">Lv{level}</div>
          <div className="as-label">{xp} Total XP</div>
        </div>
      </div>

      {/* Charts */}
      <div className="analytics-grid">
        <div className="analytics-card glass-card">
          <h3>Daily Focus Time</h3>
          <div className="analytics-chart-wrap">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>

        <div className="analytics-card glass-card">
          <h3>Weekly Productivity</h3>
          <div className="analytics-chart-wrap">
            <Line data={lineData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Streak Calendar */}
      <div className="analytics-card glass-card" style={{ marginBottom: 24 }}>
        <h3>Streak History (Last 28 Days)</h3>
        <div className="streak-day-labels">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}
        </div>
        <div className="streak-calendar">
          {last28.map((day, i) => (
            <div
              key={i}
              className={`streak-day ${day.active ? 'active' : ''} ${day.isToday ? 'today' : ''}`}
              title={day.date}
            >
              {day.dayNum}
            </div>
          ))}
        </div>
      </div>

      {/* Averages */}
      <div className="analytics-grid">
        <div className="analytics-card glass-card">
          <h3>Performance Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Avg. Daily Focus</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatTime(avgDaily)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Avg. Sessions/Day</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {history.length > 0 ? (totalSessions / history.length).toFixed(1) : 0}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Avg. XP/Day</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {history.length > 0 ? Math.round(xp / history.length) : 0}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Days Active</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{history.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Badges Earned</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {JSON.parse(localStorage.getItem('neurodesk_badges') || '[]').length}
              </span>
            </div>
          </div>
        </div>

        <div className="analytics-card glass-card">
          <h3>XP Milestones</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0' }}>
            {[100, 500, 1000, 2500, 5000, 10000].map(milestone => {
              const achieved = xp >= milestone;
              return (
                <div key={milestone} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  opacity: achieved ? 1 : 0.4,
                  fontSize: 13
                }}>
                  <span style={{ fontSize: 16 }}>{achieved ? '✅' : '⬜'}</span>
                  <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{milestone.toLocaleString()} XP</span>
                  {achieved && <span style={{ color: 'var(--green-400)', fontWeight: 600, fontSize: 11 }}>Achieved!</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Analytics;
