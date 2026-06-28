#!/usr/bin/env node

const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
const name = process.env.ADMIN_BOOTSTRAP_NAME || 'HUZZ Admin';

if (!connectionString) {
  console.error('Missing SUPABASE_DB_URL or DATABASE_URL.');
  process.exit(1);
}

if (!email || !password) {
  console.error('Missing ADMIN_BOOTSTRAP_EMAIL or ADMIN_BOOTSTRAP_PASSWORD.');
  process.exit(1);
}

if (password.length < 12) {
  console.error('ADMIN_BOOTSTRAP_PASSWORD must be at least 12 characters.');
  process.exit(1);
}

async function main() {
  const pool = new Pool({
    connectionString,
    ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
  });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, is_approved)
       VALUES ($1, $2, $3, 'admin', TRUE)
       ON CONFLICT (email)
       DO UPDATE SET
         name = EXCLUDED.name,
         password = EXCLUDED.password,
         role = 'admin',
         is_approved = TRUE,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id, email, role`,
      [name, email.toLowerCase().trim(), hashedPassword],
    );

    const admin = result.rows[0];
    console.log(`Admin ready: ${admin.email} (${admin.role}) id=${admin.id}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Failed to bootstrap admin:');
  console.error(error.message);
  process.exit(1);
});
