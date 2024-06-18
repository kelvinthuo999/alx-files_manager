// controllers/FilesController.js

import { v4 as uuidv4 } from 'uuid';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { redisClient } from '../utils/redis';

// Dummy user storage for demo purposes (replace with your actual database integration)
const users = [
  { id: '1', email: 'bob@dylan.com', password: '89cad29e3ebc1035b29b1478a8e70854f25fa2b2' } // Example user
];

// Dummy files storage (replace with your actual database integration)
const files = [];

// Helper function to get user by token
async function getUserByToken(token) {
  const userId = await redisClient.get(`auth_${token}`);
  return users.find(user => user.id === userId);
}

async function postUpload(req, res) {
  const token = req.headers['x-token'];
  const user = await getUserByToken(token);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { name, type, parentId = 0, isPublic = false, data } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Missing name' });
  }

  if (!['folder', 'file', 'image'].includes(type)) {
    return res.status(400).json({ error: 'Missing type' });
  }

  if (type !== 'folder' && !data) {
    return res.status(400).json({ error: 'Missing data' });
  }

  const parentFile = files.find(file => file.id === parentId);

  if (parentId && !parentFile) {
    return res.status(400).json({ error: 'Parent not found' });
  }

  if (parentId && parentFile && parentFile.type !== 'folder') {
    return res.status(400).json({ error: 'Parent is not a folder' });
  }

  const newFile = {
    id: uuidv4(),
    userId: user.id,
    name,
    type,
    isPublic,
    parentId,
  };

  if (type === 'folder') {
    files.push(newFile);
    return res.status(201).json(newFile);
  }

  const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
  await fsPromises.mkdir(folderPath, { recursive: true });

  const localPath = path.join(folderPath, uuidv4());
  const fileContent = Buffer.from(data, 'base64');

  await fsPromises.writeFile(localPath, fileContent);

  newFile.localPath = localPath;
  files.push(newFile);

  return res.status(201).json(newFile);
}

export default {
  postUpload,
};
