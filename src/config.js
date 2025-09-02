const crypto = require('crypto');
require('dotenv').config();

const config = {
  port: process.env.PORT || 8080,
  frontendUrl: process.env.FRONTEND_URL || 'https://uzulee.github.io',
  jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
  cookieDomain: process.env.COOKIE_DOMAIN || 'uzulee.github.io',
};

module.exports = config;
