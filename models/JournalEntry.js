const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  mood:      { type: String, required: true },
  moodEmoji: { type: String, required: true },
  content:   { type: String, default: '' },
  wins:      { type: String, default: '' },
  energy:    { type: Number, min: 1, max: 10, default: 5 },
  date:      { type: Date, default: Date.now }
});

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
