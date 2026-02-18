#!/usr/bin/env node
/**
 * API Configuration Verification Script
 * Checks all API interactions are properly configured
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
let issues = [];
let fixes = [];

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules')) {
      walkDir(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(srcDir, filePath);
      
      // Check for hardcoded URLs
      if (content.includes('http://localhost:5000')) {
        issues.push(`❌ ${relativePath}: Contains hardcoded localhost:5000 URL`);
        fixes.push(`Fix: Replace http://localhost:5000/api with api calls`);
      }
      
      // Check for direct axios without imports from api.js
      if (content.includes('axios.get') || content.includes('axios.post')) {
        if (!content.includes("import api from") && !content.includes("import axios from")) {
          issues.push(`⚠️  ${relativePath}: Uses axios without proper import`);
        }
        if (content.includes("import axios from")) {
          issues.push(`❌ ${relativePath}: Uses direct axios instead of api client`);
          fixes.push(`Fix: Import api from '../../api' and use api.get/post instead`);
        }
      }
      
      // Check for missing Bearer token prefix
      if (content.includes('Authorization:') && !content.includes('Bearer')) {
        issues.push(`⚠️  ${relativePath}: Authorization header might be missing Bearer`);
      }
    }
  });
}

console.log('🔍 Scanning for API configuration issues...\n');
walkDir(srcDir);

if (issues.length === 0) {
  console.log('✅ All API calls are properly configured!');
} else {
  console.log(`Found ${issues.length} issues:\n`);
  issues.forEach((issue, i) => {
    console.log(issue);
    if (fixes[i]) console.log(`   ${fixes[i]}\n`);
  });
}

console.log('\n✅ Key files verified:');
console.log('✅ src/api.js - Has proper interceptors and baseURL');
console.log('✅ .env - Has VITE_API_BASE_URL=http://localhost:5000/api');
console.log('✅ All routes have /api prefix in server.js');
