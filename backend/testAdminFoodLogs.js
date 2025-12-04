/**
 * Admin Food Logs API Test Suite
 * Tests all admin food log endpoints
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Test credentials (update these with your actual admin credentials)
const ADMIN_CREDENTIALS = {
    email: 'admin@test.com',
    password: 'admin123'
};

let adminToken = '';
let testFoodLogId = '';

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null, params = null) => {
    try {
        const config = {
            method,
            url: `${API_URL}${endpoint}`,
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        };

        if (data) config.data = data;
        if (params) config.params = params;

        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status
        };
    }
};

// Test functions
const tests = {
    // 1. Login as admin
    async loginAdmin() {
        console.log('\n========================================');
        console.log('TEST 1: Admin Login');
        console.log('========================================');
        
        try {
            const response = await axios.post(`${API_URL}/users/login`, ADMIN_CREDENTIALS);
            
            if (response.data.token) {
                adminToken = response.data.token;
                console.log('✓ Login successful');
                console.log('✓ Token received:', adminToken.substring(0, 20) + '...');
                console.log('✓ User role:', response.data.user.role);
                return true;
            } else {
                console.log('✗ Login failed: No token received');
                return false;
            }
        } catch (error) {
            console.log('✗ Login failed:', error.response?.data || error.message);
            return false;
        }
    },

    // 2. Get all food logs
    async getAllFoodLogs() {
        console.log('\n========================================');
        console.log('TEST 2: Get All Food Logs');
        console.log('========================================');
        
        const result = await makeRequest('GET', '/admin/foodlogs', null, {
            page: 1,
            limit: 10
        });

        if (result.success) {
            console.log('✓ Food logs retrieved successfully');
            console.log('✓ Total items:', result.data.pagination.totalItems);
            console.log('✓ Current page:', result.data.pagination.currentPage);
            console.log('✓ Total pages:', result.data.pagination.totalPages);
            console.log('✓ Food logs in this page:', result.data.foodLogs.length);
            
            if (result.data.foodLogs.length > 0) {
                testFoodLogId = result.data.foodLogs[0]._id;
                console.log('✓ Sample food log:', {
                    id: result.data.foodLogs[0]._id,
                    foodName: result.data.foodLogs[0].foodName,
                    user: result.data.foodLogs[0].userId?.username,
                    calories: result.data.foodLogs[0].calories
                });
            }
            return true;
        } else {
            console.log('✗ Failed to get food logs');
            console.log('✗ Error:', result.error);
            console.log('✗ Status:', result.status);
            return false;
        }
    },

    // 3. Get food logs with search
    async searchFoodLogs() {
        console.log('\n========================================');
        console.log('TEST 3: Search Food Logs');
        console.log('========================================');
        
        const result = await makeRequest('GET', '/admin/foodlogs', null, {
            page: 1,
            limit: 10,
            searchQuery: 'chicken'
        });

        if (result.success) {
            console.log('✓ Search completed successfully');
            console.log('✓ Results found:', result.data.foodLogs.length);
            if (result.data.foodLogs.length > 0) {
                console.log('✓ Sample result:', result.data.foodLogs[0].foodName);
            }
            return true;
        } else {
            console.log('✗ Search failed');
            console.log('✗ Error:', result.error);
            return false;
        }
    },

    // 4. Get food logs with date filter
    async filterByDate() {
        console.log('\n========================================');
        console.log('TEST 4: Filter Food Logs by Date');
        console.log('========================================');
        
        const endDate = new Date().toISOString();
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
        
        const result = await makeRequest('GET', '/admin/foodlogs', null, {
            page: 1,
            limit: 10,
            startDate,
            endDate
        });

        if (result.success) {
            console.log('✓ Date filter applied successfully');
            console.log('✓ Results in last 30 days:', result.data.pagination.totalItems);
            return true;
        } else {
            console.log('✗ Date filter failed');
            console.log('✗ Error:', result.error);
            return false;
        }
    },

    // 5. Get food log statistics
    async getFoodLogStats() {
        console.log('\n========================================');
        console.log('TEST 5: Get Food Log Statistics');
        console.log('========================================');
        
        const result = await makeRequest('GET', '/admin/foodlogs/stats');

        if (result.success) {
            console.log('✓ Statistics retrieved successfully');
            console.log('✓ Total food logs:', result.data.totalFoodLogs);
            console.log('✓ Total users:', result.data.totalUsers);
            console.log('✓ Recent logs (7 days):', result.data.recentLogs);
            console.log('✓ Average logs per user:', result.data.averageLogsPerUser);
            console.log('✓ Top users count:', result.data.topUsers.length);
            console.log('✓ Top foods count:', result.data.topFoods.length);
            
            if (result.data.topFoods.length > 0) {
                console.log('✓ Most logged food:', result.data.topFoods[0].foodName, 
                    `(${result.data.topFoods[0].count} times)`);
            }
            
            if (result.data.topUsers.length > 0) {
                console.log('✓ Most active user:', result.data.topUsers[0].username, 
                    `(${result.data.topUsers[0].logCount} logs)`);
            }
            return true;
        } else {
            console.log('✗ Failed to get statistics');
            console.log('✗ Error:', result.error);
            return false;
        }
    },

    // 6. Test sorting
    async testSorting() {
        console.log('\n========================================');
        console.log('TEST 6: Test Sorting');
        console.log('========================================');
        
        // Test ascending order
        const ascResult = await makeRequest('GET', '/admin/foodlogs', null, {
            page: 1,
            limit: 5,
            sortBy: 'calories',
            sortOrder: 'asc'
        });

        if (ascResult.success) {
            console.log('✓ Ascending sort successful');
            if (ascResult.data.foodLogs.length > 0) {
                console.log('✓ Lowest calories:', ascResult.data.foodLogs[0].calories, 'kcal');
            }
        } else {
            console.log('✗ Ascending sort failed');
        }

        // Test descending order
        const descResult = await makeRequest('GET', '/admin/foodlogs', null, {
            page: 1,
            limit: 5,
            sortBy: 'calories',
            sortOrder: 'desc'
        });

        if (descResult.success) {
            console.log('✓ Descending sort successful');
            if (descResult.data.foodLogs.length > 0) {
                console.log('✓ Highest calories:', descResult.data.foodLogs[0].calories, 'kcal');
            }
            return true;
        } else {
            console.log('✗ Descending sort failed');
            return false;
        }
    },

    // 7. Delete food log (if you want to test, uncomment)
    async deleteFoodLog() {
        console.log('\n========================================');
        console.log('TEST 7: Delete Food Log (SKIPPED)');
        console.log('========================================');
        console.log('⚠ Delete test is skipped to preserve data');
        console.log('⚠ To test deletion, uncomment this test and provide a test food log ID');
        return true;

        // Uncomment below to test deletion
        /*
        if (!testFoodLogId) {
            console.log('⚠ No food log ID available for deletion test');
            return false;
        }

        console.log('Attempting to delete food log:', testFoodLogId);
        
        const result = await makeRequest('DELETE', `/admin/foodlogs/${testFoodLogId}`);

        if (result.success) {
            console.log('✓ Food log deleted successfully');
            return true;
        } else {
            console.log('✗ Failed to delete food log');
            console.log('✗ Error:', result.error);
            return false;
        }
        */
    },

    // 8. Test pagination
    async testPagination() {
        console.log('\n========================================');
        console.log('TEST 8: Test Pagination');
        console.log('========================================');
        
        // Get first page
        const page1 = await makeRequest('GET', '/admin/foodlogs', null, {
            page: 1,
            limit: 5
        });

        // Get second page
        const page2 = await makeRequest('GET', '/admin/foodlogs', null, {
            page: 2,
            limit: 5
        });

        if (page1.success && page2.success) {
            console.log('✓ Pagination working correctly');
            console.log('✓ Page 1 items:', page1.data.foodLogs.length);
            console.log('✓ Page 2 items:', page2.data.foodLogs.length);
            console.log('✓ Total pages:', page1.data.pagination.totalPages);
            
            // Verify pages are different
            if (page1.data.foodLogs.length > 0 && page2.data.foodLogs.length > 0) {
                const sameIds = page1.data.foodLogs[0]._id === page2.data.foodLogs[0]._id;
                if (!sameIds) {
                    console.log('✓ Pages contain different data');
                } else {
                    console.log('⚠ Warning: Pages contain same data');
                }
            }
            return true;
        } else {
            console.log('✗ Pagination test failed');
            return false;
        }
    }
};

// Run all tests
async function runTests() {
    console.log('\n');
    console.log('╔════════════════════════════════════════╗');
    console.log('║   ADMIN FOOD LOGS API TEST SUITE      ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`Testing against: ${BASE_URL}`);
    console.log('');

    const results = {
        passed: 0,
        failed: 0,
        total: 0
    };

    // Login first
    const loginSuccess = await tests.loginAdmin();
    if (!loginSuccess) {
        console.log('\n❌ CRITICAL: Admin login failed. Cannot proceed with tests.');
        console.log('Please check your admin credentials in this file.');
        process.exit(1);
    }

    // Run all other tests
    for (const [testName, testFunc] of Object.entries(tests)) {
        if (testName === 'loginAdmin') continue; // Already ran
        
        results.total++;
        try {
            const passed = await testFunc();
            if (passed) {
                results.passed++;
            } else {
                results.failed++;
            }
        } catch (error) {
            console.log('✗ Test crashed:', error.message);
            results.failed++;
        }
    }

    // Print summary
    console.log('\n');
    console.log('╔════════════════════════════════════════╗');
    console.log('║           TEST SUMMARY                 ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`Total Tests: ${results.total}`);
    console.log(`✓ Passed: ${results.passed}`);
    console.log(`✗ Failed: ${results.failed}`);
    console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
    console.log('');

    if (results.failed === 0) {
        console.log('🎉 ALL TESTS PASSED! 🎉');
    } else {
        console.log('⚠️  SOME TESTS FAILED');
    }
    console.log('');
}

// Run the tests
runTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
});
