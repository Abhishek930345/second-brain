

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { connectPinecone } from './config/pinecone.js';

import authRoutes from './routes/auth.js';
import repoRoutes from './routes/repos.js';
import queryRoutes from './routes/query.js';
import featuresRoutes from './routes/features.js';
import explorerRoutes from './routes/explorer.js';

dotenv.config();

connectDB();
connectPinecone();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.includes('localhost') ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/repos', repoRoutes);
app.use('/api/query', queryRoutes);
app.use('/api/features', featuresRoutes);
app.use('/api/explorer', explorerRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Second Brain API is running 🧠' });
});

// Non-API routes: redirect to frontend if accidentally accessed on API port
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    const target = (process.env.CLIENT_URL || 'http://localhost:5173') + req.originalUrl;
    return res.redirect(target);
  }
  next();
});

const PORT = process.env.PORT || 5008;
app.listen(PORT, () => {
  console.log(`Server chal raha hai port ${PORT} par 🚀`);
});