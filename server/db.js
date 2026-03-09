/*
  File: server/db.js
  Purpose: Postgres (Supabase) connection layer with mysql2-compatible helpers.

  Notes:
  - This is a transitional adapter for incremental migration.
  - It keeps the `pool.execute(sql, params)` shape used across the codebase.
  - Full SQL dialect migration (MySQL -> Postgres) is still required endpoint by endpoint.
*/
require('dotenv').config()
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'
const DATABASE_URL = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || ''

let pgPool = null
let pool = null

function convertMysqlPlaceholders(sql) {
  let index = 0
  return sql.replace(/\?/g, () => `$${++index}`)
}

function shouldAppendReturningId(sql) {
  const normalized = sql.trim().toLowerCase()
  return normalized.startsWith('insert ') && !/\breturning\b/i.test(normalized)
}

async function executeWithClient(clientOrPool, sql, params = []) {
  if (!sql || typeof sql !== 'string') {
    throw new Error('SQL query must be a non-empty string')
  }

  let convertedSql = convertMysqlPlaceholders(sql)
  if (shouldAppendReturningId(convertedSql)) {
    convertedSql = `${convertedSql.replace(/;\s*$/, '')} RETURNING id`
  }

  const result = await clientOrPool.query(convertedSql, params)
  const meta = {
    affectedRows: result.rowCount || 0,
    insertId: result.rows?.[0]?.id || null,
    rowCount: result.rowCount || 0,
  }
  return [result.rows || [], meta]
}

function createCompatConnection(client) {
  return {
    execute: (sql, params = []) => executeWithClient(client, sql, params),
    release: () => client.release(),
  }
}

function createCompatPool(pgPoolInstance) {
  return {
    execute: (sql, params = []) => executeWithClient(pgPoolInstance, sql, params),
    getConnection: async () => {
      const client = await pgPoolInstance.connect()
      return createCompatConnection(client)
    },
    query: (sql, params = []) => executeWithClient(pgPoolInstance, sql, params),
    end: () => pgPoolInstance.end(),
  }
}

async function ensureDefaultAdminIfPossible() {
  if (!pool) return

  try {
    const [tableRows] = await pool.execute("SELECT to_regclass('public.users') AS users_table")
    const usersTableExists = Boolean(tableRows[0]?.users_table)
    if (!usersTableExists) {
      console.warn('Users table not found yet. Skipping default admin seed.')
      return
    }

    const adminEmail = 'root@admin.com'
    const adminPassword = 'root123'
    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    await pool.execute(
      `INSERT INTO users (name, email, password, role)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (email) DO NOTHING`,
      ['Root Admin', adminEmail, hashedPassword, 'admin'],
    )
  } catch (error) {
    console.warn('Default admin seed warning:', error.message)
  }
}

// Initialize database connection (schema migration should be handled separately in Supabase SQL migrations)
async function initializeDatabase() {
  try {
    if (!DATABASE_URL) {
      throw new Error('Missing SUPABASE_DB_URL/DATABASE_URL environment variable')
    }

    pgPool = new Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })

    await pgPool.query('SELECT 1')
    pool = createCompatPool(pgPool)

    await ensureDefaultAdminIfPossible()
    console.log('Database connection initialized successfully (Postgres)')
  } catch (error) {
    console.error('Database initialization error:', error)
    throw error
  }
}

// Register user with role
async function registerUser(name, email, password, role = 'organizer') {
  if (!pool) throw new Error('Database is not initialized. Please ensure Postgres is reachable.')

  const connection = await pool.getConnection()
  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    const [resultRows, resultMeta] = await connection.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role],
    )

    const insertedId = resultMeta.insertId || resultRows?.[0]?.id
    const user = { id: insertedId, name, email, role }
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' })

    return { token, user }
  } finally {
    connection.release()
  }
}

// Login user
async function loginUser(email, password) {
  if (!pool) throw new Error('Database is not initialized. Please ensure Postgres is reachable.')

  const connection = await pool.getConnection()
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email],
    )

    if (rows.length === 0) {
      throw new Error('User not found')
    }

    const user = rows[0]
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new Error('Invalid password')
    }

    const userObj = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      profile_image: user.profile_image || '',
    }
    const token = jwt.sign(userObj, JWT_SECRET, { expiresIn: '7d' })
    return { token, user: userObj }
  } finally {
    connection.release()
  }
}

module.exports = {
  getPool: () => pool,
  initializeDatabase,
  registerUser,
  loginUser,
  JWT_SECRET,
}
