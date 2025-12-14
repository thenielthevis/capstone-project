const mongoose = require('mongoose');
const User = require('./models/userModel');
require('dotenv').config();

async function createAdminUser() {
    try {
        // Connect to database
        await mongoose.connect(process.env.DB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@lifora.com' });
        if (existingAdmin) {
            console.log('⚠️ Admin user already exists!');
            console.log(`Email: ${existingAdmin.email}`);
            console.log(`Username: ${existingAdmin.username}`);
            mongoose.connection.close();
            return;
        }

        // Create new admin user
        const adminUser = new User({
            username: 'admin',
            email: 'admin@lifora.com',
            password: 'admin123456', // Change this to a strong password!
            role: 'admin',
            verified: true,
            gender: 'male',
        });

        await adminUser.save();

        console.log('✅ Admin user created successfully!');
        console.log('📋 Admin Credentials:');
        console.log(`   Email: admin@lifora.com`);
        console.log(`   Password: admin123456`);
        console.log(`   Username: admin`);
        console.log('\n⚠️ IMPORTANT: Change the admin password immediately after first login!');

        mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
        mongoose.connection.close();
        process.exit(1);
    }
}

createAdminUser();
