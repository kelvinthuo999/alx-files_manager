import express from 'express';
import AppController from '../controllers/AppController';

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

export default router;
