const jwt = require('jsonwebtoken');
const COOKIE = 'easypools_session';
function sessionConfigured() {
  return typeof process.env.JWT_SECRET === 'string' && process.env.JWT_SECRET.length >= 32;
}
function setSession(res, user) {
  if (!sessionConfigured()) throw new Error('JWT_SECRET is missing or too short (minimum 32 characters)');
  const token = jwt.sign({ sub: String(user._id) }, process.env.JWT_SECRET, { expiresIn: '7d', issuer: 'easypools' });
  res.cookie(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7 * 86400 * 1000 });
}
function clearSession(res) { res.clearCookie(COOKIE, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' }); }
function requireAuth(req, res, next) {
  try {
    if (!sessionConfigured()) return res.status(503).json({ error: 'Login is temporarily unavailable. Server session configuration is missing.' });
    const token = req.cookies?.[COOKIE];
    if (!token) return res.status(401).json({ error: 'Please log in' });
    const data = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'easypools' });
    req.userId = data.sub;
    next();
  } catch { res.status(401).json({ error: 'Please log in again' }); }
}
module.exports = { setSession, clearSession, requireAuth, sessionConfigured };
