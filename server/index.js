// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import connectDB from './config/db.js';
// import { connectPinecone } from './config/pinecone.js'; // ← Add karo

// // Routes
// import authRoutes from './routes/auth.js';
// import repoRoutes from './routes/repos.js';
// import queryRoutes from './routes/query.js';

// dotenv.config();

// // Database connect karo
// connectDB();
// connectPinecone(); // ← Add karo

// const app = express();

// // Middlewares
// app.use(cors({
//   origin: process.env.CLIENT_URL,
//   credentials: true
// }));
// app.use(express.json());

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/repos', repoRoutes);
// app.use('/api/query', queryRoutes);

// // Test route
// app.get('/', (req, res) => {
//   res.json({ message: 'Second Brain API is running 🧠' });
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server chal raha hai port ${PORT} par 🚀`);
// });

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { connectPinecone } from './config/pinecone.js';

import authRoutes from './routes/auth.js';
import repoRoutes from './routes/repos.js';
import queryRoutes from './routes/query.js';

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

app.get('/', (req, res) => {
  res.json({ message: 'Second Brain API is running 🧠' });
});

const PORT = process.env.PORT || 5008;
app.listen(PORT, () => {
  console.log(`Server chal raha hai port ${PORT} par 🚀`);
});