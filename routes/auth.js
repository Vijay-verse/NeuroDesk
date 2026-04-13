const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register a user
router.post('/register', async (req, res) => {
  try {
    const { name, username, password, goal } = req.body;

    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    user = new User({ name, username, password, goal });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { name: user.name, username: user.username, goal: user.goal } });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Invalid Credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid Credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { name: user.name, username: user.username, goal: user.goal } });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PATCH /api/auth/me
// @desc    Update user profile
router.patch('/me', auth, async (req, res) => {
  try {
    const { name, goal } = req.body;
    const user = await User.findById(req.userId);
    
    if (name) user.name = name;
    if (goal) user.goal = goal;

    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
