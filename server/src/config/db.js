const { Pool, types } = require('pg');

// Return DATE columns (OID 1082) as plain 'YYYY-MM-DD' strings instead of
// JS Date objects, so timezones can never shift a due date by a day.
types.setTypeParser(1082, (value) => value);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected database error', err);
});

module.exports = pool;