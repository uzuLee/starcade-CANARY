const crypto = require('crypto');


const isCanary = process.env.APP_ENV === 'canary';

const config = {
  port: process.env.PORT || 8080,
  frontendUrl: process.env.FRONTEND_URL || 'https://uzulee.github.io',
  jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
  cookieDomain: process.env.COOKIE_DOMAIN || 'uzulee.github.io',
  dbFile: isCanary ? 'db.canary.json' : 'db.json',
  redisDb: isCanary ? 1 : 0,
  isCanary,
};

module.exports = config;
