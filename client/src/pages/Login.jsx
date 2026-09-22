import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleGithubLogin = () => {
    window.location.href = 'http://localhost:5008/api/auth/github';
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center relative overflow-hidden">

      {/* Background Glow Effects */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-accent opacity-10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-cyan-500 opacity-10 rounded-full blur-3xl" />

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass rounded-2xl p-10 w-full max-w-md mx-4 text-center relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="text-6xl mb-6"
        >
          🧠
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold mb-2"
          style={{ color: '#6C63FF' }}
        >
          Second Brain
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-400 mb-8 text-lg"
        >
          Apni poori codebase se baat karo
        </motion.p>

        {/* Features List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-left mb-8 space-y-3"
        >
          {[
            { icon: '🔍', text: 'Code ko naturally search karo' },
            { icon: '🤖', text: 'AI se apne code ke baare mein poochho' },
            { icon: '🔒', text: 'Security issues auto detect karo' },
            { icon: '📝', text: 'Auto documentation generate karo' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex items-center gap-3 text-gray-300"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm">{item.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* GitHub Login Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleGithubLogin}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, #6C63FF, #00D4FF)',
            boxShadow: '0 0 30px rgba(108, 99, 255, 0.4)'
          }}
        >
          {/* GitHub Icon */}
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          GitHub se Login Karo
        </motion.button>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-gray-600 text-xs mt-6"
        >
          Login karke tum hamare terms se agree karte ho
        </motion.p>
      </motion.div>
    </div>
  );
}