// routes/index.js

import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const router = express.Router();

// GET /status
router.get('/status', async (req, res) => {
  const status = await AppController.getStatus();
  res.status(200).json(status);
});

// GET /stats
router.get('/stats', async (req, res) => {
  const stats = await AppController.getStats();
  res.status(200).json(stats);
});

// POST /users
router.post('/users', async (req, res) => {
  const { email, password } = req.body;
  try {
    const newUser = await UsersController.postNew(email, password);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// GET /connect
router.get('/connect', async (req, res) => {
  await AuthController.getConnect(req, res);
});

// GET /disconnect
router.get('/disconnect', async (req, res) => {
  await AuthController.getDisconnect(req, res);
});

// GET /users/me
router.get('/users/me', async (req, res) => {
  const token = req.headers['x-token'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await UsersController.getMe(token);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error in /users/me:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /files
router.post('/files', async (req, res) => {
  await FilesController.postUpload(req, res);
});

export default router;
