#!/usr/bin/env node

const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const baseUrl = (process.env.SMOKE_API_BASE_URL || process.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
const adminEmail = process.env.SMOKE_ADMIN_EMAIL || process.env.ADMIN_BOOTSTRAP_EMAIL;
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD || process.env.ADMIN_BOOTSTRAP_PASSWORD;
const skipAdminLogin = process.env.SMOKE_SKIP_ADMIN_LOGIN === 'true';

const checks = [];

function check(name, fn) {
  checks.push({ name, fn });
}

check('health', async () => {
  const response = await axios.get(`${baseUrl}/health`, { timeout: 15000 });
  if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
});

check('public events', async () => {
  const response = await axios.get(`${baseUrl}/events/public`, { timeout: 15000 });
  if (!Array.isArray(response.data)) throw new Error('Expected an array');
});

check('approved services', async () => {
  const response = await axios.get(`${baseUrl}/approved-services`, { timeout: 15000 });
  if (!Array.isArray(response.data)) throw new Error('Expected an array');
});

check('support categories', async () => {
  const response = await axios.get(`${baseUrl}/support/categories`, { timeout: 15000 });
  if (!Array.isArray(response.data)) throw new Error('Expected an array');
});

if (!skipAdminLogin && adminEmail && adminPassword) {
  check('admin login', async () => {
    const response = await axios.post(`${baseUrl}/auth/login`, {
      email: adminEmail,
      password: adminPassword,
    }, { timeout: 15000 });

    if (!response.data?.token) throw new Error('Missing auth token');
    if (response.data?.user?.role !== 'admin') throw new Error('Expected admin role');
  });
}

async function main() {
  console.log(`Smoke testing ${baseUrl}`);
  let passed = 0;

  for (const item of checks) {
    process.stdout.write(`- ${item.name}... `);
    await item.fn();
    passed += 1;
    console.log('ok');
  }

  console.log(`Smoke tests passed: ${passed}/${checks.length}`);
}

main().catch((error) => {
  console.error('\nSmoke test failed:');
  if (error.response) {
    console.error(`${error.response.status} ${error.response.statusText}`);
    console.error(error.response.data);
  } else {
    console.error(error.message);
  }
  process.exit(1);
});
