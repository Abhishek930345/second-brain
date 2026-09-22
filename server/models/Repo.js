import mongoose from 'mongoose';

const repoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  repoName: {
    type: String,
    required: true
  },
  repoFullName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'ingesting', 'ready', 'error'],
    default: 'pending'
  },
  totalChunks: {
    type: Number,
    default: 0
  },
  stars: {
    type: Number,
    default: 0
  },
  lastIngested: {
    type: Date
  },
  securityScore: {
    type: Number,
    default: 0
  },
  qualityScore: {
    type: Number,
    default: 0
  },
  docScore: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export default mongoose.model('Repo', repoSchema);