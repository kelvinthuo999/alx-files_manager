// controllers/UsersController.js

import dbClient from '../utils/db';
import userQueue from '../utils/worker'; // Import the userQueue from worker.js

async function postNew(email, password) {
  try {
    // Insert new user into DB
    const result = await dbClient.client.db().collection('users').insertOne({ email, password });

    const newUser = {
      id: result.insertedId,
      email,
    };

    // Enqueue a job to send welcome email to the new user
    await userQueue.add({ userId: newUser.id });

    return newUser;
  } catch (error) {
    throw new Error('Unable to create user');
  }
}

async function getMe(token) {
  const key = `auth_${token}`;

  try {
    const userId = await redisClient.get(key);

    if (!userId) {
      return null;
    }

    // Simulate fetching user details from database (replace with actual query to MongoDB)
    const user = { id: userId, email: 'bob@dylan.com' }; // Example user details

    if (!user) {
      return null;
    }

    return { id: user.id, email: user.email };
  } catch (error) {
    console.error('Error in getMe:', error);
    throw error;
  }
}

export default {
  postNew,
  getMe,
};
