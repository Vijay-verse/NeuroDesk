/* =============================================
   NeuroDesk – JavaScript Application Logic
   ============================================= */

'use strict';

// =============================================
// STATE & STORAGE
// =============================================
const STORE = {
  get: (key, def = null) => {
    try { const v = localStorage.getItem('neurodesk_' + key); return v ? JSON.parse(v) : def; }
    catch { return def; }
  },
  set: (key, val) => {
    try { localStorage.setItem('neurodesk_' + key, JSON.stringify(val)); }
    catch {}
  }
};

// API Layer
const API = {
  BASE: 'https://neurodesk-production-4355.up.railway.app/api',
  token: () => localStorage.getItem('neurodesk_token'),
  headers: () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API.token()}`
  }),
  get:    async (path)       => fetch(API.BASE + path, { headers: API.headers() }).then(r => r.ok ? r.json() : null),
  post:   async (path, body) => fetch(API.BASE + path, { method:'POST',   headers: API.headers(), body: JSON.stringify(body) }).then(r => r.ok ? r.json() : null),
  patch:  async (path, body) => fetch(API.BASE + path, { method:'PATCH',  headers: API.headers(), body: JSON.stringify(body) }).then(r => r.ok ? r.json() : null),
  delete: async (path)       => fetch(API.BASE + path, { method:'DELETE', headers: API.headers() }).then(r => r.ok ? r.json() : null),
};

// App State
const state = {
  currentPage: 'dashboard',
  user: STORE.get('user', { name: 'NeuroUser', goal: 120 }),
  notes: [],
  tasks: [],
  journalEntries: [],
  focusSessions: [],
  activityLog: STORE.get('activityLog', []),
  distractions: STORE.get('distractions', { Instagram:0, YouTube:0, Twitter:0, WhatsApp:0, Gaming:0, Other:0 }),
  stats: STORE.get('stats', { totalSeconds: 0, focusScore: 0, streak: 0, lastStudyDate: null }),
  currentFilter: 'all',
  currentTaskFilter: 'all',
  notesView: 'grid',
  selectedMood: null,
  selectedNoteColor: 'purple',
  editingNoteId: null
};

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  checkAuthAndInit();
});

function checkAuthAndInit() {
  const token = localStorage.getItem('neurodesk_token');
  if (token) {
    // Already logged in
    showAppDirectly();
  } else {
    // Show login screen (already visible by default)
    const pwdInput = document.getElementById('signup-password');
    if (pwdInput) pwdInput.addEventListener('input', () => checkPasswordStrength(pwdInput.value));
  }
}

async function showAppDirectly() {
  document.getElementById('auth-screen').style.display = 'none';
  const wrapper = document.getElementById('app-wrapper');
  wrapper.style.display = 'block';
  await initApp();
}

function showAppWithTransition() {
  const authScreen = document.getElementById('auth-screen');
  const wrapper    = document.getElementById('app-wrapper');
  authScreen.classList.add('hiding');
  setTimeout(async () => {
    authScreen.style.display = 'none';
    wrapper.style.display = 'block';
    wrapper.classList.add('showing');
    await initApp();
    setTimeout(() => wrapper.classList.remove('showing'), 600);
  }, 400);
}

async function initApp() {
  // Load data from API
  try {
    const [me, notes, tasks, journals, focus, focusStats] = await Promise.all([
      API.get('/auth/me'),
      API.get('/notes'),
      API.get('/tasks'),
      API.get('/journal'),
      API.get('/focus'),
      API.get('/focus/stats')
    ]);
    
    if (me) { state.user = { name: me.name, goal: me.goal }; updateUserUI(); }
    if (notes) state.notes = notes;
    if (tasks) state.tasks = tasks;
    if (journals) state.journalEntries = journals;
    if (focus) state.focusSessions = focus;
    if (focusStats) {
      state.stats.totalSeconds = focusStats.totalSeconds || 0;
      state.stats.focusScore = focusStats.totalScore || 0;
    }
  } catch (err) {
    console.error('Failed to sync with server:', err);
  }

  updateUserUI();
  updateDateTime();
  setInterval(updateDateTime, 60000);
  refreshDashboard();
  checkStreak();
  renderMoodBars();
  renderPastLogs();
  renderNotes();
  renderTasks();
  renderSessionLog();
  renderActivityList();
  loadFocusTask();
  initWeeklyChart();
  setInterval(() => {
    renderMoodBars();
    updatePlannerProgress();
  }, 5000);
}

// =============================================
// NAVIGATION
// =============================================
const NAV_LABELS = {
  dashboard: 'Dashboard',
  focus: 'Focus Battle',
  brain: 'Second Brain',
  mindtrace: 'MindTrace',
  planner: 'Study Planner'
};

function navigateTo(page) {
  // Deactivate all
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // Activate new
  document.getElementById(`nav-${page}`)?.classList.add('active');
  document.getElementById(`page-${page}`)?.classList.add('active');
  document.getElementById('breadcrumb-text').textContent = NAV_LABELS[page] || page;

  state.currentPage = page;

  // Page-specific refresh
  if (page === 'dashboard') { refreshDashboard(); initWeeklyChart(); }
  if (page === 'brain') { renderNotes(); drawKnowledgeGraph(); }
  if (page === 'mindtrace') { renderPastLogs(); renderMoodBars(); updateJournalDate(); }
  if (page === 'planner') { renderTasks(); updatePlannerProgress(); }
  if (page === 'focus') { renderSessionLog(); updateDistractionCounts(); }

  // Close mobile sidebar
  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth <= 768) sidebar.classList.remove('open');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// =============================================
// DATE / TIME / GREETING
// =============================================
const QUOTES = [
  '"The secret of getting ahead is getting started."',
  '"Focus is the art of knowing what to ignore."',
  '"Small daily improvements lead to stunning results."',
  '"Your only limit is your mind."',
  '"Every expert was once a beginner."',
  '"Study hard, dream big, stay humble."',
  '"The mind is everything. What you think, you become."'
];

function updateDateTime() {
  const now = new Date();
  const hours = now.getHours();
  let greet = hours < 12 ? 'Morning' : hours < 17 ? 'Afternoon' : 'Evening';
  document.getElementById('greeting-time').textContent = greet;
  const dateEl = document.getElementById('current-date');
  if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  const jDate = document.getElementById('journal-date-label');
  if (jDate) jDate.textContent = now.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });

  // Random quote
  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  const qEl = document.getElementById('daily-quote');
  if (qEl) qEl.textContent = q;
}

function updateJournalDate() {
  const now = new Date();
  const jDate = document.getElementById('journal-date-label');
  if (jDate) jDate.textContent = now.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
}

// =============================================
// USER PROFILE
// =============================================
function updateUserUI() {
  const name = state.user.name || 'NeuroUser';
  document.getElementById('topbar-username').textContent = name;
  document.getElementById('greeting-name').textContent = name.split(' ')[0];
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('user-initials').textContent = initials;
  document.getElementById('profile-avatar-display').textContent = initials;
  if (document.getElementById('profile-name')) {
    document.getElementById('profile-name').value = name;
    document.getElementById('profile-goal').value = state.user.goal || 120;
  }
}

function openProfileModal() {
  document.getElementById('profile-modal').classList.add('open');
  closeUserMenu();
}
function closeProfileModal(e) {
  if(!e || e.target === document.getElementById('profile-modal'))
    document.getElementById('profile-modal').classList.remove('open');
}
function saveProfile() {
  const name = document.getElementById('profile-name').value.trim();
  const goal = parseInt(document.getElementById('profile-goal').value) || 120;
  if (!name) { showToast('Please enter a name.', 'error'); return; }
  state.user = { name, goal };
  STORE.set('user', state.user);
  updateUserUI();
  closeProfileModal();
  showToast('Profile updated! ✨', 'success');
}

function toggleUserMenu() {
  document.getElementById('user-dropdown').classList.toggle('open');
}
function closeUserMenu() {
  document.getElementById('user-dropdown').classList.remove('open');
}

function logout() {
  closeUserMenu();
  // Clear session
  STORE.set('session', { loggedIn: false });
  showToast('Logged out! See you soon 👋', 'info');
  setTimeout(() => {
    // Hide app, show auth
    document.getElementById('app-wrapper').style.display = 'none';
    const authScreen = document.getElementById('auth-screen');
    authScreen.style.display = 'flex';
    authScreen.classList.remove('hiding');
    // Reset forms
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-error').textContent = '';
    // Stop any running timer
    if (timerState.running) { pauseTimer(); }
  }, 600);
}

document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('user-dropdown');
  const userArea = document.querySelector('.topbar-user');
  if (dropdown && !userArea?.contains(e.target)) closeUserMenu();
});

// =============================================
// STREAK
// =============================================
function checkStreak() {
  const today = new Date().toDateString();
  const last = state.stats.lastStudyDate;
  if (last) {
    const lastDate = new Date(last);
    const diff = Math.floor((new Date(today) - lastDate) / 86400000);
    if (diff > 1) { state.stats.streak = 0; }
  }
  document.getElementById('topbar-streak').textContent = state.stats.streak;
  STORE.set('stats', state.stats);
}

function incrementStreak() {
  const today = new Date().toDateString();
  if (state.stats.lastStudyDate !== today) {
    const last = state.stats.lastStudyDate;
    if (last) {
      const diff = Math.floor((new Date(today) - new Date(last)) / 86400000);
      if (diff === 1) state.stats.streak++;
      else if (diff > 1) state.stats.streak = 1;
    } else {
      state.stats.streak = 1;
    }
    state.stats.lastStudyDate = today;
    STORE.set('stats', state.stats);
    document.getElementById('topbar-streak').textContent = state.stats.streak;
  }
}

// =============================================
// DASHBOARD
// =============================================
function refreshDashboard() {
  const s = state.stats;
  const hours   = Math.floor(s.totalSeconds / 3600);
  const minutes = Math.floor((s.totalSeconds % 3600) / 60);
  document.getElementById('dash-study-time').textContent = `${hours}h ${minutes}m`;
  document.getElementById('dash-focus-score').textContent = s.focusScore;
  document.getElementById('dash-streak').textContent = `${s.streak} Day${s.streak !== 1 ? 's' : ''}`;
  document.getElementById('dash-notes-count').textContent = state.notes.length;
  document.getElementById('topbar-streak').textContent = s.streak;
}

function renderActivityList() {
  const list = document.getElementById('activity-list');
  if (!list) return;
  if (!state.activityLog.length) {
    list.innerHTML = '<div class="activity-empty">No activity yet. Start a focus session!</div>';
    return;
  }
  const recent = [...state.activityLog].reverse().slice(0, 8);
  list.innerHTML = recent.map(a => `
    <div class="activity-item">
      <div class="activity-dot" style="background:${a.color || '#a78bfa'}; box-shadow: 0 0 6px ${a.color || '#a78bfa'}"></div>
      <div class="activity-text">${escHTML(a.text)}</div>
      <div class="activity-time">${a.time}</div>
    </div>
  `).join('');
}

function logActivity(text, color = '#a78bfa') {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
  state.activityLog.push({ text, color, time });
  if (state.activityLog.length > 50) state.activityLog.shift();
  STORE.set('activityLog', state.activityLog);
  renderActivityList();
}

// =============================================
// WEEKLY CHART (Canvas)
// =============================================
function initWeeklyChart() {
  const canvas = document.getElementById('weeklyChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 600;
  const H = 200;
  canvas.width = W;
  canvas.height = H;

  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  // Generate data from sessions
  const focusData = [0,0,0,0,0,0,0];
  const studyData  = [0,0,0,0,0,0,0];
  state.focusSessions.forEach(s => {
    const d = new Date(s.date);
    const dayIdx = (d.getDay() + 6) % 7; // Mon = 0
    focusData[dayIdx] += 1;
    studyData[dayIdx] += (s.seconds || 0) / 60;
  });

  const maxVal = Math.max(10, ...focusData, ...studyData.map(v => v / 10));
  const padL = 36, padR = 16, padT = 20, padB = 36;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const barW = chartW / 7;

  ctx.clearRect(0, 0, W, H);

  // Grid lines
  for (let i = 0; i <= 4; i++) {
    const y = padT + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '10px Inter';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(maxVal - (maxVal / 4) * i), padL - 4, y + 4);
  }

  // Bars (focus sessions)
  days.forEach((day, i) => {
    const barH = (focusData[i] / maxVal) * chartH;
    const x = padL + i * barW + barW * 0.25;
    const bw = barW * 0.35;

    const grad = ctx.createLinearGradient(0, padT + chartH - barH, 0, padT + chartH);
    grad.addColorStop(0, 'rgba(167,139,250,0.9)');
    grad.addColorStop(1, 'rgba(167,139,250,0.1)');
    ctx.fillStyle = grad;

    const r = 4;
    const bx = x, by = padT + chartH - barH, bh = Math.max(barH, 2);
    ctx.beginPath();
    ctx.moveTo(bx + r, by); ctx.lineTo(bx + bw - r, by);
    ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r);
    ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx, by + bh);
    ctx.lineTo(bx, by + r);
    ctx.quadraticCurveTo(bx, by, bx + r, by);
    ctx.closePath();
    ctx.fill();

    // Study line point
    const sy = padT + chartH - (Math.min(studyData[i], maxVal * 10) / (maxVal * 10)) * chartH;
    if (i > 0) {
      const prevSy = padT + chartH - (Math.min(studyData[i-1], maxVal * 10) / (maxVal * 10)) * chartH;
      ctx.beginPath();
      ctx.moveTo(padL + (i-1) * barW + barW * 0.6, prevSy);
      ctx.lineTo(padL + i * barW + barW * 0.6, sy);
      ctx.strokeStyle = 'rgba(56,189,248,0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(padL + i * barW + barW * 0.6, sy, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56,189,248,0.3)';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Day label
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '11px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(day, padL + i * barW + barW * 0.5, H - 8);
  });
}

// =============================================
// FOCUS BATTLE – TIMER
// =============================================
const MODES = {
  pomodoro:   { label: 'Focus',      seconds: 25 * 60 },
  shortbreak: { label: 'Short Break', seconds: 5 * 60 },
  longbreak:  { label: 'Long Break',  seconds: 15 * 60 }
};

let timerState = {
  mode: 'pomodoro',
  running: false,
  seconds: 25 * 60,
  totalSeconds: 25 * 60,
  sessionCount: 1,
  intervalId: null,
  sessionScore: STORE.get('session_score', 0)
};

function setMode(mode) {
  if (timerState.running) return;
  timerState.mode = mode;
  timerState.seconds = MODES[mode].seconds;
  timerState.totalSeconds = MODES[mode].seconds;
  document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`tab-${mode}`).classList.add('active');
  document.getElementById('timer-status').textContent = MODES[mode].label;
  updateTimerUI();
  updateRing();
}

function toggleTimer() {
  if (timerState.running) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  timerState.running = true;
  document.getElementById('start-stop-label').textContent = 'Pause';
  document.getElementById('timer-status').textContent = 'In Progress…';
  document.getElementById('start-stop-btn').style.background = 'linear-gradient(135deg, #f87171, #fb923c)';

  timerState.intervalId = setInterval(() => {
    timerState.seconds--;
    updateTimerUI();
    updateRing();
    if (timerState.seconds <= 0) {
      clearInterval(timerState.intervalId);
      timerComplete();
    }
  }, 1000);
}

function pauseTimer() {
  timerState.running = false;
  clearInterval(timerState.intervalId);
  document.getElementById('start-stop-label').textContent = 'Resume';
  document.getElementById('timer-status').textContent = 'Paused';
  document.getElementById('start-stop-btn').style.background = '';
}

function resetTimer() {
  timerState.running = false;
  clearInterval(timerState.intervalId);
  timerState.seconds = MODES[timerState.mode].seconds;
  timerState.totalSeconds = MODES[timerState.mode].seconds;
  document.getElementById('start-stop-label').textContent = 'Start';
  document.getElementById('start-stop-btn').style.background = '';
  document.getElementById('timer-status').textContent = 'Ready';
  updateTimerUI();
  updateRing();
}

function skipTimer() {
  if (timerState.running) { pauseTimer(); }
  timerComplete();
}

async function timerComplete() {
  timerState.running = false;
  clearInterval(timerState.intervalId);
  document.getElementById('start-stop-label').textContent = 'Start';
  document.getElementById('start-stop-btn').style.background = '';

  const wasPomodoro = timerState.mode === 'pomodoro';
  const elapsed = MODES[timerState.mode].seconds;
  const scoreEarned = wasPomodoro ? 10 + Math.max(0, 10 - timerState.distractionUrges) : 5;

  if (wasPomodoro) {
    // Update stats
    state.stats.totalSeconds += elapsed;
    state.stats.focusScore   += scoreEarned;
    timerState.sessionScore  += scoreEarned;
    STORE.set('session_score', timerState.sessionScore);
    STORE.set('stats', state.stats);
    incrementStreak();

    // Save session
    const task = document.getElementById('focus-task')?.value || '';
    
    const res = await API.post('/focus', {
      seconds: elapsed,
      score: scoreEarned,
      task,
      distractions: timerState.distractionUrges || 0
    });

    if (res && res.id) {
      state.focusSessions.unshift(res);
    }

    logActivity(`Completed ${Math.floor(elapsed/60)}m focus session${task ? ' – ' + task : ''}`, '#4ade80');
    refreshDashboard();

    timerState.sessionCount = (timerState.sessionCount % 4) + 1;
    document.getElementById('session-count').textContent = timerState.sessionCount;
    timerState.distractionUrges = 0;

    showCompletionOverlay(elapsed, scoreEarned);
  }

  document.getElementById('focus-score-display').textContent = timerState.sessionScore;
  renderSessionLog();

  // Reset timer
  timerState.seconds      = MODES[timerState.mode].seconds;
  timerState.totalSeconds = MODES[timerState.mode].seconds;
  updateTimerUI();
  updateRing();
}

function updateTimerUI() {
  const m = Math.floor(timerState.seconds / 60).toString().padStart(2, '0');
  const s = (timerState.seconds % 60).toString().padStart(2, '0');
  const el = document.getElementById('timer-display');
  if (el) el.textContent = `${m}:${s}`;
}

function updateRing() {
  const ring = document.getElementById('ring-progress');
  if (!ring) return;
  const perc = timerState.seconds / timerState.totalSeconds;
  const circumference = 2 * Math.PI * 115;
  ring.style.strokeDashoffset = circumference * (1 - perc);
}

function logDistraction(type) {
  state.distractions[type] = (state.distractions[type] || 0) + 1;
  STORE.set('distractions', state.distractions);
  timerState.distractionUrges = (timerState.distractionUrges || 0) + 1;
  updateDistractionCounts();
  showToast(`Distraction urge logged! Stay strong 💪`, 'info');
  logActivity(`Resisted ${type} distraction 💪`, '#f472b6');
}

function updateDistractionCounts() {
  const keys = ['Instagram','YouTube','Twitter','WhatsApp','Gaming','Other'];
  let total = 0;
  keys.forEach(k => {
    const el = document.getElementById(`dist-${k.toLowerCase()}`);
    const v = state.distractions[k] || 0;
    if (el) {
      el.textContent = v;
      el.classList.toggle('visible', v > 0);
    }
    total += v;
  });
  const te = document.getElementById('total-distractions');
  if (te) te.textContent = total;
}

function saveFocusTask() {
  const val = document.getElementById('focus-task')?.value || '';
  STORE.set('focus_task', val);
}

function loadFocusTask() {
  const val = STORE.get('focus_task', '');
  const el = document.getElementById('focus-task');
  if (el) el.value = val;
}

function renderSessionLog() {
  const list = document.getElementById('session-log-list');
  if (!list) return;
  const recent = [...state.focusSessions].reverse().slice(0, 6);
  if (!recent.length) {
    list.innerHTML = '<div class="log-empty">Complete sessions to see logs.</div>';
    return;
  }
  list.innerHTML = recent.map(s => {
    const mins = Math.floor(s.seconds / 60);
    const d = new Date(s.date).toLocaleDateString('en-US', { month:'short', day:'numeric' });
    return `
      <div class="session-log-item">
        <span style="font-size:16px">✅</span>
        <div style="flex:1">
          <div style="font-weight:600;font-size:12px;color:#f1f5f9">${mins}m Session</div>
          <div style="font-size:11px;color:#64748b">${s.task || 'General Study'}</div>
        </div>
        <div style="text-align:right">
          <div style="color:#4ade80;font-weight:700;font-size:12px">+${s.score}</div>
          <div style="font-size:11px;color:#475569">${d}</div>
        </div>
      </div>`;
  }).join('');
}

function showCompletionOverlay(elapsed, score) {
  const overlay = document.getElementById('completion-overlay');
  document.getElementById('comp-time').textContent = `${Math.floor(elapsed/60)}m`;
  document.getElementById('comp-score').textContent = `+${score}`;
  overlay.classList.add('show');
}

function dismissCompletion() {
  document.getElementById('completion-overlay').classList.remove('show');
}

// =============================================
// SECOND BRAIN – NOTES
// =============================================
function openNoteModal(editId = null) {
  const modal = document.getElementById('note-modal');
  state.editingNoteId = editId;
  document.getElementById('editing-note-id').value = editId || '';

  if (editId) {
    const note = state.notes.find(n => n.id === editId);
    if (!note) return;
    document.getElementById('note-modal-title').textContent = 'Edit Note';
    document.getElementById('note-title').value = note.title;
    document.getElementById('note-content').value = note.content;
    document.getElementById('note-tags').value = (note.tags || []).join(', ');
    document.getElementById('note-link').value = note.linkedTo || '';
    selectNoteColor(note.color || 'purple',
      document.querySelector(`.color-opt[data-color="${note.color || 'purple'}"]`));
  } else {
    document.getElementById('note-modal-title').textContent = 'New Note';
    document.getElementById('note-title').value = '';
    document.getElementById('note-content').value = '';
    document.getElementById('note-tags').value = '';
    document.getElementById('note-link').value = '';
    selectNoteColor('purple', document.querySelector('.color-opt[data-color="purple"]'));
  }

  modal.classList.add('open');
  setTimeout(() => document.getElementById('note-title').focus(), 100);
}

function closeNoteModal(e) {
  if (!e || e.target === document.getElementById('note-modal'))
    document.getElementById('note-modal').classList.remove('open');
}

function selectNoteColor(color, btn) {
  state.selectedNoteColor = color;
  document.querySelectorAll('.color-opt').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

async function saveNote() {
  const title   = document.getElementById('note-title').value.trim();
  const content = document.getElementById('note-content').value.trim();
  const tagsRaw = document.getElementById('note-tags').value.trim();
  const linkedTo = document.getElementById('note-link').value.trim();
  const color   = state.selectedNoteColor || 'purple';

  if (!title) { showToast('Please enter a note title.', 'error'); return; }

  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
  const editId = document.getElementById('editing-note-id').value;

  const btn = document.getElementById('save-note-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }

  if (editId) {
    const res = await API.patch('/notes/' + editId, { title, content, tags, linkedTo, color });
    if (res && res.id) {
      const idx = state.notes.findIndex(n => n.id === editId);
      if (idx !== -1) state.notes[idx] = res;
      showToast('Note updated! ✨', 'success');
      logActivity(`Updated note: "${title}"`, '#38bdf8');
    }
  } else {
    const res = await API.post('/notes', { title, content, tags, linkedTo, color });
    if (res && res.id) {
      state.notes.unshift(res);
      showToast('Note saved! 🧠', 'success');
      logActivity(`Created note: "${title}"`, '#a78bfa');
    }
  }

  if (btn) { btn.disabled = false; btn.textContent = 'Save Note'; }
  closeNoteModal();
  renderNotes();
  drawKnowledgeGraph();
  refreshDashboard();
  rebuildTagFilters();
}

async function deleteNote(id) {
  const res = await API.delete('/notes/' + id);
  if (res && res.msg) {
    state.notes = state.notes.filter(n => n.id !== id);
    renderNotes();
    drawKnowledgeGraph();
    refreshDashboard();
    rebuildTagFilters();
    showToast('Note deleted.', 'info');
    logActivity('Deleted a note', '#f87171');
  }
}

function filterNotes() {
  renderNotes();
}

function filterByTag(tag, btn) {
  state.currentFilter = tag;
  document.querySelectorAll('.tag-filter').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderNotes();
}

function setNotesView(view) {
  state.notesView = view;
  const grid = document.getElementById('notes-grid');
  document.getElementById('view-grid-btn').classList.toggle('active', view === 'grid');
  document.getElementById('view-list-btn').classList.toggle('active', view === 'list');
  if (grid) grid.classList.toggle('list-view', view === 'list');
  renderNotes();
}

function renderNotes() {
  const grid = document.getElementById('notes-grid');
  const empty = document.getElementById('notes-empty');
  if (!grid) return;

  const search = (document.getElementById('note-search')?.value || '').toLowerCase();
  const filter = state.currentFilter;

  let notes = state.notes.filter(n => {
    const matchSearch = !search || n.title.toLowerCase().includes(search) || n.content.toLowerCase().includes(search) || (n.tags || []).some(t => t.toLowerCase().includes(search));
    const matchTag = filter === 'all' || (n.tags || []).map(t => t.toLowerCase()).includes(filter.toLowerCase());
    return matchSearch && matchTag;
  });

  // Clear non-empty cards
  const cards = grid.querySelectorAll('.note-card');
  cards.forEach(c => c.remove());

  if (!notes.length) {
    if (empty) empty.style.display = 'flex';
    document.getElementById('graph-section').style.display = 'none';
    return;
  }
  if (empty) empty.style.display = 'none';

  const hasLinked = notes.some(n => n.linkedTo);
  const graphSection = document.getElementById('graph-section');
  if (graphSection) graphSection.style.display = hasLinked ? 'block' : 'none';

  notes.forEach(note => {
    const card = createNoteCard(note);
    grid.appendChild(card);
  });

  if (hasLinked) drawKnowledgeGraph();
}

function createNoteCard(note) {
  const card = document.createElement('div');
  card.className = `note-card color-${note.color || 'purple'}`;
  card.setAttribute('data-id', note.id);

  const date = new Date(note.updatedAt || note.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric' });
  const tags = (note.tags || []).map(t => `<span class="note-tag">${escHTML(t)}</span>`).join('');
  const linkBadge = note.linkedTo ? `<span class="note-link-indicator">🔗 Linked</span>` : '';

  card.innerHTML = `
    <div class="note-card-header">
      <div class="note-card-title">${escHTML(note.title)}</div>
      <div class="note-card-actions">
        <button class="note-action-btn edit" onclick="openNoteModal('${note.id}')" title="Edit">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="note-action-btn" onclick="deleteNote('${note.id}')" title="Delete">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>
    </div>
    <div class="note-card-content">${escHTML(note.content)}</div>
    <div class="note-card-footer">
      <div class="note-tags">${tags}</div>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
        ${linkBadge}
        <span class="note-date">${date}</span>
      </div>
    </div>`;
  return card;
}

function rebuildTagFilters() {
  const allTags = new Set();
  state.notes.forEach(n => (n.tags || []).forEach(t => allTags.add(t.toLowerCase())));
  const container = document.getElementById('tag-filters');
  if (!container) return;
  const currentActive = state.currentFilter;
  container.innerHTML = `<button class="tag-filter ${currentActive === 'all' ? 'active' : ''}" onclick="filterByTag('all', this)">All</button>`;
  allTags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = `tag-filter ${currentActive === tag ? 'active' : ''}`;
    btn.textContent = tag;
    btn.onclick = function() { filterByTag(tag, this); };
    container.appendChild(btn);
  });
}

// Knowledge Graph
function drawKnowledgeGraph() {
  const canvas = document.getElementById('graphCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 800;
  const H = 300;
  canvas.width = W;
  canvas.height = H;
  ctx.clearRect(0, 0, W, H);

  const notes = state.notes.slice(0, 12);
  if (!notes.length) return;

  const nodes = notes.map((n, i) => {
    const angle = (i / notes.length) * Math.PI * 2;
    const r = Math.min(W, H) * 0.35;
    return {
      id: n.id,
      title: n.title,
      x: W/2 + Math.cos(angle) * r,
      y: H/2 + Math.sin(angle) * r,
      linkedTo: n.linkedTo,
      color: { purple:'#a78bfa', blue:'#38bdf8', cyan:'#22d3ee', green:'#4ade80', orange:'#fb923c', pink:'#f472b6' }[n.color] || '#a78bfa'
    };
  });

  // Draw edges
  nodes.forEach(node => {
    if (!node.linkedTo) return;
    const target = nodes.find(n => n.title.toLowerCase().includes(node.linkedTo.toLowerCase()) || n.id === node.linkedTo);
    if (!target) return;
    ctx.beginPath();
    ctx.moveTo(node.x, node.y);
    ctx.lineTo(target.x, target.y);
    ctx.strokeStyle = 'rgba(167,139,250,0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // Draw nodes
  nodes.forEach(node => {
    // Glow
    const grd = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 28);
    grd.addColorStop(0, node.color + '33');
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(node.x, node.y, 28, 0, Math.PI * 2);
    ctx.fill();

    // Circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = node.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    const label = node.title.length > 12 ? node.title.slice(0, 12) + '…' : node.title;
    ctx.fillText(label, node.x, node.y + 28);
  });
}

// =============================================
// MINDTRACE – JOURNAL
// =============================================
function selectMood(btn) {
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  state.selectedMood = btn.dataset.mood;
}

function updateEnergyLabel(val) {
  const el = document.getElementById('energy-label');
  if (el) el.textContent = `${val}/10`;
}

async function saveJournalEntry() {
  const mood    = state.selectedMood;
  const content = document.getElementById('journal-content')?.value.trim();
  const wins    = document.getElementById('journal-wins')?.value.trim();
  const energy  = document.getElementById('journal-energy')?.value || '5';

  if (!mood) { showToast('Please select a mood!', 'error'); return; }

  const MOOD_EMOJIS = { amazing:'🤩', happy:'😊', neutral:'😐', sad:'😔', anxious:'😰', frustrated:'😤' };

  const btn = document.querySelector('button[onclick="saveJournalEntry()"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }

  const res = await API.post('/journal', {
    mood,
    moodEmoji: MOOD_EMOJIS[mood] || '😊',
    content: content || '',
    wins: wins || '',
    energy: parseInt(energy)
  });

  if (res && res.id) {
    state.journalEntries.unshift(res);

    // Clear form
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
    state.selectedMood = null;
    if (document.getElementById('journal-content')) document.getElementById('journal-content').value = '';
    if (document.getElementById('journal-wins')) document.getElementById('journal-wins').value = '';
    if (document.getElementById('journal-energy')) document.getElementById('journal-energy').value = 5;
    updateEnergyLabel(5);

    renderPastLogs();
    renderMoodBars();
    logActivity(`Logged mood: ${MOOD_EMOJIS[mood]} ${mood}`, '#f472b6');
    showToast('Journal entry saved! 🌊', 'success');
  } else {
    showToast('Failed to save journal.', 'error');
  }

  if (btn) { btn.disabled = false; btn.textContent = 'Save Entry ✨'; }
}

function renderPastLogs() {
  const list = document.getElementById('past-logs-list');
  const count = document.getElementById('log-count');
  if (!list) return;
  if (count) count.textContent = `${state.journalEntries.length} entries`;
  if (!state.journalEntries.length) {
    list.innerHTML = '<div class="log-empty">Start journaling to see your history.</div>';
    return;
  }
  list.innerHTML = state.journalEntries.slice(0, 10).map(e => {
    const date = new Date(e.date).toLocaleDateString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
    return `
      <div class="past-log-item">
        <div class="past-log-header">
          <div class="past-log-mood">${e.moodEmoji} <span style="color:#f1f5f9">${capitalise(e.mood)}</span></div>
          <div class="past-log-date">${date}</div>
        </div>
        ${e.wins ? `<div class="past-log-content" style="color:#4ade80;margin-bottom:4px">✨ ${escHTML(e.wins)}</div>` : ''}
        ${e.content ? `<div class="past-log-content">${escHTML(e.content.slice(0, 120))}${e.content.length > 120 ? '…' : ''}</div>` : ''}
        <div class="past-log-energy">⚡ Energy: ${e.energy}/10</div>
      </div>`;
  }).join('');
}

function renderMoodBars() {
  const container = document.getElementById('mood-bars');
  if (!container) return;
  if (!state.journalEntries.length) {
    container.innerHTML = '<div class="mood-bar-empty">No entries yet.</div>';
    return;
  }
  const recent = state.journalEntries.slice(0, 7).reverse();
  const MOOD_VAL = { amazing:10, happy:8, neutral:5, sad:3, anxious:4, frustrated:2 };
  const maxH = 80;
  container.innerHTML = recent.map(e => {
    const val = MOOD_VAL[e.mood] || 5;
    const h = (val / 10) * maxH;
    const d = new Date(e.date);
    const label = d.toLocaleDateString('en-US', { month:'short', day:'numeric' });
    return `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:default" title="${capitalise(e.mood)} – ${label}">
        <div class="mood-bar-item mood-bar-${e.mood}" style="height:${h}px;width:100%;min-height:4px" title="${e.moodEmoji} ${capitalise(e.mood)}"></div>
        <div style="font-size:10px;color:#475569;text-align:center">${e.moodEmoji}</div>
      </div>`;
  }).join('');
}

// =============================================
// STUDY PLANNER
// =============================================
let currentTaskFilterMode = 'all';

async function addPlannerTask() {
  const subject  = document.getElementById('task-subject')?.value.trim();
  const title    = document.getElementById('task-title-input')?.value.trim();
  const date     = document.getElementById('task-date')?.value;
  const priority = document.getElementById('task-priority')?.value || 'medium';

  if (!subject) { showToast('Please enter a subject.', 'error'); return; }
  if (!title)   { showToast('Please enter a task title.', 'error'); return; }

  const btn = document.querySelector('button[onclick="addPlannerTask()"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Adding...'; }

  const res = await API.post('/tasks', { subject, title, date, priority });
  
  if (res && res.id) {
    state.tasks.unshift(res);

    // Clear form
    document.getElementById('task-subject').value = '';
    document.getElementById('task-title-input').value = '';
    document.getElementById('task-date').value = '';
    document.getElementById('task-priority').value = 'medium';

    renderTasks();
    updatePlannerProgress();
    logActivity(`Added task: "${title}" (${subject})`, '#60a5fa');
    showToast('Task added! 📅', 'success');
  } else {
    showToast('Failed to add task.', 'error');
  }

  if (btn) { btn.disabled = false; btn.innerHTML = '+ Add Task'; }
}

async function toggleTaskComplete(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  
  // Optimistic UI update
  task.completed = !task.completed;
  renderTasks();
  updatePlannerProgress();

  const res = await API.patch('/tasks/' + id, { completed: task.completed });
  if (!res || !res.id) {
    // Revert on failure
    task.completed = !task.completed;
    renderTasks();
    updatePlannerProgress();
    showToast('Failed to update task.', 'error');
    return;
  }

  if (task.completed) {
    showToast('Task completed! 🎉', 'success');
    logActivity(`Completed: "${task.title}"`, '#4ade80');
  }
}

async function deleteTask(id) {
  const res = await API.delete('/tasks/' + id);
  if (res && res.msg) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    renderTasks();
    updatePlannerProgress();
    showToast('Task removed.', 'info');
  }
}

function filterTasks(mode, btn) {
  if (mode !== 'current') {
    currentTaskFilterMode = mode;
  }
  if (btn) {
    document.querySelectorAll('.task-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  renderTasks();
}

function renderTasks() {
  const list = document.getElementById('tasks-list');
  if (!list) return;

  const search = (document.getElementById('task-search')?.value || '').toLowerCase();
  const mode   = currentTaskFilterMode;

  let tasks = state.tasks.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search) || t.subject.toLowerCase().includes(search);
    const matchMode = mode === 'all' || (mode === 'pending' && !t.completed) || (mode === 'completed' && t.completed);
    return matchSearch && matchMode;
  });

  if (!tasks.length) {
    list.innerHTML = `
      <div class="tasks-empty-state">
        <div class="empty-icon">📅</div>
        <p>No tasks found. ${mode === 'all' ? 'Add your first study task!' : `No ${mode} tasks.`}</p>
      </div>`;
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  list.innerHTML = tasks.map(t => {
    const overdue = t.date && t.date < today && !t.completed;
    const dateLabel = t.date ? new Date(t.date + 'T00:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric' }) : 'No date';
    return `
      <div class="task-item priority-${t.priority} ${t.completed ? 'completed' : ''}">
        <div class="task-checkbox ${t.completed ? 'checked' : ''}" onclick="toggleTaskComplete('${t.id}')"></div>
        <div class="task-info">
          <div class="task-title">${escHTML(t.title)}</div>
          <div class="task-meta">
            <span class="task-subject-badge">${escHTML(t.subject)}</span>
            <span class="task-date ${overdue ? 'overdue' : ''}">📅 ${dateLabel}${overdue ? ' (Overdue!)' : ''}</span>
            <span style="color:${t.priority==='high'?'#f87171':t.priority==='medium'?'#fb923c':'#4ade80'};font-size:11px">●</span>
          </div>
        </div>
        <button class="task-delete-btn" onclick="deleteTask('${t.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>`;
  }).join('');
}

function updatePlannerProgress() {
  const total = state.tasks.length;
  const done  = state.tasks.filter(t => t.completed).length;
  const pct   = total ? Math.round((done / total) * 100) : 0;
  const bar   = document.getElementById('planner-progress-bar');
  const pctEl = document.getElementById('planner-progress-pct');
  if (bar) bar.style.width = pct + '%';
  if (pctEl) pctEl.textContent = pct + '%';
}

// =============================================
// TOAST NOTIFICATIONS
// =============================================
let toastTimer = null;
function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  clearTimeout(toastTimer);
  const icons = { success:'✅', error:'❌', info:'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> ${escHTML(msg)}`;
  toast.className = `toast ${type} show`;
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// =============================================
// UTILS
// =============================================
function escHTML(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function capitalise(str = '') {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// =============================================
// RESIZE HANDLER
// =============================================
window.addEventListener('resize', () => {
  initWeeklyChart();
  drawKnowledgeGraph();
  updatePlannerProgress();
});

// Set today's date as default for task date
document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('task-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.min = today;
  }
  // These elements only exist when app is visible; guard them
  const fsd = document.getElementById('focus-score-display');
  if (fsd) fsd.textContent = timerState.sessionScore;
  const el5 = document.getElementById('energy-label');
  if (el5) updateEnergyLabel(5);
  if (document.getElementById('tag-filters')) rebuildTagFilters();
});

// =============================================
// AUTH SYSTEM
// =============================================

function switchAuthTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
  document.getElementById('form-login').style.display  = tab === 'login'  ? 'block' : 'none';
  document.getElementById('form-signup').style.display = tab === 'signup' ? 'block' : 'none';
  // Clear errors
  document.getElementById('login-error').textContent  = '';
  document.getElementById('signup-error').textContent = '';
}

async function handleLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  const btn      = document.getElementById('login-btn');

  errEl.textContent = '';
  if (!username) { errEl.textContent = '⚠ Please enter your username.'; return; }
  if (!password)  { errEl.textContent = '⚠ Please enter your password.'; return; }

  btn.classList.add('loading');
  document.getElementById('login-btn-label').textContent = 'Signing in…';

  const res = await fetch(API.BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  btn.classList.remove('loading');
  document.getElementById('login-btn-label').textContent = 'Sign In';

  if (!res.ok) {
    errEl.textContent = '⚠ ' + (data.error || 'Login failed. Please try again.');
    return;
  }

  // Success
  localStorage.setItem('neurodesk_token', data.token);
  
  showToast(`Welcome back, ${data.user.name.split(' ')[0]}! 🚀`, 'success');
  showAppWithTransition();
}

async function handleSignup() {
  const name     = document.getElementById('signup-name').value.trim();
  const username = document.getElementById('signup-username').value.trim();
  const password = document.getElementById('signup-password').value;
  const goal     = parseInt(document.getElementById('signup-goal').value) || 120;
  const errEl    = document.getElementById('signup-error');
  const btn      = document.getElementById('signup-btn');

  errEl.textContent = '';
  if (!name)     { errEl.textContent = '⚠ Please enter your full name.'; return; }
  if (!username) { errEl.textContent = '⚠ Please choose a username.'; return; }
  if (username.length < 3) { errEl.textContent = '⚠ Username must be at least 3 characters.'; return; }
  if (!password || password.length < 6) { errEl.textContent = '⚠ Password must be at least 6 characters.'; return; }

  btn.classList.add('loading');
  document.getElementById('signup-btn-label').textContent = 'Creating…';

  const res = await fetch(API.BASE + '/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, username, password, goal })
  });

  const data = await res.json();
  btn.classList.remove('loading');
  document.getElementById('signup-btn-label').textContent = 'Create Account';

  if (!res.ok) {
    errEl.textContent = '⚠ ' + (data.error || 'Signup failed.');
    return;
  }

  // success
  localStorage.setItem('neurodesk_token', data.token);

  showToast(`Welcome to NeuroDesk, ${name.split(' ')[0]}! 🎉`, 'success');
  showAppWithTransition();
}

// The following handles are disabled visually or bypassed securely via local overrides if needed, but for now we simply alert.
function handleGuestLogin() {
  showToast('Guest mode is disabled when API is active.', 'error');
}

function handleDemoLogin() {
  showToast('Demo mode is disabled when API is active.', 'error');
}

function togglePwd(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.innerHTML = isHidden
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
}

function checkPasswordStrength(pwd) {
  const fill  = document.getElementById('pwd-strength-fill');
  const label = document.getElementById('pwd-strength-label');
  if (!fill || !label) return;

  let score = 0;
  if (pwd.length >= 6)  score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  const levels = [
    { pct: '0%',   color: 'transparent',  text: '' },
    { pct: '25%',  color: '#f87171',       text: 'Weak' },
    { pct: '50%',  color: '#fb923c',       text: 'Fair' },
    { pct: '75%',  color: '#facc15',       text: 'Good' },
    { pct: '90%',  color: '#4ade80',       text: 'Strong' },
    { pct: '100%', color: '#22d3ee',       text: 'Very Strong' },
  ];
  const level = levels[Math.min(score, levels.length - 1)];
  fill.style.width      = level.pct;
  fill.style.background = level.color;
  label.textContent     = level.text;
  label.style.color     = level.color;
}

function showForgotHint() {
  showToast('Password recovery: re-register with same username to reset. 🔑', 'info');
}

