const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');

router.use(auth);

// @route   GET /api/tasks
// @desc    Get all tasks for user
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(tasks.map(t => ({ id: t._id, ...t.toObject() })));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
router.post('/', async (req, res) => {
  try {
    const { subject, title, priority, date } = req.body;
    
    const newTask = new Task({
      userId: req.userId,
      subject,
      title,
      priority,
      date
    });

    const task = await newTask.save();
    res.json({ id: task._id, ...task.toObject() });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   PATCH /api/tasks/:id
// @desc    Update a task (e.g. toggle completion)
router.patch('/:id', async (req, res) => {
  try {
    const { completed, subject, title, priority, date } = req.body;
    let task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.userId.toString() !== req.userId) return res.status(401).json({ error: 'Not authorized' });

    if (completed !== undefined) task.completed = completed;
    if (subject) task.subject = subject;
    if (title) task.title = title;
    if (priority) task.priority = priority;
    if (date !== undefined) task.date = date;

    await task.save();
    res.json({ id: task._id, ...task.toObject() });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ error: 'Task not found' });
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.userId.toString() !== req.userId) return res.status(401).json({ error: 'Not authorized' });

    await task.deleteOne();
    res.json({ msg: 'Task removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ error: 'Task not found' });
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
