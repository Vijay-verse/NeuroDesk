import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const Utilities = ({ addToast }) => {
  // === TO-DO LIST ===
  const [todos, setTodos] = useState(JSON.parse(localStorage.getItem('neurodesk_utilities_todos') || '[]'));
  const [todoText, setTodoText] = useState('');
  const [todoPriority, setTodoPriority] = useState('medium');

  useEffect(() => { localStorage.setItem('neurodesk_utilities_todos', JSON.stringify(todos)); }, [todos]);

  const addTodo = () => {
    if (!todoText.trim()) return;
    setTodos(prev => [...prev, { id: Date.now(), text: todoText.trim(), priority: todoPriority, done: false }]);
    setTodoText('');
    if (addToast) addToast('Task added!', 'success');
  };

  const toggleTodo = (id) => setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTodo = (id) => setTodos(prev => prev.filter(t => t.id !== id));

  // === CALENDAR ===
  const [calDate, setCalDate] = useState(new Date());
  const today = new Date();

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    const days = [];
    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: daysInPrev - i, currentMonth: false });
    }
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = i === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      days.push({ day: i, currentMonth: true, isToday });
    }
    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, currentMonth: false });
    }
    return days;
  };

  const prevMonth = () => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1));
  const nextMonth = () => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1));

  // === WEATHER & CLOCK ===
  const [clock, setClock] = useState('');
  const [clockDate, setClockDate] = useState('');
  const [clockGreeting, setClockGreeting] = useState('');
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setClockDate(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
      const h = now.getHours();
      setClockGreeting(h < 12 ? '☀️ Good Morning' : h < 17 ? '🌤️ Good Afternoon' : '🌙 Good Evening');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Try to load weather (uses browser geolocation + OpenWeatherMap)
  useEffect(() => {
    const cachedWeather = localStorage.getItem('neurodesk_weather');
    if (cachedWeather) {
      const parsed = JSON.parse(cachedWeather);
      // Use cached if less than 30 minutes old
      if (Date.now() - parsed.timestamp < 1800000) {
        setWeather(parsed.data);
        return;
      }
    }

    // Try to fetch weather
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            // Using wttr.in (no API key needed)
            const res = await fetch(`https://wttr.in/?format=j1`);
            if (res.ok) {
              const data = await res.json();
              const current = data.current_condition?.[0];
              if (current) {
                const weatherData = {
                  temp: current.temp_C,
                  desc: current.weatherDesc?.[0]?.value || 'N/A',
                  humidity: current.humidity,
                  windSpeed: current.windspeedKmph,
                  icon: getWeatherIcon(current.weatherCode),
                  city: data.nearest_area?.[0]?.areaName?.[0]?.value || 'Your Location'
                };
                setWeather(weatherData);
                localStorage.setItem('neurodesk_weather', JSON.stringify({ data: weatherData, timestamp: Date.now() }));
              }
            }
          } catch { /* weather unavailable */ }
        },
        () => { /* geolocation denied */ }
      );
    }
  }, []);

  const getWeatherIcon = (code) => {
    const c = parseInt(code);
    if (c === 113) return '☀️';
    if (c === 116) return '⛅';
    if (c === 119 || c === 122) return '☁️';
    if ([176, 263, 266, 293, 296, 299, 302, 305, 308, 311, 314, 317, 353, 356, 359].includes(c)) return '🌧️';
    if ([179, 182, 185, 227, 230, 320, 323, 326, 329, 332, 335, 338, 350, 362, 365, 368, 371, 374, 377, 392, 395].includes(c)) return '🌨️';
    if ([200, 386, 389].includes(c)) return '⛈️';
    return '🌤️';
  };

  // === STICKY NOTES ===
  const [stickyNotes, setStickyNotes] = useState(JSON.parse(localStorage.getItem('neurodesk_sticky_notes') || '[]'));

  useEffect(() => { localStorage.setItem('neurodesk_sticky_notes', JSON.stringify(stickyNotes)); }, [stickyNotes]);

  const addSticky = (color) => {
    setStickyNotes(prev => [...prev, { id: Date.now(), text: '', color }]);
  };

  const updateSticky = (id, text) => {
    setStickyNotes(prev => prev.map(n => n.id === id ? { ...n, text } : n));
  };

  const deleteSticky = (id) => {
    setStickyNotes(prev => prev.filter(n => n.id !== id));
  };

  const calDays = getDaysInMonth(calDate);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Utilities 🧰</h1>
          <p className="page-subtitle">Your productivity toolkit. Everything you need in one place.</p>
        </div>
      </div>

      <div className="utilities-grid">
        {/* To-Do List */}
        <div className="utility-card glass-card">
          <h3>✅ To-Do List</h3>
          <div className="todo-input-row">
            <input
              type="text" placeholder="Add a task…"
              value={todoText}
              onChange={(e) => setTodoText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            />
            <select value={todoPriority} onChange={(e) => setTodoPriority(e.target.value)}>
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Med</option>
              <option value="low">🟢 Low</option>
            </select>
            <button className="btn-primary btn-sm" onClick={addTodo}><Plus size={14} /></button>
          </div>
          <div className="todo-list">
            {todos.length > 0 ? todos.map(t => (
              <div key={t.id} className={`todo-item p-${t.priority} ${t.done ? 'done' : ''}`}>
                <div
                  className={`todo-check ${t.done ? 'checked' : ''}`}
                  onClick={() => toggleTodo(t.id)}
                >✓</div>
                <span className="todo-text">{t.text}</span>
                <span className={`todo-priority-tag ${t.priority}`}>{t.priority}</span>
                <button className="todo-del" onClick={() => deleteTodo(t.id)}><X size={14} /></button>
              </div>
            )) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: 16 }}>
                No tasks yet. Add one above! ✨
              </div>
            )}
          </div>
        </div>

        {/* Calendar */}
        <div className="utility-card glass-card">
          <h3>📅 Calendar</h3>
          <div className="cal-header">
            <button className="cal-nav" onClick={prevMonth}><ChevronLeft size={16} /></button>
            <h4>{calDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h4>
            <button className="cal-nav" onClick={nextMonth}><ChevronRight size={16} /></button>
          </div>
          <div className="cal-grid">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="cal-day-label">{d}</div>
            ))}
            {calDays.map((d, i) => (
              <div
                key={i}
                className={`cal-day ${d.isToday ? 'today' : ''} ${!d.currentMonth ? 'other-month' : ''}`}
              >
                {d.day}
              </div>
            ))}
          </div>
        </div>

        {/* Clock & Weather */}
        <div className="utility-card glass-card">
          <h3>🕐 Clock & Weather</h3>
          <div className="clock-display">
            <div className="clock-time">{clock}</div>
            <div className="clock-date">{clockDate}</div>
            <div className="clock-greeting">{clockGreeting}</div>
          </div>

          {weather ? (
            <div className="weather-display" style={{ marginTop: 20, borderTop: '1px solid var(--border-glass)', paddingTop: 16 }}>
              <div className="weather-icon">{weather.icon}</div>
              <div className="weather-temp">{weather.temp}°C</div>
              <div className="weather-desc">{weather.desc}</div>
              <div className="weather-city">{weather.city}</div>
              <div className="weather-details">
                <div className="weather-detail">
                  <div className="wd-val">💧 {weather.humidity}%</div>
                  <div className="wd-label">Humidity</div>
                </div>
                <div className="weather-detail">
                  <div className="wd-val">💨 {weather.windSpeed} km/h</div>
                  <div className="wd-label">Wind</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="weather-placeholder" style={{ marginTop: 16 }}>
              <div className="wp-icon">🌤️</div>
              <p>Weather data loading…<br /><span style={{ fontSize: 11 }}>Allow location access for live weather</span></p>
            </div>
          )}
        </div>

        {/* Sticky Notes */}
        <div className="utility-card glass-card">
          <h3>📌 Sticky Notes</h3>
          <div className="sticky-notes-grid">
            {stickyNotes.map(note => (
              <div key={note.id} className={`sticky-note sn-${note.color}`}>
                <textarea
                  placeholder="Type here…"
                  value={note.text}
                  onChange={(e) => updateSticky(note.id, e.target.value)}
                />
                <button className="sn-del" onClick={() => deleteSticky(note.id)}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="sn-add-row">
            <button className="sn-color-btn c-yellow" onClick={() => addSticky('yellow')} title="Yellow" />
            <button className="sn-color-btn c-pink" onClick={() => addSticky('pink')} title="Pink" />
            <button className="sn-color-btn c-blue" onClick={() => addSticky('blue')} title="Blue" />
            <button className="sn-color-btn c-green" onClick={() => addSticky('green')} title="Green" />
          </div>
          {stickyNotes.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: 12, marginTop: 8 }}>
              Click a color to add a sticky note! 📝
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Utilities;
