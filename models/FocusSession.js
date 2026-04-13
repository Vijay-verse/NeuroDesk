const mongoose = require('mongoose');

const focusSessionSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  seconds:      { type: Number, required: true },
  score:        { type: Number, required: true },
  task:         { type: String, default: '' },
  distractions: { type: Number, default: 0 },
  date:         { type: Date, default: Date.now }
});

module.exports = mongoose.model('FocusSession', focusSessionSchema);
