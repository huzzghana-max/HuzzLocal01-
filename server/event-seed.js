/**
 * Event seed script - Creates sample events with descriptions and images
 * Run this script to populate the database with test event data:
 * node server/event-seed.js
 */

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'huzz_auth',
  port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function seedEvents() {
  try {
    const connection = await pool.getConnection();

    // First, get or create a test organizer user
    const organizerEmail = 'organizer@test.com';
    const [orgUsers] = await connection.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [organizerEmail]);
    
    let organizerId;
    if (orgUsers.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      const [result] = await connection.execute(
        'INSERT INTO users (name, email, password, role, is_approved) VALUES (?, ?, ?, ?, 1)',
        ['Test Organizer', organizerEmail, hashedPassword, 'organizer']
      );
      organizerId = result.insertId;
      console.log(`✓ Created test organizer with ID: ${organizerId}`);
    } else {
      organizerId = orgUsers[0].id;
      console.log(`✓ Using existing organizer with ID: ${organizerId}`);
    }

    // Sample events with descriptions and images
    const sampleEvents = [
      {
        name: 'Summer Wedding Reception111',
        description: 'Join us for an elegant outdoor wedding reception with live music, gourmet dining, and dancing under the stars. We\'re celebrating the union of two families with an evening filled with joy, laughter, and wonderful memories. Dress code: Formal attire recommended.',
        image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + ' 18:00:00',
        location: 'Grand Ballroom, Downtown Hotel',
        type: 'Wedding',
        status: 'published'
      },
      {
        name: 'Corporate Annual Gala',
        description: 'Our company\'s flagship annual gala celebrates another successful year. Network with executives, enjoy fine dining, and be part of the awards ceremony where we recognize outstanding team members. This is an exclusive event for employees and invited guests.',
        image_url: 'https://images.unsplash.com/photo-1552301881-721db5eea782?w=800&q=80',
        date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + ' 19:00:00',
        location: 'Hyatt Regency Conference Center',
        type: 'Corporate',
        status: 'published'
      },
      {
        name: 'Birthday Celebration Bash',
        description: 'Join us for an unforgettable birthday celebration! We\'re bringing together friends and family for a night of celebration, delicious food, music, and entertainment. Come prepared for games, surprises, and plenty of cake!',
        image_url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80',
        date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + ' 20:00:00',
        location: 'Riverside Manor Event Space',
        type: 'Birthday',
        status: 'published'
      },
      {
        name: 'Tech Product Launch Event',
        description: 'Be the first to experience our latest innovation! Join us for an exclusive product launch event featuring live demonstrations, keynote speeches from industry experts, and networking opportunities. Light refreshments will be served. RSVP required.',
        image_url: 'https://images.unsplash.com/photo-1540575467063-178dd50f7da7?w=800&q=80',
        date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + ' 17:00:00',
        location: 'Tech Hub Downtown, Main Theater',
        type: 'Conference',
        status: 'published'
      },
      {
        name: 'Charity Gala Dinner',
        description: 'Support a great cause while enjoying an elegant evening! All proceeds from this charity gala will go towards [Charity Name]. Enjoy a multi-course dinner, silent auction, live entertainment, and the opportunity to make a difference. Formal dress encouraged.',
        image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
        date: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + ' 19:30:00',
        location: 'Crystal Palace Ballroom',
        type: 'Charity',
        status: 'published'
      }
    ];

    // Insert events
    let insertedCount = 0;
    for (const event of sampleEvents) {
      const [existingEvent] = await connection.execute(
        'SELECT id FROM events WHERE name = ? AND organizer_id = ? LIMIT 1',
        [event.name, organizerId]
      );

      if (existingEvent.length === 0) {
        await connection.execute(
          'INSERT INTO events (organizer_id, name, description, image_url, date, location, type, status, guest_count, budget) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [organizerId, event.name, event.description, event.image_url, event.date, event.location, event.type, event.status, 50, 5000]
        );
        insertedCount++;
        console.log(`✓ Added event: ${event.name}`);
      } else {
        console.log(`⊘ Event already exists: ${event.name}`);
      }
    }

    console.log(`\n✓ Seeding complete! Added ${insertedCount} new events.`);
    connection.release();
    await pool.end();
  } catch (error) {
    console.error('Error seeding events:', error.message);
    process.exit(1);
  }
}

seedEvents();
