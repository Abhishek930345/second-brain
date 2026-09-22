

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

app.use(cors({
  origin: 'http://localhost:5173',
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

const PORT = process.env.PORT || 5008;
app.listen(PORT, () => {
  console.log(`Server chal raha hai port ${PORT} par 🚀`);
});