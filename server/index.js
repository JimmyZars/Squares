require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { app, connectDB } = require('./app');
const port = Number(process.env.PORT) || 5000;
connectDB().then(() => app.listen(port, () => console.log(`Gridiron API listening on ${port}`)))
  .catch(err => { console.error('Could not start API:', err.message); process.exitCode = 1; });
