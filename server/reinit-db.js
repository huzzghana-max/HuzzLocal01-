#!/usr/bin/env node
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function reinitDb() {
  console.log('🗑️  Reinitializing database...\n');

  const initialPool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
  });

  try {
    let conn = await initialPool.getConnection();
    console.log('Dropping existing database...');
    await conn.query('DROP DATABASE IF EXISTS huzz_auth');
    console.log('✅ Database dropped');

    console.log('Creating fresh database...');
    await conn.query('CREATE DATABASE huzz_auth');
    console.log('✅ Database created');
    conn.release();
    await initialPool.end();

    const pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: 'huzz_auth',
      port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
    });

    conn = await pool.getConnection();

    console.log('Creating users table...');
    await conn.execute(`CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('organizer', 'provider', 'admin') DEFAULT 'organizer',
      phone VARCHAR(20),
      profile_image VARCHAR(255),
      bio TEXT,
      is_approved BOOLEAN DEFAULT TRUE,
      notification_preferences JSON,
      privacy_settings JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);
    console.log('✅ Users table created');

    console.log('Creating services table...');
    await conn.execute(`CREATE TABLE services (
      id INT AUTO_INCREMENT PRIMARY KEY,
      vendor_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      category VARCHAR(100) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      image VARCHAR(255),
      phone VARCHAR(30),
      location VARCHAR(255),
      latitude DECIMAL(10,7),
      longitude DECIMAL(10,7),
      duration VARCHAR(50),
      availability VARCHAR(50),
      is_approved BOOLEAN DEFAULT FALSE,
      approval_status ENUM('pending','approved','declined') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_approval_status (approval_status)
    )`);
    console.log('✅ Services table created');

    console.log('Creating service_bookings table...');
    await conn.execute(`CREATE TABLE service_bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      service_id INT NOT NULL,
      vendor_id INT NOT NULL,
      organizer_id INT NOT NULL,
      booking_date DATETIME NOT NULL,
      notes TEXT,
      status ENUM('pending', 'confirmed', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
      FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
    console.log('✅ Service bookings table created');

    console.log('Creating default admin user...');
    const hashedPassword = await bcrypt.hash('root123', 10);
    await conn.execute('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', ['Root Admin', 'root@admin.com', hashedPassword, 'admin']);
    console.log('✅ Admin user created');

    conn.release();
    await pool.end();
    console.log('\n✅ Database reinitialized successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

reinitDb();
