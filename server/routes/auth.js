const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { setSession, clearSession, requireAuth } = require('../auth');
const validEmail = e => typeof e === 'string' && e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const normalize = e => e.trim().toLowerCase();
const publicUser = user => ({ id: String(user._id), email: user.email });
router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!validEmail(email) || typeof password !== 'string' || password.length < 12 || password.length > 128)
      return res.status(400).json({ error: 'Enter a valid email and a password of 12–128 characters' });
    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ email: normalize(email), password: hash });
    setSession(res, user); res.status(201).json({ user: publicUser(user) });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'This email is already registered. Try signing in.' });
    next(e);
  }
});
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!validEmail(email) || typeof password !== 'string') return res.status(401).json({ error: 'Invalid email or password' });
    const user = await User.findOne({ email: normalize(email) }).select('+password');
    if (!user?.password || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Invalid email or password' });
    setSession(res, user); res.json({ user: publicUser(user) });
  } catch (e) { next(e); }
});
router.post('/google', async (req, res, next) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ error: 'Google sign-in is not configured' });
    if (typeof req.body?.credential !== 'string' || req.body.credential.length > 10000)
      return res.status(400).json({ error: 'Invalid Google credential' });
    const ticket = await new OAuth2Client(process.env.GOOGLE_CLIENT_ID).verifyIdToken({
      idToken: req.body.credential, audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    if (!payload?.email_verified || !validEmail(payload.email))
      return res.status(401).json({ error: 'A verified Google email is required' });
    const email = normalize(payload.email);
    // No Google token, provider ID, or other profile fields are persisted.
    let user = await User.findOne({ email });
    if (!user) {
      try { user = await User.create({ email, password: null }); }
      catch (e) { if (e.code !== 11000) throw e; user = await User.findOne({ email }); }
    }
    setSession(res, user); res.json({ user: publicUser(user) });
  } catch (e) {
    if (/token|signature|audience|issuer|expired/i.test(e.message)) return res.status(401).json({ error: 'Google sign-in failed' });
    next(e);
  }
});
router.get('/me', requireAuth, async (req, res, next) => {
  try { const user = await User.findById(req.userId); if (!user) return res.status(401).json({ error: 'Session expired' }); res.json({ user: publicUser(user) }); }
  catch (e) { next(e); }
});
router.post('/logout', (_req, res) => { clearSession(res); res.json({ ok: true }); });
module.exports = router;
