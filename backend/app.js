const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');

//Routers
const userRoutes = require('./routes/userRoutes');

app.use(
  cors({
    origin: [
      'http://localhost:5000',
      'http://localhost:5173',
      'http://localhost:19006', // Expo web
      'http://localhost:19000', // Expo client
      'http://localhost:8081',  // React Native dev server
      'exp://*',               // Expo Go app
    ],
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Expires', 'Pragma'],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// Use Routes
app.use('/api/users', userRoutes);

module.exports = app;