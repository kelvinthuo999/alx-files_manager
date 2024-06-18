import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

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

export default router;
