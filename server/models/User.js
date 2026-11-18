const mongoose = require('mongoose');
// Only email and password hash are stored (plus MongoDB's required _id).
// Google-only accounts have a null password; no Google tokens are stored.
const schema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  password: { type: String, default: null, select: false }
}, { versionKey: false });
module.exports = mongoose.model('User', schema);
