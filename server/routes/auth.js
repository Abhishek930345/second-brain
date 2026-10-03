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
  let origin = req.query.origin || process.env.CLIENT_URL || 'http://localhost:5173';
  try {
    origin = new URL(origin).origin;
  } catch (e) {
    origin = process.env.CLIENT_URL || 'http://localhost:5173';
  }

  const state = Buffer.from(JSON.stringify({ origin })).toString('base64');
  const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo,read:user,user:email&state=${encodeURIComponent(state)}`;
  res.redirect(url);
});

// GitHub OAuth — callback
router.get('/github/callback', githubCallback);

// Current user info
router.get('/me', authMiddleware, getMe);

// Logout
router.post('/logout', authMiddleware, logout);

export default router;