const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const pool = require('./db');

const isProd = process.env.NODE_ENV === 'production';

const sessionMiddleware = session({
  // Sessions are stored in PostgreSQL (falls back to memory store if DB is unavailable in dev)
  store: new pgSession({
    pool,
    tableName: 'session',
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
});

module.exports = sessionMiddleware;