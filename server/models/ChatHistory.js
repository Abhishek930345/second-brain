import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  sources: [{
    file: String,
    repo: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  repoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repo',
    default: null
  },
  title: {
    type: String,
    default: 'New Chat'
  },
  messages: [messageSchema]
}, { timestamps: true });

export default mongoose.model('ChatHistory', chatHistorySchema);