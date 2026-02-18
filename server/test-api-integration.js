#!/usr/bin/env node
/**
 * API Integration Test Suite
 * Tests all backend endpoints to verify they're working
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const TEST_CREDENTIALS = {
  email: 'root@admin.com',
  password: 'root123'
};

let TOKEN = '';
let ADMIN_ID = '';

const tests = [];

function addTest(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('🧪 Starting API Integration Tests\n');
  console.log('=' * 60);
  
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`\n⏳ Running: ${test.name}`);
      await test.fn();
      console.log(`✅ PASSED: ${test.name}`);
      passed++;
    } catch (error) {
      console.error(`❌ FAILED: ${test.name}`);
      console.error(`   Error: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '=' * 60);
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log('✅ All tests passed! API is working correctly.');
  } else {
    console.log(`⚠️  ${failed} test(s) failed. Check the errors above.`);
  }
}

// Test 1: Health Check
addTest('Health Check', async () => {
  const response = await axios.get(`${BASE_URL}/health`);
  if (response.status !== 200) throw new Error('Health check failed');
});

// Test 2: User Registration
addTest('User Registration', async () => {
  const response = await axios.post(`${BASE_URL}/auth/register`, {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'TestPass123',
    role: 'organizer'
  });
  if (!response.data.user) throw new Error('Registration failed');
});

// Test 3: User Login
addTest('User Login', async () => {
  const response = await axios.post(`${BASE_URL}/auth/login`, TEST_CREDENTIALS);
  if (!response.data.token) throw new Error('Login failed - no token');
  if (!response.data.user) throw new Error('Login failed - no user data');
  TOKEN = response.data.token;
  ADMIN_ID = response.data.user.id;
});

// Test 4: Get Dashboard Stats (Organizer)
addTest('Get Organizer Dashboard Stats', async () => {
  if (!TOKEN) throw new Error('Not authenticated');
  const response = await axios.get(`${BASE_URL}/dashboard/organizer-stats`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  if (response.status !== 200) throw new Error('Failed to get organizer stats');
});

// Test 5: Get Admin Dashboard Stats
addTest('Get Admin Dashboard Stats', async () => {
  if (!TOKEN) throw new Error('Not authenticated');
  const response = await axios.get(`${BASE_URL}/dashboard/admin-stats`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  if (response.status !== 200) throw new Error('Failed to get admin stats');
});

// Test 6: Get Admin Users
addTest('Get Admin Users List', async () => {
  if (!TOKEN) throw new Error('Not authenticated');
  const response = await axios.get(`${BASE_URL}/admin/users`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  if (!Array.isArray(response.data)) throw new Error('Users list is not an array');
});

// Test 7: Get Vendors List
addTest('Get Vendors List', async () => {
  const response = await axios.get(`${BASE_URL}/vendors`);
  if (!Array.isArray(response.data)) throw new Error('Vendors list is not an array');
});

// Test 8: Get Approved Services
addTest('Get Approved Services', async () => {
  const response = await axios.get(`${BASE_URL}/approved-services`);
  if (!Array.isArray(response.data)) throw new Error('Services list is not an array');
});

// Test 9: Get Vendor Profile (authenticated provider)
addTest('Get Vendor Profile', async () => {
  const email = `vendor-profile-${Date.now()}@example.test`
  const password = 'VendorPass123!'
  // register as provider
  await axios.post(`${BASE_URL}/auth/register`, { name: 'Vendor Test', email, password, role: 'provider' })
  const login = await axios.post(`${BASE_URL}/auth/login`, { email, password })
  const token = login.data.token

  const response = await axios.get(`${BASE_URL}/vendor/profile`, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.data || !response.data.businessName) throw new Error('Invalid vendor profile')
});

// Test 10: Verify Token Auth Fails Without Token
addTest('Verify 401 Without Token', async () => {
  try {
    await axios.get(`${BASE_URL}/admin/users`);
    throw new Error('Should have failed without token');
  } catch (error) {
    if (error.response?.status !== 401) throw new Error('Should return 401');
  }
});

// --- Password change tests (edge cases + success) ---
addTest('Password change — missing current password returns 400', async () => {
  const email = `pwd-missing-${Date.now()}@example.test`
  const password = 'OldPass123!'
  await axios.post(`${BASE_URL}/auth/register`, { name: 'Pwd Missing', email, password, role: 'organizer' })
  const login = await axios.post(`${BASE_URL}/auth/login`, { email, password })
  const token = login.data.token

  try {
    await axios.put(`${BASE_URL}/settings/profile`, { name: 'Pwd Missing', email, newPassword: 'NewPass123!' }, { headers: { Authorization: `Bearer ${token}` } })
    throw new Error('Expected 400 when currentPassword missing')
  } catch (err) {
    if (err.response?.status !== 400) throw new Error('Expected 400 for missing currentPassword')
  }
});

addTest('Password change — incorrect current password returns 401', async () => {
  const email = `pwd-wrong-${Date.now()}@example.test`
  const password = 'OldPass123!'
  await axios.post(`${BASE_URL}/auth/register`, { name: 'Pwd Wrong', email, password, role: 'organizer' })
  const login = await axios.post(`${BASE_URL}/auth/login`, { email, password })
  const token = login.data.token

  try {
    await axios.put(`${BASE_URL}/settings/profile`, { name: 'Pwd Wrong', email, currentPassword: 'BadPass', newPassword: 'NewPass123!' }, { headers: { Authorization: `Bearer ${token}` } })
    throw new Error('Expected 401 when currentPassword incorrect')
  } catch (err) {
    if (err.response?.status !== 401) throw new Error('Expected 401 for incorrect currentPassword')
  }
});

addTest('Password change — success updates password and allows login with new password', async () => {
  const email = `pwd-success-${Date.now()}@example.test`
  const oldPass = 'OldPass123!'
  const newPass = 'NewPass123!'
  await axios.post(`${BASE_URL}/auth/register`, { name: 'Pwd Success', email, password: oldPass, role: 'organizer' })
  const login = await axios.post(`${BASE_URL}/auth/login`, { email, password: oldPass })
  const token = login.data.token

  const resp = await axios.put(`${BASE_URL}/settings/profile`, { name: 'Pwd Success', email, currentPassword: oldPass, newPassword: newPass }, { headers: { Authorization: `Bearer ${token}` } })
  if (resp.status !== 200) throw new Error('Profile update failed')

  // ensure we can login with new password
  const relogin = await axios.post(`${BASE_URL}/auth/login`, { email, password: newPass })
  if (!relogin.data.token) throw new Error('Login with new password failed')
});

console.log('\n🚀 API Integration Test Suite');
runTests().catch(console.error);
