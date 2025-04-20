const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const storyRoutes = require('./routes/storyRoutes');
const scraperRoutes = require('./routes/scraperRoutes');
const userRoutes = require('./routes/userRoutes'); // Import user routes
const favoriteRoutes = require('./routes/favoriteRoutes'); // Import favorite routes

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration for trusting proxy to get correct IP
app.set('trust proxy', true);

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/stories', storyRoutes);
app.use('/api/tools', scraperRoutes);
app.use('/api/users', userRoutes); // Register user routes
app.use('/api/favorites', favoriteRoutes); // Register favorite routes

// Test route
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});