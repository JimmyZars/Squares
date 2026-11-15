// Vercel serverless entry point. The rewrite passes the API path as `route`.
const { app } = require('../server/app');
module.exports = (req, res) => {
  const route = req.query?.route;
  if (typeof route !== 'string' || !/^[a-zA-Z0-9_\/-]*$/.test(route)) {
    return res.status(400).json({ error: 'Invalid API route' });
  }
  const query = new URL(req.url, 'http://localhost').searchParams;
  query.delete('route');
  const suffix = query.toString();
  req.url = '/api/' + route + (suffix ? '?' + suffix : '');
  return app(req, res);
};
