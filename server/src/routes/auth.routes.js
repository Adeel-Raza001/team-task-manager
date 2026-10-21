const express = require('express');
const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { registerSchema, loginSchema } = require('../validators/auth.validator');
const { register, login, logout, me } = require('../controllers/auth.controller');

const router = express.Router();

// Slows down brute-force attempts on login/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { message: 'Too many attempts, please try again later' },
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);

module.exports = router;