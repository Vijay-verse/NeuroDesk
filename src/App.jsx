import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Dashboard from './pages/Dashboard';
import FocusBattle from './pages/FocusBattle';
import SecondBrain from './pages/SecondBrain';
import MindTrace from './pages/MindTrace';
import StudyPlanner from './pages/StudyPlanner';
import Sidebar from './components/Layout/Sidebar';
import Topbar from './components/Layout/Topbar';

const App = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('neurodesk_user')) || null);
  const [token, setToken] = useState(localStorage.getItem('neurodesk_token') || null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

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
          // Token invalid or expired
          logout();
        }
      } catch (err) {
        console.error('Session restoration failed');
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

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('neurodesk_token');
    localStorage.removeItem('neurodesk_user');
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!token) {
    return <Auth onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard user={user} />;
      case 'focus':     return <FocusBattle />;
      case 'brain':     return <SecondBrain />;
      case 'mindtrace': return <MindTrace />;
      case 'planner':   return <StudyPlanner />;
      default:          return <Dashboard user={user} />;
    }
  };

  return (
    <div className="app-wrapper" style={{ display: 'block' }}>
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <div className="bg-orb orb-3"></div>

      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setSidebarOpen} 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      <header className="topbar">
        <Topbar 
          user={user} 
          logout={logout} 
          toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
          currentPage={currentPage}
        />
      </header>

      <main className="main-content" style={{ marginLeft: isSidebarOpen && window.innerWidth > 768 ? '260px' : '0' }}>
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
