import React, { useState, useEffect } from 'react';
import { Menu, LogOut, User as UserIcon } from 'lucide-react';

const Topbar = ({ user, logout, toggleSidebar, currentPage, onUpdateUser, theme, setTheme }) => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [isEditProfileOpen, setEditProfileOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', goal: 120 });
  const [loading, setLoading] = useState(false);
  const [clock, setClock] = useState('');

  // Real-time clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load gamification data
  useEffect(() => {
    const streakData = JSON.parse(localStorage.getItem('neurodesk_streak') || '{"count":0}');
    setStreak(streakData.count || 0);
    setXp(parseInt(localStorage.getItem('neurodesk_xp') || '0', 10));
    setLevel(parseInt(localStorage.getItem('neurodesk_level') || '1', 10));

    // Also try API
    const fetchStreak = async () => {
      try {
        const token = localStorage.getItem('neurodesk_token');
        if (!token) return;
        const res = await fetch('/api/focus/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.streak) setStreak(Math.max(streakData.count || 0, data.streak));
        }
      } catch (err) { /* use local data */ }
    };
    fetchStreak();
  }, []);

  // Listen for XP/level changes
  useEffect(() => {
    const handleStorage = () => {
      setXp(parseInt(localStorage.getItem('neurodesk_xp') || '0', 10));
      setLevel(parseInt(localStorage.getItem('neurodesk_level') || '1', 10));
      const streakData = JSON.parse(localStorage.getItem('neurodesk_streak') || '{"count":0}');
      setStreak(streakData.count || 0);
    };
    window.addEventListener('neurodesk_xp_update', handleStorage);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('neurodesk_xp_update', handleStorage);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const openEditProfile = () => {
    setEditForm({ name: user?.name || '', goal: user?.goal || 120 });
    setEditProfileOpen(true);
    setDropdownOpen(false);
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('neurodesk_token');
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        const updatedUser = await res.json();
        if (onUpdateUser) onUpdateUser(updatedUser);
        setEditProfileOpen(false);
      }
    } catch (err) {
      // Save locally as fallback
      if (onUpdateUser) onUpdateUser(editForm);
      setEditProfileOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const navLabels = {
    dashboard: 'Dashboard',
    focus: 'Focus Battle',
    brain: 'Journal',
    mindtrace: 'MindTrace',
    planner: 'Study Planner',
    analytics: 'Analytics',
    ai: 'AI Assistant',
    utilities: 'Utilities'
  };

  const name = user?.name || 'NeuroUser';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const themes = [
    { id: 'dark', icon: '🌙', label: 'Dark' },
    { id: 'light', icon: '☀️', label: 'Light' },
    { id: 'purple', icon: '💜', label: 'Purple' },
  ];

  return (
    <>
      <div className="topbar-left">
        <button className="hamburger" onClick={toggleSidebar} aria-label="Toggle sidebar">
          <Menu size={24} />
        </button>
        <div className="breadcrumb">
          <span className="breadcrumb-section">{navLabels[currentPage] || currentPage}</span>
        </div>
      </div>

      <div className="topbar-right">
        {/* Real-Time Clock */}
        <div className="topbar-clock">{clock}</div>

        {/* Theme Toggle */}
        <div className="theme-toggle-wrap">
          {themes.map(t => (
            <button
              key={t.id}
              className={`theme-btn ${theme === t.id ? 'active' : ''}`}
              onClick={() => setTheme(t.id)}
              title={t.label}
            >
              {t.icon}
            </button>
          ))}
        </div>

        {/* XP Display */}
        <div className="topbar-xp">
          <span className="xp-icon">⚡</span>
          <span className="xp-value">Lv{level}</span>
          <span className="xp-label">{xp} XP</span>
        </div>

        {/* Streak */}
        <div className="topbar-streak">
          <span className="streak-fire">🔥</span>
          <span className="streak-count">{streak}</span>
          <span className="streak-label">day streak</span>
        </div>

        {/* User Avatar */}
        <div className="topbar-user" onClick={() => setDropdownOpen(!isDropdownOpen)}>
          <div className="user-avatar">
            <span>{initials}</span>
          </div>
          <div className="user-info">
            <span className="user-name">{name}</span>
            <span className="user-role">Pro Member</span>
          </div>

          <div className={`user-dropdown ${isDropdownOpen ? 'open' : ''}`}>
            <div className="dropdown-item" onClick={openEditProfile}>
              <UserIcon size={16} />
              Edit Profile
            </div>
            <div className="dropdown-divider"></div>
            <div className="dropdown-item logout-item" onClick={logout}>
              <LogOut size={16} />
              Logout
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="modal-overlay open" onClick={() => setEditProfileOpen(false)}>
          <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button className="modal-close" onClick={() => setEditProfileOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleEditProfile}>
              <div className="modal-body">
                <div className="field-group">
                  <label className="field-label">Name</label>
                  <input
                    type="text" required value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Daily Goal (minutes)</label>
                  <input
                    type="number" required value={editForm.goal}
                    onChange={(e) => setEditForm({...editForm, goal: parseInt(e.target.value, 10)})}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setEditProfileOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Topbar;
