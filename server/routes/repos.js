import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getUserRepos,
  ingestRepo,
  getIngestedRepos,
  getRepoStatus,
  deleteRepo,
  reindexRepo
} from '../controllers/repoController.js';

const router = express.Router();

router.get('/github',        authMiddleware, getUserRepos);
router.get('/ingested',      authMiddleware, getIngestedRepos);
router.post('/ingest',       authMiddleware, ingestRepo);
router.get('/status/:id',    authMiddleware, getRepoStatus);
router.delete('/:id',        authMiddleware, deleteRepo);
router.post('/reindex/:id',  authMiddleware, reindexRepo);

export default router;