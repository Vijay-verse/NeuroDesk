const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const path       = require('path');
require('dotenv').config();

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET','POST','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ── Serve static frontend files ─────────────────────────────
const distPath = path.join(__dirname, 'dist');
const useDist  = require('fs').existsSync(distPath);

if (useDist) {
  app.use(express.static(distPath));
} else {
  app.use(express.static(path.join(__dirname)));
}

// ── API Routes ──────────────────────────────────────────────
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/notes',   require('./routes/notes'));
app.use('/api/tasks',   require('./routes/tasks'));
app.use('/api/journal', require('./routes/journal'));
app.use('/api/focus',   require('./routes/focus'));

// ── Fallback → serve index.html for SPA ─────────────────────
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    const indexPath = useDist 
      ? path.join(distPath, 'index.html') 
      : path.join(__dirname, 'index.html');
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// ── MongoDB Connection ───────────────────────────────────────
const PORT       = process.env.PORT || 5000;
const MONGO_URI  = process.env.MONGODB_URI;

if (MONGO_URI) {
  mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000 
  })
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => console.error('❌ MongoDB connection failed:', err.message));
}

// Only listen if not running in a serverless environment (Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 NeuroDesk server running on port ${PORT}`);
  });
}

// Export the app for Vercel Serverless Functions
module.exports = app;
