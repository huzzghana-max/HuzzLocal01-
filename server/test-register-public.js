/**
 * Test script for public event registration endpoint
 */
const http = require('http');
const { initializeDatabase, getPool } = require('./db');

// First, create a test event
async function createTestEvent() {
  // Ensure DB is initialized
  await initializeDatabase();
  
  const pool = getPool();
  if (!pool) {
    throw new Error('Database not initialized');
  }
  
  const [result] = await pool.execute(
    'INSERT INTO events (organizer_id, name, date, location, status) VALUES (?, ?, ?, ?, ?)',
    [1, 'Test Event 2026', '2026-02-20 14:00:00', 'Test Venue', 'published']
  );
  console.log('✓ Test event created with ID:', result.insertId);
  return result.insertId;
}

async function testRegistration(eventId) {
  const payload = JSON.stringify({
    name: 'John Test User',
    email: 'john@example.com',
    phone: '+1234567890'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: `/api/events/${eventId}/register-public`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`\n✓ Response Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          console.log('Response:', JSON.stringify(json, null, 2));
          resolve(json);
        } catch (e) {
          console.log('Response (raw):', data);
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  try {
    console.log('Testing public event registration...\n');
    
    // Create a test event first (organizer_id = 1 is the default admin)
    const eventId = await createTestEvent();
    
    // Test registration
    console.log(`\nRegistering for event ${eventId}...`);
    const result = await testRegistration(eventId);
    
    if (result.token) {
      console.log('\n✅ Registration successful!');
      console.log('Token:', result.token);
      console.log('QR available:', !!result.qr);
      console.log('Email sent:', result.mailSent);
    } else {
      console.log('\n❌ Registration failed');
    }
  } catch (err) {
    console.error('Test failed:', err.message);
  }
  process.exit(0);
}

run();
