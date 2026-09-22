import { queryCodebase } from '../services/ragService.js';
import ChatHistory from '../models/ChatHistory.js';
import Repo from '../models/Repo.js';

// Question poochho
// export const askQuestion = async (req, res) => {
//   try {
//     const { question, repoName, chatId } = req.body;
//     const userId = req.user._id;

//     if (!question) {
//       return res.status(400).json({ message: 'Question daalo' });
//     }

//     // RAG se answer lo
//     const { answer, sources } = await queryCodebase(
//       question,
//       userId,
//       repoName || null
//     );

//     // Chat history save karo
//     let chat;

//     if (chatId) {
//       // Existing chat mein add karo
//       chat = await ChatHistory.findById(chatId);
//       if (chat) {
//         chat.messages.push(
//           { role: 'user', content: question },
//           { role: 'assistant', content: answer, sources }
//         );
//         await chat.save();
//       }
//     } else {
//       // Naya chat banao
//       chat = await ChatHistory.create({
//         userId,
//         title: question.slice(0, 50),
//         messages: [
//           { role: 'user', content: question },
//           { role: 'assistant', content: answer, sources }
//         ]
//       });
//     }

//     res.json({
//       answer,
//       sources,
//       chatId: chat._id
//     });

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
export const askQuestion = async (req, res) => {
  try {
    const { question, repoName, chatId } = req.body;
    const userId = req.user._id;

    console.log('Question received:', question);
    console.log('RepoName:', repoName);
    console.log('UserId:', userId.toString());

    const { answer, sources } = await queryCodebase(
      question,
      userId,
      repoName || null
    );

    let chat;

    if (chatId) {
      chat = await ChatHistory.findById(chatId);
      if (chat) {
        chat.messages.push(
          { role: 'user', content: question },
          { role: 'assistant', content: answer, sources }
        );
        await chat.save();
      }
    }

    if (!chat) {
      chat = await ChatHistory.create({
        userId,
        title: question.slice(0, 50),
        messages: [
          { role: 'user', content: question },
          { role: 'assistant', content: answer, sources }
        ]
      });
    }

    res.json({ answer, sources, chatId: chat._id });

  } catch (error) {
    console.error('❌ askQuestion error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: error.message });
  }
};

// Chat history lo
export const getChatHistory = async (req, res) => {
  try {
    const chats = await ChatHistory.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .select('title updatedAt messages')
      .limit(20);

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Ek chat ki details lo
export const getChatById = async (req, res) => {
  try {
    const chat = await ChatHistory.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat nahi mila' });
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Chat delete karo
export const deleteChat = async (req, res) => {
  try {
    await ChatHistory.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    res.json({ message: 'Chat delete ho gaya' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Dashboard stats lo
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const totalRepos = await Repo.countDocuments({ userId, status: 'ready' });
    const totalChats = await ChatHistory.countDocuments({ userId });

    const repos = await Repo.find({ userId, status: 'ready' });
    const avgSecurity = repos.length > 0
      ? Math.round(repos.reduce((a, b) => a + b.securityScore, 0) / repos.length)
      : 0;

    const recentChats = await ChatHistory.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('title updatedAt');

    res.json({
      totalRepos,
      totalChats,
      avgSecurityScore: avgSecurity,
      recentChats
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};