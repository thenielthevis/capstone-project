#!/usr/bin/env node
// Environment checker for mobile app
// Run with: node checkEnv.js

const fs = require('fs');
const path = require('path');

console.log('=== Environment Configuration Check ===\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.log('   Copy .env.sample to .env and configure it');
  process.exit(1);
}

console.log('✓ .env file exists\n');

// Load and parse .env
require('dotenv').config();

// Check critical environment variables
const checks = [
  {
    name: 'API URL',
    key: 'EXPO_PUBLIC_API_URL',
    required: true,
    validate: (value) => {
      if (!value) return 'Not set';
      if (!value.includes('http')) return 'Must start with http:// or https://';
      if (!value.includes('/api')) return 'Should end with /api';
      return null;
    }
  },
  {
    name: 'Gemini API Key',
    key: 'EXPO_PUBLIC_GEMINI_API_KEY',
    required: false,
    validate: (value) => {
      if (!value || value === 'your_gemini_api_key_here') return 'Not configured';
      return null;
    }
  }
];

let hasErrors = false;

checks.forEach(check => {
  const value = process.env[check.key];
  const error = check.validate(value);
  
  if (error) {
    if (check.required) {
      console.error(`❌ ${check.name}: ${error}`);
      hasErrors = true;
    } else {
      console.warn(`⚠️  ${check.name}: ${error}`);
    }
  } else {
    // Mask sensitive values
    const displayValue = check.key.includes('KEY') 
      ? value.substring(0, 10) + '...' 
      : value;
    console.log(`✓ ${check.name}: ${displayValue}`);
  }
});

console.log('\n=== Network Configuration ===');
console.log('\nYour computer IP addresses:');

// Show network interfaces
const os = require('os');
const interfaces = os.networkInterfaces();

Object.keys(interfaces).forEach(name => {
  interfaces[name].forEach(iface => {
    if (iface.family === 'IPv4' && !iface.internal) {
      console.log(`  ${name}: ${iface.address}`);
    }
  });
});

console.log('\n=== Device Configuration Tips ===');
console.log('\n📱 For Physical Device:');
console.log('   - Use your computer\'s IP address (shown above)');
console.log('   - Ensure device and computer are on the same WiFi');
console.log('   - Example: http://192.168.1.100:5000/api');

console.log('\n🤖 For Android Emulator:');
console.log('   - Use: http://10.0.2.2:5000/api');

console.log('\n🍎 For iOS Simulator:');
console.log('   - Use: http://localhost:5000/api');

console.log('\n=== Next Steps ===');
if (hasErrors) {
  console.error('\n❌ Fix the errors above before running the app');
  process.exit(1);
} else {
  console.log('\n✓ Configuration looks good!');
  console.log('\nTo test connection:');
  console.log('  1. Make sure backend is running: cd backend && npm start');
  console.log('  2. Run: node testConnection.js');
  console.log('  3. Start the app: npx expo start');
}
