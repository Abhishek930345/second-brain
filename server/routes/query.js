import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  askQuestion,
  getChatHistory,
  getChatById,
  deleteChat,
  getDashboardStats
} from '../controllers/queryController.js';

const router = express.Router();

router.post('/ask',           authMiddleware, askQuestion);
router.get('/history',        authMiddleware, getChatHistory);
router.get('/history/:id',    authMiddleware, getChatById);
router.delete('/history/:id', authMiddleware, deleteChat);
router.get('/stats',          authMiddleware, getDashboardStats);

export default router;