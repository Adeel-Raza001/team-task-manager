const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const passport = require('../config/passport');

const SALT_ROUNDS = 12;

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, passwordHash]
    );

    // Log the user in right after registering
    req.login(rows[0], (err) => {
      if (err) return next(err);
      res.status(201).json({ user: rows[0] });
    });
  } catch (err) {
    next(err);
  }
};

const login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: info?.message || 'Invalid credentials' });
    }

    req.login(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      res.json({
        user: { id: user.id, name: user.name, email: user.email, created_at: user.created_at },
      });
    });
  })(req, res, next);
};

const logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out' });
    });
  });
};

const me = (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, logout, me };