const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const auth = require('../middleware/auth');

// All routes require auth
router.use(auth);

// @route   GET /api/notes
// @desc    Get all notes for user
router.get('/', async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: `Server Error: ${err.message}` });
  }
});

// @route   POST /api/notes
// @desc    Create a new note
router.post('/', async (req, res) => {
  try {
    const { title, content, tags, linkedTo, color } = req.body;
    
    // We map id from frontend to _id logic on backend if needed, 
    // or just let Mongoose create the _id.
    const newNote = new Note({
      userId: req.userId,
      title,
      content,
      tags,
      linkedTo,
      color
    });

    const note = await newNote.save();
    
    // Frontend expects id field, so we return it mapped or rely on frontend to use _id as id
    res.json({
      id: note._id, // Add this for frontend compatibility if it expects 'id'
      _id: note._id,
      title: note.title,
      content: note.content,
      tags: note.tags,
      linkedTo: note.linkedTo,
      color: note.color,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: `Server Error: ${err.message}` });
  }
});

// @route   PATCH /api/notes/:id
// @desc    Update a note
router.patch('/:id', async (req, res) => {
  try {
    const { title, content, tags, linkedTo, color } = req.body;
    let note = await Note.findById(req.params.id);

    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (note.userId.toString() !== req.userId) return res.status(401).json({ error: 'Not authorized' });

    if (title) note.title = title;
    if (content !== undefined) note.content = content;
    if (tags) note.tags = tags;
    if (linkedTo !== undefined) note.linkedTo = linkedTo;
    if (color) note.color = color;

    await note.save();
    
    res.json({
      id: note._id,
      _id: note._id,
      title: note.title,
      content: note.content,
      tags: note.tags,
      linkedTo: note.linkedTo,
      color: note.color,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ error: 'Note not found' });
    res.status(500).json({ error: `Server Error: ${err.message}` });
  }
});

// @route   DELETE /api/notes/:id
// @desc    Delete a note
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (note.userId.toString() !== req.userId) return res.status(401).json({ error: 'Not authorized' });

    await note.deleteOne();

    res.json({ msg: 'Note removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ error: 'Note not found' });
    res.status(500).json({ error: `Server Error: ${err.message}` });
  }
});

module.exports = router;
