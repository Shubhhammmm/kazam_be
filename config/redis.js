const Redis = require('ioredis');
require('dotenv').config(); // Load environment variables from .env

module.exports = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
});
