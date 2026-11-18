const jwt = require('jsonwebtoken');
const COOKIE = 'easypools_session';
function setSession(res, user) {
  const token = jwt.sign({ sub: String(user._id) }, process.env.JWT_SECRET, { expiresIn: '7d', issuer: 'easypools' });
  res.cookie(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7 * 86400 * 1000 });
}
function clearSession(res) { res.clearCookie(COOKIE, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' }); }
function requireAuth(req, res, next) {
  try {
    if (!process.env.JWT_SECRET) throw Error('JWT_SECRET missing');
    const token = req.cookies?.[COOKIE];
    if (!token) return res.status(401).json({ error: 'Please log in' });
    const data = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'easypools' });
    req.userId = data.sub;
    next();
  } catch { res.status(401).json({ error: 'Please log in again' }); }
}
module.exports = { setSession, clearSession, requireAuth };
