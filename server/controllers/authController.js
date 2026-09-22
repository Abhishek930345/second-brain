import axios from 'axios';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// GitHub se token lo aur user save karo
export const githubCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(`${process.env.CLIENT_URL}?error=no_code`);
    }

    // Step 1 — Code se GitHub access token lo
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      },
      { headers: { Accept: 'application/json' } }
    );

    const accessToken = tokenRes.data.access_token;

    if (!accessToken) {
      return res.redirect(`${process.env.CLIENT_URL}?error=no_token`);
    }

    // Step 2 — GitHub se user info lo
    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const { id, login, avatar_url, email } = userRes.data;

    // Step 3 — MongoDB mein save karo
    const user = await User.findOneAndUpdate(
      { githubId: String(id) },
      {
        username: login,
        avatar: avatar_url,
        email: email || '',
        accessToken
      },
      { upsert: true, returnDocument: 'after' }  // ← ye naya hai
    );
    // Step 4 — JWT banao
    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Step 5 — Frontend par bhejo
    res.redirect(`${process.env.CLIENT_URL}/dashboard?token=${jwtToken}`);

  } catch (error) {
    console.error('GitHub OAuth Error:', error.message);
    res.redirect(`${process.env.CLIENT_URL}?error=auth_failed`);
  }
};

// Current user ki info lo
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-accessToken');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Logout
export const logout = async (req, res) => {
  res.json({ message: 'Logout successful' });
};