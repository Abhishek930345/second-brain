import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getRepoTree,
  getFileContent,
  getFileHistory,
  explainFile,
  findFileBugs,
  searchFunction,
  findTodos,
  getAiSummary
} from '../controllers/explorerController.js';

const router = express.Router();

router.get('/tree',         authMiddleware, getRepoTree);
router.post('/file',        authMiddleware, getFileContent);
router.post('/history',     authMiddleware, getFileHistory);
router.post('/explain',     authMiddleware, explainFile);
router.post('/bugs',        authMiddleware, findFileBugs);
router.post('/search',      authMiddleware, searchFunction);
router.post('/todos',       authMiddleware, findTodos);
router.post('/summary',     authMiddleware, getAiSummary);

export default router;