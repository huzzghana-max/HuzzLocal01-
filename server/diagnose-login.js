#!/usr/bin/env node
/**
 * Login Troubleshooting Diagnostic Script
 * Tests database connection, admin user, and login flow
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const {
  MYSQL_HOST = 'localhost',
  MYSQL_USER = 'root',
  MYSQL_PASSWORD = '',
  MYSQL_DATABASE = 'huzz_auth',
  MYSQL_PORT = 3306,
} = process.env;

async function diagnose() {
  console.log('🔍 Login Issue Diagnostic\n');
  console.log('Configuration:');
  console.log(`  Host: ${MYSQL_HOST}`);
  console.log(`  User: ${MYSQL_USER}`);
  console.log(`  Database: ${MYSQL_DATABASE}`);
  console.log(`  Port: ${MYSQL_PORT}\n`);

  let connection = null;

  try {
    // Step 1: Test connection
    console.log('1️⃣  Testing MySQL connection...');
    connection = await mysql.createConnection({
      host: MYSQL_HOST,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      port: parseInt(MYSQL_PORT),
    });
    console.log('✅ Connected to MySQL\n');

    // Step 2: Check if database exists
    console.log('2️⃣  Checking if database exists...');
    try {
      await connection.execute(`USE ${MYSQL_DATABASE}`);
      console.log(`✅ Database "${MYSQL_DATABASE}" found\n`);
    } catch (err) {
      console.error(`❌ Database "${MYSQL_DATABASE}" does not exist`);
      console.error('   Run: npm run db:init\n');
      process.exit(1);
    }

    // Step 3: Check if users table exists
    console.log('3️⃣  Checking if users table exists...');
    const [tables] = await connection.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
      [MYSQL_DATABASE]
    );
    
    if (tables.length === 0) {
      console.error('❌ users table does not exist');
      console.error('   Run: npm run db:init\n');
      process.exit(1);
    }
    console.log('✅ users table found\n');

    // Step 4: Check for admin user
    console.log('4️⃣  Checking for admin user...');
    const [users] = await connection.execute(
      'SELECT id, name, email, role FROM users WHERE email = ?',
      ['root@admin.com']
    );

    if (users.length === 0) {
      console.error('❌ Admin user (root@admin.com) not found');
      console.error('   Creating admin user now...');
      
      const adminPassword = await bcrypt.hash('root123', 10);
      await connection.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin User', 'root@admin.com', adminPassword, 'admin']
      );
      
      console.log('✅ Admin user created');
      console.log('   Email: root@admin.com');
      console.log('   Password: root123\n');
    } else {
      console.log(`✅ Admin user found: ${users[0].name}`);
      console.log(`   Role: ${users[0].role}\n`);
    }

    // Step 5: Test password
    console.log('5️⃣  Testing login with admin credentials...');
    const [adminData] = await connection.execute(
      'SELECT password FROM users WHERE email = ?',
      ['root@admin.com']
    );

    if (adminData.length === 0) {
      console.error('❌ Could not retrieve admin user');
      process.exit(1);
    }

    const isPasswordValid = await bcrypt.compare('root123', adminData[0].password);
    if (isPasswordValid) {
      console.log('✅ Password validation successful\n');
    } else {
      console.error('❌ Password validation failed');
      console.error('   Resetting admin password...');
      
      const newHashedPassword = await bcrypt.hash('root123', 10);
      await connection.execute(
        'UPDATE users SET password = ? WHERE email = ?',
        [newHashedPassword, 'root@admin.com']
      );
      
      console.log('✅ Admin password reset to: root123\n');
    }

    // Step 6: Count all users
    console.log('6️⃣  Checking all users in database...');
    const [allUsers] = await connection.execute(
      'SELECT id, name, email, role FROM users'
    );
    console.log(`✅ Total users: ${allUsers.length}`);
    allUsers.forEach(u => {
      console.log(`   - ${u.email} (${u.role})`);
    });
    console.log();

    // Step 7: Summary
    console.log('✨ Diagnostic complete!\n');
    console.log('📝 Troubleshooting Steps:');
    console.log('1. Make sure server is running:');
    console.log('   cd server');
    console.log('   npm start\n');
    console.log('2. Try logging in with:');
    console.log('   Email: root@admin.com');
    console.log('   Password: root123\n');
    console.log('3. Check browser console for errors (F12)');
    console.log('4. Check server logs for any error messages\n');
    console.log('Common issues:');
    console.log('- MySQL not running');
    console.log('- Database not initialized (run: npm run db:init)');
    console.log('- Server not started (run: npm start)');
    console.log('- Frontend pointing to wrong API URL');
    console.log('- CORS blocking requests');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Diagnostic failed:');
    console.error(error.message);

    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 MySQL authentication failed');
      console.error('   Check MYSQL_USER and MYSQL_PASSWORD in server/.env');
    } else if (error.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('\n💡 MySQL connection failed');
      console.error('   Is MySQL running on port 3306?');
    }

    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

diagnose();
