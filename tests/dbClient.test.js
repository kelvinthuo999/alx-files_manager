// tests/dbClient.test.js

import { MongoClient } from 'mongodb';
import dbClient from '../utils/db';

const uri = 'mongodb://localhost:27017'; // Adjust MongoDB URI as needed
const dbName = 'testdb'; // Adjust database name as needed

describe('DB Client', () => {
  let client;

  beforeAll(async () => {
    client = await MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await dbClient.connect(client.db(dbName));
  });

  afterAll(async () => {
    await dbClient.close();
    await client.close();
  });

  beforeEach(async () => {
    // Clear test data before each test
    await client.db(dbName).collection('files').deleteMany({});
  });

  it('should insert and find a document in the database', async () => {
    const testDocument = {
      name: 'Test File',
      userId: 'someUserId',
      type: 'file',
      isPublic: true,
      parentId: 'someParentId',
    };

    // Insert a document
    const result = await client.db(dbName).collection('files').insertOne(testDocument);
    const insertedId = result.insertedId;

    // Find the inserted document
    const foundDocument = await client.db(dbName).collection('files').findOne({ _id: insertedId });

    expect(foundDocument).toEqual(expect.objectContaining(testDocument));
  });

  it('should handle querying non-existent documents', async () => {
    const nonExistentId = 'nonExistentId';

    // Attempt to find a document by non-existent ID
    const foundDocument = await client.db(dbName).collection('files').findOne({ _id: nonExistentId });

    expect(foundDocument).toBeNull();
  });

  // Add more test cases as needed
});

