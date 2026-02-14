const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const app = require('./app');
const connectDatabase = require('./config/database');

// Global error handlers to surface issues during startup/runtime
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason && reason.stack ? reason.stack : reason);
});

// Start the server
// NOTE: HOST '0.0.0.0' is standard for cloud hosting (e.g., Render, Docker) 
// to ensure the server is accessible via the platform's load balancer.
const PORT = parseInt(process.env.PORT, 10) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const http = require('http');

async function start() {
    // Attempt DB connection but always try to start HTTP server afterward
    try {
        await connectDatabase();
        console.log('🔗 MongoDB Database connected (host:', process.env.MONGODB_URI || 'unknown', ')');
    } catch (dbErr) {
        console.error('Database connection failed during startup. Continuing to start HTTP server. Error:', dbErr && dbErr.message ? dbErr.message : dbErr);
    }

    // Try binding to PORT, but handle EADDRINUSE gracefully by trying the next ports up to a limit
    const maxRetries = 5;
    let attempt = 0;
    let server;
    while (attempt <= maxRetries) {
        const tryPort = PORT + attempt;
        try {
            server = http.createServer(app);
            // attach error handler before calling listen
            server.on('error', (err) => {
                if (err && err.code === 'EADDRINUSE') {
                    console.error(`Port ${tryPort} is already in use.`);
                } else {
                    console.error('Server error:', err && err.stack ? err.stack : err);
                }
            });

            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('listen timeout')), 5000);
                server.listen(tryPort, HOST, () => {
                    clearTimeout(timeout);
                    resolve();
                });
            });

            console.log(`🌐 Server started on ${HOST}:${tryPort}` + (attempt === 0 ? '' : ` (was ${PORT}, auto-switched)`));
            // expose server and stop retrying
            module.exports = server;
            return;
        } catch (err) {
            // If EADDRINUSE, try next port; otherwise rethrow
            if (err && err.message && err.message.includes('EADDRINUSE')) {
                console.warn(`EADDRINUSE on ${tryPort}, will try next port.`);
                attempt += 1;
                // small delay before retry
                await new Promise(r => setTimeout(r, 300));
                continue;
            }
            console.error('Failed to start server:', err && err.stack ? err.stack : err);
            process.exit(1);
        }
    }

    console.error(`Could not bind to any port in range ${PORT}..${PORT + maxRetries}. Exiting.`);
    process.exit(1);
}

start();