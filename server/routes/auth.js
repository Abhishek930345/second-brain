import express from 'express';
import {
  githubCallback,
  getMe,
  logout
} from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// GitHub OAuth — redirect
router.get('/github', (req, res) => {
  const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo,read:user,user:email`;
  res.redirect(url);
});

// GitHub OAuth — callback
router.get('/github/callback', githubCallback);

// Current user info
router.get('/me', authMiddleware, getMe);

// Logout
router.post('/logout', authMiddleware, logout);

export default router;