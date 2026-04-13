const express = require('express');
const router = express.Router();
const JournalEntry = require('../models/JournalEntry');
const auth = require('../middleware/auth');

router.use(auth);

// @route   GET /api/journal
// @desc    Get all journal entries for user
router.get('/', async (req, res) => {
  try {
    const entries = await JournalEntry.find({ userId: req.userId }).sort({ date: -1 });
    res.json(entries.map(e => ({ id: e._id, ...e.toObject() })));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/journal
// @desc    Create a new journal entry
router.post('/', async (req, res) => {
  try {
    const { mood, moodEmoji, content, wins, energy } = req.body;
    
    // Create new entry
    const newEntry = new JournalEntry({
      userId: req.userId,
      mood,
      moodEmoji,
      content,
      wins,
      energy
    });

    const entry = await newEntry.save();
    res.json({ id: entry._id, ...entry.toObject() });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/journal/:id
// @desc    Delete a journal entry
router.delete('/:id', async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id);

    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    if (entry.userId.toString() !== req.userId) return res.status(401).json({ error: 'Not authorized' });

    await entry.deleteOne();
    res.json({ msg: 'Entry removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ error: 'Entry not found' });
    res.status(500).send('Server Error');
  }
});

module.exports = router;
