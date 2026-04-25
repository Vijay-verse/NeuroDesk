const express = require('express');
const router = express.Router();
const FocusSession = require('../models/FocusSession');
const User = require('../models/User');
const auth = require('../middleware/auth');

router.use(auth);

// @route   GET /api/focus
// @desc    Get all focus sessions for user
router.get('/', async (req, res) => {
  try {
    const sessions = await FocusSession.find({ userId: req.userId }).sort({ date: -1 });
    res.json(sessions.map(s => ({ id: s._id, ...s.toObject() })));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   POST /api/focus
// @desc    Save a completed focus session
router.post('/', async (req, res) => {
  try {
    const { seconds, score, task, distractions } = req.body;
    
    const newSession = new FocusSession({
      userId: req.userId,
      seconds,
      score,
      task,
      distractions
    });

    const session = await newSession.save();
    res.json({ id: session._id, ...session.toObject() });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET /api/focus/stats
// @desc    Get user's focus stats (total time, accumulated score, streak data could be aggregated here or frontend)
router.get('/stats', async (req, res) => {
  try {
    // Basic aggregation: total seconds and score
    const result = await FocusSession.aggregate([
      { $match: { userId: new (require('mongoose').Types.ObjectId)(req.userId) } },
      { 
        $group: {
          _id: null,
          totalSeconds: { $sum: '$seconds' },
          totalScore: { $sum: '$score' }
        }
      }
    ]);

    const stats = result.length > 0 ? result[0] : { totalSeconds: 0, totalScore: 0 };

    // Calculate streak
    const sessions = await FocusSession.find({ userId: req.userId }).select('date').sort({ date: -1 });
    let streak = 0;
    if (sessions.length > 0) {
      const days = [...new Set(sessions.map(s => {
        const d = new Date(s.date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      }))];

      const current = new Date();
      const currentStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2,'0')}-${String(current.getDate()).padStart(2,'0')}`;
      
      const yesterday = new Date(current);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;

      if (days[0] === currentStr || days[0] === yesterdayStr) {
         let dateObj = new Date(days[0] + 'T00:00:00');
         for (let i = 0; i < days.length; i++) {
           const expectedStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`;
           if (days[i] === expectedStr) {
             streak++;
             dateObj.setDate(dateObj.getDate() - 1);
           } else {
             break;
           }
         }
      }
    }
    stats.streak = streak;

    res.json(stats);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
