import React from 'react';
import { LayoutGrid, Target, Brain, Waves, Calendar, BarChart3, Bot, Wrench } from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen, currentPage, setCurrentPage }) => {
  const mainItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutGrid size={20} /> },
    { id: 'focus', label: 'Focus Battle', icon: <Target size={20} /> },
    { id: 'brain', label: 'Journal', icon: <Brain size={20} /> },
    { id: 'mindtrace', label: 'MindTrace', icon: <Waves size={20} /> },
    { id: 'planner', label: 'Study Planner', icon: <Calendar size={20} /> },
  ];

  const toolItems = [
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
    { id: 'ai', label: 'AI Assistant', icon: <Bot size={20} /> },
    { id: 'utilities', label: 'Utilities', icon: <Wrench size={20} /> },
  ];

  const handleNav = (id) => {
    setCurrentPage(id);
    if (window.innerWidth <= 768) setIsOpen(false);
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 2L4 8V20L14 26L24 20V8L14 2Z" stroke="url(#logoGrad)" strokeWidth="2" fill="none"/>
            <circle cx="14" cy="14" r="4" fill="url(#logoGrad)"/>
            <defs>
              <linearGradient id="logoGrad" x1="4" y1="2" x2="24" y2="26" gradientUnits="userSpaceOnUse">
                <stop stopColor="#a78bfa"/>
                <stop offset="1" stopColor="#38bdf8"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="logo-text">
          <span className="logo-title">NeuroDesk</span>
          <span className="logo-sub">Mind Intelligence</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-label">MAIN MENU</div>
        {mainItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => handleNav(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-text">{item.label}</span>
            <span className="nav-dot"></span>
          </button>
        ))}

        <div className="nav-label">TOOLS</div>
        {toolItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => handleNav(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-text">{item.label}</span>
            <span className="nav-dot"></span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-quote">
          "The secret of getting ahead is getting started."
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
