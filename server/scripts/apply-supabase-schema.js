#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Missing SUPABASE_DB_URL or DATABASE_URL.');
  process.exit(1);
}

async function main() {
  const schemaPath = path.join(__dirname, '..', 'sql', 'supabase_schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  const pool = new Pool({
    connectionString,
    ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
  });

  try {
    console.log('Applying Supabase schema...');
    await pool.query(schemaSql);

    const { rows } = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log(`Schema applied. Public tables found: ${rows.length}`);
    console.log(rows.map((row) => `- ${row.table_name}`).join('\n'));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Failed to apply Supabase schema:');
  console.error(error.message);
  process.exit(1);
});
