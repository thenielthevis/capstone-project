// Test script to verify admin routes are working
const axios = require('axios');

async function testAdminRoutes() {
    const BASE_URL = 'http://localhost:5000/api';
    
    try {
        console.log('Step 1: Testing login...');
        const loginRes = await axios.post(`${BASE_URL}/users/login`, {
            email: 'admin@lifora.com',
            password: 'admin123456'
        });
        
        const token = loginRes.data.token;
        const user = loginRes.data.user;
        
        console.log('✓ Login successful');
        console.log('  Token:', token.substring(0, 20) + '...');
        console.log('  User role:', user.role);
        
        console.log('\nStep 2: Testing /api/admin/test endpoint...');
        const testRes = await axios.get(`${BASE_URL}/admin/test`);
        console.log('✓ Test endpoint works:', testRes.data);
        
        console.log('\nStep 3: Testing /api/users with auth...');
        const usersRes = await axios.get(`${BASE_URL}/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✓ Users endpoint works!');
        console.log('  Total users:', usersRes.data.pagination.total);
        console.log('  Users in page:', usersRes.data.users.length);
        console.log('  Sample user:', usersRes.data.users[0]);
        
    } catch (error) {
        console.error('✗ Error:', error.response?.data || error.message);
    }
}

testAdminRoutes();
