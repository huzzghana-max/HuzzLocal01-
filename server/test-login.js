#!/usr/bin/env node
const axios = require('axios');

(async () => {
  try {
    console.log('🔐 Testing login endpoint...\n');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'root@admin.com',
      password: 'root123'
    });
    
    console.log('✅ Login successful!\n');
    console.log('Response:', {
      token: response.data.token ? '✓ Present' : '✗ Missing',
      user: response.data.user,
      status: response.status
    });
    
    console.log('\n📝 Setup Instructions:');
    console.log('1. Frontend should be running on http://localhost:5173');
    console.log('2. Navigate to Sign In page');
    console.log('3. Enter credentials:');
    console.log('   Email: root@admin.com');
    console.log('   Password: root123');
    console.log('4. Click Sign In button');
    console.log('\nIf still failing:');
    console.log('- Check browser console (F12)');
    console.log('- Check browser Network tab for request details');
    console.log('- Verify .env files have correct URLs');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Server is not running!');
      console.error('   Run: npm start');
    } else if (error.response) {
      console.error('❌ Login failed:', error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
})();
