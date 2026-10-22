const { Pool, types } = require('pg');

types.setTypeParser(1082, (value) => value);

const url = process.env.DATABASE_URL || '';

const pool = new Pool({
  connectionString: url,
  // Hosted databases (Neon) require SSL; local Postgres does not
  ssl: url.includes('neon.tech') ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected database error', err);
});

module.exports = pool;