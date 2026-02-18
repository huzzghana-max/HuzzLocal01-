#!/usr/bin/env node
/**
 * Test the /api/vendor/services endpoint specifically
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// First login to get a valid token
async function testVendorServices() {
  try {
    console.log('🔐 Testing /api/vendor/services endpoint\n');

    // Step 1: Login
    console.log('Step 1: Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'root@admin.com',
      password: 'root123'
    });
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log(`✅ Login successful. Token: ${token.substring(0, 20)}...`);
    console.log(`   User ID: ${user.id}, Role: ${user.role}\n`);

    // Step 2: Test vendor services endpoint
    console.log('Step 2: Fetching vendor services...');
    try {
      const response = await axios.get(`${BASE_URL}/vendor/services`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log(`✅ Success! Services count: ${response.data.length}`);
      console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log(`❌ Error from vendor/services endpoint:`);
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${error.response?.data?.message || error.message}`);
      console.log(`   Full error:`, error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Wait for server to be ready and run tests
setTimeout(testVendorServices, 2000);
