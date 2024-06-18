// tests/controllers.test.js

import request from 'supertest';
import { ObjectId } from 'mongodb';
import app from '../app'; // Import your Express app

jest.mock('../utils/redis', () => ({
  get: jest.fn(),
}));

jest.mock('../utils/db', () => ({
  client: {
    db: jest.fn(() => ({
      collection: jest.fn(() => ({
        findOne: jest.fn(),
        updateOne: jest.fn(),
        insertOne: jest.fn(),
        find: jest.fn(() => ({
          skip: jest.fn(() => ({
            limit: jest.fn(() => ({
              toArray: jest.fn(),
            })),
          })),
        })),
        deleteMany: jest.fn(),
      })),
    })),
  },
}));

describe('Controllers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /status should return status 200', async () => {
    const response = await request(app).get('/status');
    expect(response.status).toBe(200);
  });

  it('POST /users should create a new user', async () => {
    const userData = { email: 'test@example.com', password: 'testpassword' };

    // Mock RedisClient's get method to simulate authenticated user
    require('../utils/redis').get.mockResolvedValue('someUserId');

    // Mock MongoDB's insertOne method to simulate user creation
    require('../utils/db').client.db().collection('users').insertOne.mockResolvedValue({
      insertedId: ObjectId(),
      ops: [{ ...userData, _id: ObjectId() }],
    });

    const response = await request(app).post('/users').send(userData);
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('email', userData.email);
  });

  // Add more tests for other endpoints
});

