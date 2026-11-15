const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const app = express();
app.disable('x-powered-by');
app.use(helmet());
// Vercel uses same-origin requests; CORS is only needed for local development.
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000').split(',').map(s => s.trim());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '12kb' }));
app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false }));

let connecting;
async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured');
  if (!connecting) {
    connecting = mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 })
      .catch(err => { connecting = null; throw err; });
  }
  await connecting;
}
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/pools', async (_req, res, next) => {
  try { await connectDB(); next(); }
  catch (err) { console.error('Database unavailable:', err.message); res.status(503).json({ error: 'Database unavailable' }); }
}, require('./routes/pools'));
app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found' }));
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Server error' }); });
module.exports = { app, connectDB };
