const redis = require('redis');
const util = require('util');

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.getAsync = util.promisify(this.client.get).bind(this.client);

    this.client.on('error', (error) => {
      console.error(`Redis client error: ${error.message}`);
    });

    this.client.on('connect', () => {
      // Optional: Log successful connection
      console.log('Redis client connected to the server');
    });
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    try {
      const value = await this.getAsync(key);
      return value;
    } catch (error) {
      console.error(`Failed to retrieve value for key '${key}': ${error.message}`);
      return null; // Return null or handle the error as needed
    }
  }

  async set(key, value, duration) {
    try {
      this.client.setex(key, duration, value);
    } catch (error) {
      console.error(`Failed to set value for key '${key}': ${error.message}`);
    }
  }

  async del(key) {
    try {
      this.client.del(key);
    } catch (error) {
      console.error(`Failed to delete key '${key}': ${error.message}`);
    }
  }
}

module.exports.redisClient = new RedisClient();
