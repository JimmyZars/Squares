const mongoose = require('mongoose');
// Store email, password hash, and the requested first and last names.
// Google-only accounts have a null password; no Google tokens are stored.
const schema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  password: { type: String, default: null, select: false },
  firstName: { type: String, trim: true, maxlength: 50, default: '' },
  lastName: { type: String, trim: true, maxlength: 50, default: '' }
}, { versionKey: false });
module.exports = mongoose.model('User', schema);
