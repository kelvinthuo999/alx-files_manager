// tests/redisClient.test.js

import redisClient from '../utils/redis';

describe('Redis Client', () => {
  beforeAll(async () => {
    // Connect to Redis or perform setup if needed
    await redisClient.connect();
  });

  afterAll(async () => {
    // Disconnect from Redis or perform cleanup if needed
    await redisClient.disconnect();
  });

  beforeEach(async () => {
    // Clear Redis data before each test
    await redisClient.flushdb();
  });

  it('should set and get data from Redis', async () => {
    const key = 'testKey';
    const value = 'testValue';

    // Set data in Redis
    await redisClient.set(key, value);

    // Get data from Redis
    const result = await redisClient.get(key);

    expect(result).toBe(value);
  });

  it('should handle missing keys gracefully', async () => {
    const key = 'nonexistentKey';

    // Get data for a key that doesn't exist
    const result = await redisClient.get(key);

    expect(result).toBeNull();
  });

  // Add more test cases as needed
});
