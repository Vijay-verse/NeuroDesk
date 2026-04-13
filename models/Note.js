const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title:     { type: String, required: true, trim: true },
  content:   { type: String, default: '' },
  tags:      { type: [String], default: [] },
  linkedTo:  { type: String, default: '' },
  color:     { type: String, default: 'purple', enum: ['purple','blue','cyan','green','orange','pink'] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-update updatedAt on save
noteSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

noteSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Note', noteSchema);
