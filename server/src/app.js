require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const pool = require('./config/db');
const sessionMiddleware = require('./config/session');
const passport = require('./config/passport');
const authRoutes = require('./routes/auth.routes');
const teamRoutes = require('./routes/team.routes');
const taskRoutes = require('./routes/task.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';
const isVercel = Boolean(process.env.VERCEL);

// Hosting proxies: needed for secure cookies
app.set('trust proxy', 1);

app.use(helmet());

// CORS only in dev (React on :5173)
if (!isProd) {
  app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
}

app.use(express.json());
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tasks', taskRoutes);

// Docker/self-hosted production: Express serves the built React app.
// On Vercel the static files are served by Vercel itself.
if (isProd && !isVercel) {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(errorHandler);

// Exported so Vercel can use the app as a serverless function
module.exports = app;

// Only start a listening server when run directly (npm run dev / Docker)
if (require.main === module) {
  const initDb = async () => {
    const sql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
    await pool.query(sql);
  };

  initDb()
    .then(() => {
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error('Database init failed', err);
      process.exit(1);
    });
}