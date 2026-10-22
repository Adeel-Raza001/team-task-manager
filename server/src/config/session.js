const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const pool = require('./db');

const isProd = process.env.NODE_ENV === 'production';

// PostgreSQL store when DATABASE_URL exists; otherwise in-memory (dev only)
const store = process.env.DATABASE_URL
  ? new pgSession({ pool, tableName: 'session' })
  : undefined;

if (!store) {
  console.warn('DATABASE_URL not set: using in-memory session store (dev only)');
}

module.exports = session({
  store,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
});