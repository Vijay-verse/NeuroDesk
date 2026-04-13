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
app.use(express.static(path.join(__dirname)));

// ── API Routes ──────────────────────────────────────────────
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/notes',   require('./routes/notes'));
app.use('/api/tasks',   require('./routes/tasks'));
app.use('/api/journal', require('./routes/journal'));
app.use('/api/focus',   require('./routes/focus'));

// ── Fallback → serve index.html for SPA ─────────────────────
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// ── MongoDB Connection ───────────────────────────────────────
const PORT       = process.env.PORT || 5000;
const MONGO_URI  = process.env.MONGODB_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`🚀 NeuroDesk server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('   Check your MONGODB_URI in .env file');
    process.exit(1);
  });

// ── Handle unhandled promise rejections ──────────────────────
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
});
