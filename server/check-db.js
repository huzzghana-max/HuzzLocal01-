#!/usr/bin/env node
require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
    });
    
    const [databases] = await connection.execute('SHOW DATABASES');
    const dbNames = databases.map(d => Object.values(d)[0]);
    console.log('Databases:', dbNames);
    
    if (dbNames.includes('huzz_auth')) {
      console.log('✅ huzz_auth exists');
      
      const [tables] = await connection.execute('SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = "huzz_auth"');
      console.log('Tables:', tables.map(t => t.TABLE_NAME));
      
      const [users] = await connection.execute('SELECT * FROM huzz_auth.users');
      console.log('Users:', users.map(u => ({id: u.id, email: u.email, role: u.role})));
    } else {
      console.log('❌ huzz_auth does not exist');
    }
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
