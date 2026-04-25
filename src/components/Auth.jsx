import React, { useState } from 'react';

const Auth = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    goal: 120
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = activeTab === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = activeTab === 'login' 
      ? { username: formData.username, password: formData.password }
      : { username: formData.username, password: formData.password, name: formData.name, goal: formData.goal };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        onLogin(data.user, data.token);
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.id.split('-')[1]]: e.target.value });
  };

  return (
    <div className="auth-screen">
      <div className="auth-orb auth-orb-1"></div>
      <div className="auth-orb auth-orb-2"></div>
      <div className="auth-orb auth-orb-3"></div>

      <div className="auth-split">
        <div className="auth-branding">
          <div className="auth-brand-logo">
            <svg width="44" height="44" viewBox="0 0 28 28" fill="none">
              <path d="M14 2L4 8V20L14 26L24 20V8L14 2Z" stroke="url(#aLogoGrad)" strokeWidth="2" fill="none"/>
              <circle cx="14" cy="14" r="4" fill="url(#aLogoGrad)"/>
              <defs>
                <linearGradient id="aLogoGrad" x1="4" y1="2" x2="24" y2="26" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#a78bfa"/>
                  <stop offset="1" stopColor="#38bdf8"/>
                </linearGradient>
              </defs>
            </svg>
            <span className="auth-brand-name">NeuroDesk</span>
          </div>
          <h1 className="auth-brand-headline">Your mind,<br/>supercharged.</h1>
          <p className="auth-brand-sub">The premium study intelligence system that helps you focus deeper, think clearer, and achieve more — every single day.</p>
          
          <div className="auth-features">
            <div className="auth-feature-item">
              <span className="auth-feat-icon">⚡</span>
              <div>
                <div className="auth-feat-title">Focus Battle</div>
                <div className="auth-feat-desc">Pomodoro timer with distraction tracking</div>
              </div>
            </div>
            <div className="auth-feature-item">
              <span className="auth-feat-icon">🧠</span>
              <div>
                <div className="auth-feat-title">Journal</div>
                <div className="auth-feat-desc">Linked note system with knowledge graph</div>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-card glass-card">
            <div className="auth-tabs">
              <button 
                className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => setActiveTab('login')}
              >
                Sign In
              </button>
              <button 
                className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
                onClick={() => setActiveTab('signup')}
              >
                Sign Up
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-form-header">
                <h2 className="auth-form-title">
                  {activeTab === 'login' ? 'Welcome back 👋' : 'Create account ✨'}
                </h2>
                <p className="auth-form-sub">
                  {activeTab === 'login' ? 'Sign in to continue your journey' : 'Start your intelligence journey today'}
                </p>
              </div>

              <div className="auth-fields">
                {activeTab === 'signup' && (
                  <div className="auth-field-group">
                    <label className="auth-field-label" htmlFor="signup-name">Full Name</label>
                    <div className="auth-input-wrap">
                      <input 
                        type="text" id="signup-name" className="auth-input" 
                        placeholder="Your full name" required 
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                )}
                
                <div className="auth-field-group">
                  <label className="auth-field-label" htmlFor={`${activeTab}-username`}>Username</label>
                  <div className="auth-input-wrap">
                    <input 
                      type="text" id={`${activeTab}-username`} className="auth-input" 
                      placeholder="Enter your username" required 
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="auth-field-group">
                  <label className="auth-field-label" htmlFor={`${activeTab}-password`}>Password</label>
                  <div className="auth-input-wrap">
                    <input 
                      type="password" id={`${activeTab}-password`} className="auth-input" 
                      placeholder="Enter your password" required 
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {activeTab === 'signup' && (
                  <div className="auth-field-group">
                    <label className="auth-field-label" htmlFor="signup-goal">Daily Study Goal (minutes)</label>
                    <div className="auth-input-wrap">
                      <input 
                        type="number" id="signup-goal" className="auth-input" 
                        placeholder="e.g. 120" defaultValue="120"
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                )}
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button type="submit" className={`btn-auth-primary ${loading ? 'loading' : ''}`} disabled={loading}>
                <span>{loading ? 'Processing...' : (activeTab === 'login' ? 'Sign In' : 'Create Account')}</span>
                {!loading && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
