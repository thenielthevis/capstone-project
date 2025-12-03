const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const connectDatabase = require('./config/database');
const User = require('./models/userModel');

async function checkUsers() {
  try {
    await connectDatabase();
    console.log('✅ Connected to database');

    const allUsers = await User.find({}).select('username email role registeredDate');
    console.log('\n📊 Total users in database:', allUsers.length);
    
    const userCount = await User.countDocuments({ role: 'user' });
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    console.log('\n👥 Users by role:');
    console.log('  - Regular users:', userCount);
    console.log('  - Admin users:', adminCount);
    
    console.log('\n📋 All users:');
    allUsers.forEach(user => {
      console.log(`  [${user.role}] ${user.username} (${user.email})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUsers();
