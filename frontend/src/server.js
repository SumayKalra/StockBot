// server.js
const express = require('express');
const path = require('path');
const app = express();
const jwt = require('jsonwebtoken'); // Ensure you have installed this package

// Middleware to parse JSON requests
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Example authentication middleware using JWT
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  // Check if the Authorization header is present
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  // The header format is "Bearer <token>"
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification failed:', err);
      return res.status(401).json({ message: 'Invalid token' });
    }
    // Attach user information to the request object
    req.user = user;
    next();
  });
};

// Protect API routes with authentication
app.use('/api', authenticate, require('./routes/apiRoutes'));

// No need to explicitly allow access to manifest.json if it's in the public directory
// Remove the explicit route for '/manifest.json' to avoid redundancy
// Explicitly allow public access to manifest.json
app.get('/manifest.json', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'manifest.json'));
  });
  
// Handle all other routes by serving the React app
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
