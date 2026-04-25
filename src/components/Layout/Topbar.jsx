import React, { useState } from 'react';
import { Menu, LogOut, User as UserIcon, Flame } from 'lucide-react';

const Topbar = ({ user, logout, toggleSidebar, currentPage }) => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const navLabels = {
    dashboard: 'Dashboard',
    focus: 'Focus Battle',
    brain: 'Journal',
    mindtrace: 'MindTrace',
    planner: 'Study Planner'
  };

  const name = user?.name || 'NeuroUser';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

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
        <div className="topbar-streak">
          <span className="streak-fire">🔥</span>
          <span className="streak-count">0</span>
          <span className="streak-label">day streak</span>
        </div>

        <div className="topbar-user" onClick={() => setDropdownOpen(!isDropdownOpen)}>
          <div className="user-avatar">
            <span>{initials}</span>
          </div>
          <div className="user-info">
            <span className="user-name">{name}</span>
            <span className="user-role">Pro Member</span>
          </div>

          <div className={`user-dropdown ${isDropdownOpen ? 'open' : ''}`}>
            <div className="dropdown-item">
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
    </>
  );
};

export default Topbar;
