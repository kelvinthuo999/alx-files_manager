// controllers/UsersController.js

import { redisClient } from '../utils/redis';

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
  getMe,
};
