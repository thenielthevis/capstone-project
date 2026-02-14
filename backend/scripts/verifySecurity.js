const axios = require('axios');

async function verifySecurity() {
    const baseUrl = 'http://localhost:5000';
    console.log(`Checking security for ${baseUrl}...`);

    try {
        // 1. Check Security Headers
        const response = await axios.get(baseUrl);
        const headers = response.headers;

        console.log('\n--- Header Check ---');
        console.log('X-Powered-By:', headers['x-powered-by'] || 'Removed (Good)');
        console.log('Strict-Transport-Security:', headers['strict-transport-security'] || 'Not set (Expected if not HTTPS)');
        console.log('Content-Security-Policy:', headers['content-security-policy'] ? 'Set (Good)' : 'Not set');
        console.log('X-Frame-Options:', headers['x-frame-options'] || 'Not set');

        // 2. Check 404 Sanitization
        console.log('\n--- 404 Check ---');
        try {
            await axios.get(`${baseUrl}/non-existent-route`);
        } catch (err) {
            console.log('Status Code:', err.response?.status);
            console.log('Response Body:', err.response?.data);
        }

        // 3. Check rate limiting (simple test)
        console.log('\n--- Rate Limit Check (Brief) ---');
        const requests = Array(5).fill().map(() => axios.get(`${baseUrl}/api/users`).catch(e => e));
        const results = await Promise.all(requests);
        console.log(`Performed 5 concurrent requests to /api/users. Header 'ratelimit-limit':`, results[0].headers?.['ratelimit-limit']);

    } catch (error) {
        console.error('Verification failed. Is the server running?');
        console.error(error.message);
    }
}

verifySecurity();
