import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  githubId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  avatar: {
    type: String
  },
  email: {
    type: String
  },
  accessToken: {
    type: String
  },
  ingestedRepos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repo'
  }]
}, { timestamps: true });

export default mongoose.model('User', userSchema);