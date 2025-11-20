#!/usr/bin/env node
/**
 * Quick Start Helper for Lifora Mobile App
 * Helps you get everything running quickly
 */

const { exec } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n╔════════════════════════════════════════╗');
console.log('║  Lifora Mobile App - Quick Start 🚀   ║');
console.log('╚════════════════════════════════════════╝\n');

const steps = [
  {
    name: 'Check .env file',
    check: () => fs.existsSync('.env'),
    action: () => {
      if (fs.existsSync('.env.sample')) {
        fs.copyFileSync('.env.sample', '.env');
        console.log('✓ Created .env from .env.sample');
        console.log('⚠️  IMPORTANT: Edit .env and set your computer\'s IP address!');
        return true;
      }
      return false;
    }
  },
  {
    name: 'Check node_modules',
    check: () => fs.existsSync('node_modules'),
    action: () => {
      console.log('Installing dependencies... (this may take a few minutes)');
      return new Promise((resolve) => {
        exec('npm install', (error) => {
          if (error) {
            console.error('✗ npm install failed:', error.message);
            resolve(false);
          } else {
            console.log('✓ Dependencies installed');
            resolve(true);
          }
        });
      });
    }
  },
  {
    name: 'Validate environment',
    check: () => {
      if (!fs.existsSync('.env')) return false;
      const env = fs.readFileSync('.env', 'utf8');
      const match = env.match(/EXPO_PUBLIC_API_URL=(.+)/);
      if (!match) return false;
      const url = match[1].trim();
      return url && url !== 'http://192.168.1.5:5000/api';
    },
    action: () => {
      console.log('\n⚠️  You need to configure your API URL in .env file');
      console.log('\nYour network IP addresses:');
      
      const os = require('os');
      const interfaces = os.networkInterfaces();
      const ips = [];
      
      Object.keys(interfaces).forEach(name => {
        interfaces[name].forEach(iface => {
          if (iface.family === 'IPv4' && !iface.internal) {
            console.log(`  ${name}: ${iface.address}`);
            ips.push(iface.address);
          }
        });
      });
      
      if (ips.length > 0) {
        console.log(`\nExample: EXPO_PUBLIC_API_URL=http://${ips[0]}:5000/api`);
      }
      
      return false;
    }
  }
];

async function runChecks() {
  console.log('Running setup checks...\n');
  
  for (const step of steps) {
    process.stdout.write(`Checking ${step.name}... `);
    
    if (step.check()) {
      console.log('✓');
    } else {
      console.log('✗');
      const result = await step.action();
      if (!result && step.name === 'Validate environment') {
        console.log('\nPlease update your .env file and run this script again.');
        return false;
      }
    }
  }
  
  return true;
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase().trim());
    });
  });
}

async function main() {
  const ready = await runChecks();
  
  if (!ready) {
    console.log('\n⚠️  Setup incomplete. Please fix the issues above and try again.\n');
    rl.close();
    return;
  }
  
  console.log('\n✓ Setup complete!\n');
  console.log('Next steps:');
  console.log('  1. Start backend: cd ../../backend && npm start');
  console.log('  2. Test connection: node testConnection.js');
  console.log('  3. Start mobile app: npx expo start\n');
  
  const answer = await askQuestion('Would you like to test the connection now? (y/n): ');
  
  if (answer === 'y' || answer === 'yes') {
    console.log('\nTesting connection...\n');
    const { spawn } = require('child_process');
    const test = spawn('node', ['testConnection.js'], { stdio: 'inherit' });
    
    test.on('close', async (code) => {
      if (code === 0) {
        console.log('\n✓ Connection test passed!\n');
        const startAnswer = await askQuestion('Would you like to start the app now? (y/n): ');
        
        if (startAnswer === 'y' || startAnswer === 'yes') {
          console.log('\nStarting Expo...\n');
          rl.close();
          spawn('npx', ['expo', 'start', '--clear'], { stdio: 'inherit', shell: true });
        } else {
          console.log('\nYou can start the app later with: npx expo start\n');
          rl.close();
        }
      } else {
        console.log('\n⚠️  Connection test failed. Please:');
        console.log('  1. Make sure backend is running: cd ../../backend && npm start');
        console.log('  2. Check your .env configuration');
        console.log('  3. See TROUBLESHOOTING.md for help\n');
        rl.close();
      }
    });
  } else {
    console.log('\nYou can run these commands manually:');
    console.log('  node testConnection.js    - Test backend connection');
    console.log('  npx expo start --clear    - Start the mobile app\n');
    rl.close();
  }
}

main().catch(error => {
  console.error('Error:', error.message);
  rl.close();
});
