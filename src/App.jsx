import React, { useState, useEffect, useCallback } from 'react';
import Auth from './components/Auth';
import Dashboard from './pages/Dashboard';
import FocusBattle from './pages/FocusBattle';
import SecondBrain from './pages/SecondBrain';
import MindTrace from './pages/MindTrace';
import StudyPlanner from './pages/StudyPlanner';
import Analytics from './pages/Analytics';
import AIAssistant from './pages/AIAssistant';
import Utilities from './pages/Utilities';
import Sidebar from './components/Layout/Sidebar';
import Topbar from './components/Layout/Topbar';

const App = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('neurodesk_user')) || null);
  const [token, setToken] = useState(localStorage.getItem('neurodesk_token') || null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [theme, setTheme] = useState(localStorage.getItem('neurodesk_theme') || 'dark');
  const [toasts, setToasts] = useState([]);

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('neurodesk_theme', theme);
  }, [theme]);

  // Toast system
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;
      try {
        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Session restoration failed — using local data');
      }
    };
    fetchUser();
  }, [token]);

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('neurodesk_user', JSON.stringify(userData));
    localStorage.setItem('neurodesk_token', userToken);
  };

  const handleUpdateUser = (updatedData) => {
    const newData = { ...user, ...updatedData };
    setUser(newData);
    localStorage.setItem('neurodesk_user', JSON.stringify(newData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('neurodesk_token');
    localStorage.removeItem('neurodesk_user');
  };

  // Responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e) => {
      // Don't trigger shortcuts when typing in inputs
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (!e.key) return;

      switch (e.key.toLowerCase()) {
        case 'd': e.preventDefault(); setCurrentPage('dashboard'); break;
        case 'f': e.preventDefault(); setCurrentPage('focus'); break;
        case 'n': e.preventDefault(); setCurrentPage('brain'); break;
        case 'j': e.preventDefault(); setCurrentPage('mindtrace'); break;
        case 'p': e.preventDefault(); setCurrentPage('planner'); break;
        case 'a': e.preventDefault(); setCurrentPage('analytics'); break;
        case 'i': e.preventDefault(); setCurrentPage('ai'); break;
        case 'u': e.preventDefault(); setCurrentPage('utilities'); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  if (!token) {
    return (
      <div data-theme={theme}>
        <Auth onLogin={handleLogin} />
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':  return <Dashboard user={user} addToast={addToast} />;
      case 'focus':      return <FocusBattle addToast={addToast} />;
      case 'brain':      return <SecondBrain addToast={addToast} />;
      case 'mindtrace':  return <MindTrace addToast={addToast} />;
      case 'planner':    return <StudyPlanner addToast={addToast} />;
      case 'analytics':  return <Analytics />;
      case 'ai':         return <AIAssistant addToast={addToast} />;
      case 'utilities':  return <Utilities addToast={addToast} />;
      default:           return <Dashboard user={user} addToast={addToast} />;
    }
  };

  return (
    <div className="app-wrapper" data-theme={theme}>
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <div className="bg-orb orb-3"></div>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && window.innerWidth <= 768 && (
        <div className="sidebar-overlay active" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setSidebarOpen}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      <header className="topbar" style={window.innerWidth <= 768 ? { left: 0 } : undefined}>
        <Topbar
          user={user}
          logout={logout}
          toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
          currentPage={currentPage}
          onUpdateUser={handleUpdateUser}
          theme={theme}
          setTheme={setTheme}
        />
      </header>

      <main className="main-content" style={{ marginLeft: isSidebarOpen && window.innerWidth > 768 ? '260px' : '0' }}>
        {renderPage()}
      </main>

      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast ${t.type}`}>
              {t.type === 'success' && '✅'}{t.type === 'error' && '❌'}{t.type === 'warning' && '⚠️'}{t.type === 'info' && 'ℹ️'} {t.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
