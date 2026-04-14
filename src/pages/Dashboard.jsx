import React, { useEffect, useState } from 'react';
import { Clock, Target, Flame, BookOpen } from 'lucide-react';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    studyTime: '0h 0m',
    focusScore: 0,
    streak: 0,
    notesCount: 0
  });
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // Fetch dashboard data
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('neurodesk_token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const [notesRes, statsRes] = await Promise.all([
          fetch('/api/notes', { headers }).then(r => r.json()),
          fetch('/api/focus/stats', { headers }).then(r => r.json())
        ]);

        if (statsRes && typeof statsRes.totalSeconds === 'number') {
          const h = Math.floor(statsRes.totalSeconds / 3600);
          const m = Math.floor((statsRes.totalSeconds % 3600) / 60);
          setStats({
            studyTime: `${h}h ${m}m`,
            focusScore: statsRes.totalScore || 0,
            streak: statsRes.streak || 0,
            notesCount: Array.isArray(notesRes) ? notesRes.length : 0
          });
        } else if (notesRes) {
          setStats(prev => ({ ...prev, notesCount: Array.isArray(notesRes) ? notesRes.length : 0 }));
        }
      } catch (err) {
        console.error('Failed to load dashboard data');
      }
    };

    fetchData();
  }, []);

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Focus Sessions',
        data: [1, 3, 2, 5, 4, 2, 3],
        borderColor: '#a78bfa',
        backgroundColor: 'rgba(167, 139, 250, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Study Hours',
        data: [0.5, 1.5, 1.0, 2.5, 2.0, 1.0, 1.5],
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
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: 'rgba(255, 255, 255, 0.4)', font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255, 255, 255, 0.4)', font: { size: 10 } }
      }
    }
  };

  return (
    <section className="page active">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Good Morning, {user?.name?.split(' ')[0] || 'NeuroUser'}! 👋
          </h1>
          <p className="page-subtitle">Your mind is ready. Let's conquer today.</p>
        </div>
        <div className="date-badge">
          <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon={<Clock size={22} />} value={stats.studyTime} label="Total Study Time" trend="↑ 12%" color="purple" />
        <StatCard icon={<Target size={22} />} value={stats.focusScore} label="Focus Score" trend="↑ 8%" color="blue" />
        <StatCard icon={<Flame size={22} />} value={`${stats.streak} Days`} label="Current Streak" trend="Keep it up!" color="orange" />
        <StatCard icon={<BookOpen size={22} />} value={stats.notesCount} label="Brain Notes" trend="Total saved" color="green" />
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
            <h3>Recent Activity</h3>
          </div>
          <div className="activity-list">
            {activities.length > 0 ? (
              activities.map((a, i) => (
                <div key={i} className="activity-item">
                  <div className="activity-dot" style={{ background: a.color }}></div>
                  <div className="activity-text">{a.text}</div>
                  <div className="activity-time">{a.time}</div>
                </div>
              ))
            ) : (
              <div className="activity-empty">No activity yet. Start a focus session!</div>
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
    <div className={`stat-trend ${trend.includes('↑') ? 'up' : ''}`}>{trend}</div>
  </div>
);

export default Dashboard;
