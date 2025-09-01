// For production, it's recommended to use environment variables.
// Example: process.env.PORT, process.env.FRONTEND_URL, etc.

require('dotenv').config(); // Add this line at the very top

const config = {
  port: process.env.PORT || 8008,

  // URL of the frontend application for CORS configuration
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // IMPORTANT: This is a default secret.
  // For production, you MUST use a strong, unique secret and keep it secure.
  // It's highly recommended to load this from an environment variable.
  jwtSecret: process.env.JWT_SECRET || 'my-secret-starcade-key-12345', // Fallback for safety

  cookieDomain: process.env.COOKIE_DOMAIN || 'localhost', // Add this line
};

module.exports = config;