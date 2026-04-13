const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subject:   { type: String, required: true, trim: true },
  title:     { type: String, required: true, trim: true },
  priority:  { type: String, default: 'medium', enum: ['high','medium','low'] },
  date:      { type: String, default: '' },       // stored as YYYY-MM-DD string
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);
