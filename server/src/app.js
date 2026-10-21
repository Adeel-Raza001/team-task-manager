require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const sessionMiddleware = require('./config/session');

const app = express();
const PORT = process.env.PORT || 5000;

// Cloud Run / proxies: needed for secure cookies
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(sessionMiddleware);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});