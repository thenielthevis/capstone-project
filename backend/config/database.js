const mongoose = require('mongoose');

const connectDatabase = () => {
    // Return the mongoose connect promise so callers can await or catch errors
    return mongoose.connect(process.env.DB_URI)
    .then(con => {
        try {
            const host = con && con.connection && (con.connection.host || (con.connection.client && con.connection.client.s && con.connection.client.s.options && con.connection.client.s.options.srvHost)) || 'unknown';
            console.log(`🔗 MongoDB Database connected (host: ${host})`);
        } catch (e) {
            console.log('🔗 MongoDB Database connected');
        }
        return con;
    })
    .catch(err => {
        console.error('⚠️ Error connecting to MongoDB:', err && err.message ? err.message : String(err));
        // rethrow so callers know connection failed
        throw err;
    });
}

module.exports = connectDatabase;