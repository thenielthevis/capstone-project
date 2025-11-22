const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const app = require('./app');
const connectDatabase = require('./config/database');

// Connect to the database
connectDatabase();
// Connect to the database
connectDatabase();

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🌐 Server started on port: ${PORT}`);
});