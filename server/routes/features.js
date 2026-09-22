import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  explainCode,
  findBugs,
  searchCode,
  generateApiDocs
} from '../controllers/featuresController.js';

const router = express.Router();

router.post('/explain',    authMiddleware, explainCode);
router.post('/bugs',       authMiddleware, findBugs);
router.post('/search',     authMiddleware, searchCode);
router.post('/api-docs',   authMiddleware, generateApiDocs);

export default router;