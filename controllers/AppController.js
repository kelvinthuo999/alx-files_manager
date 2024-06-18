import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const AppController = {
  async getStatus() {
    const redisStatus = redisClient.isAlive();
    const dbStatus = dbClient.isAlive();

    return { redis: redisStatus, db: dbStatus };
  },

  async getStats() {
    const numUsers = await dbClient.nbUsers();
    const numFiles = await dbClient.nbFiles();

    return { users: numUsers, files: numFiles };
  },
};

export default AppController;
