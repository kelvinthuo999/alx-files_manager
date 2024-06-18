// controllers/AuthController.js

import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import { redisClient } from '../utils/redis';

// Dummy user storage for demo purposes (replace with your actual database integration)
const users = [
  { id: '1', email: 'bob@dylan.com', password: '89cad29e3ebc1035b29b1478a8e70854f25fa2b2' } // Example user
];

async function getConnect(req, res) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const encodedCredentials = authHeader.slice('Basic '.length);
  const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('utf-8');
  const [email, password] = decodedCredentials.split(':');

  if (!email || !password) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Simulate database query (replace with actual query to MongoDB)
    const user = users.find(u => u.email === email && u.password === sha1(password));

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = uuidv4();
    const key = `auth_${token}`;
    const userId = user.id;

    // Store user ID in Redis with a 24-hour expiration
    await redisClient.set(key, userId, 'EX', 24 * 60 * 60);

    return res.status(200).json({ token });
  } catch (error) {
    console.error('Error in getConnect:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function getDisconnect(req, res) {
  const token = req.headers['x-token'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const key = `auth_${token}`;

  try {
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Delete the token from Redis
    await redisClient.del(key);

    return res.status(204).send();
  } catch (error) {
    console.error('Error in getDisconnect:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export default {
  getConnect,
  getDisconnect,
};
