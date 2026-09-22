import { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  FolderGit2,
  MessageSquare,
  Shield,
  TrendingUp
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/query/stats');
        setStats(data);
      } catch {
        console.log('Stats fetch failed');
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      icon: FolderGit2,
      label: 'Ingested Repos',
      value: stats?.totalRepos ?? 0,
      color: '#6C63FF'
    },
    {
      icon: MessageSquare,
      label: 'Total Chats',
      value: stats?.totalChats ?? 0,
      color: '#00D4FF'
    },
    {
      icon: Shield,
      label: 'Avg Security Score',
      value: stats?.avgSecurityScore ? `${stats.avgSecurityScore}%` : 'N/A',
      color: '#00FF94'
    },
    {
      icon: TrendingUp,
      label: 'AI Queries Today',
      value: stats?.totalChats ?? 0,
      color: '#FFB800'
    },
  ];

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">
          Welcome back, {user?.username} 👋
        </h1>
        <p className="text-gray-400">
          Teri codebase ready hai — kuch poochho!
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="rounded-2xl p-6"
            style={{
              background: '#111118',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <card.icon size={24} style={{ color: card.color }} />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{card.value}</p>
            <p className="text-gray-400 text-sm">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Chats */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: '#111118',
          border: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        <h2 className="text-xl font-bold text-white mb-4">
          Recent Chats 💬
        </h2>

        {stats?.recentChats?.length > 0 ? (
          <div className="space-y-3">
            {stats.recentChats.map((chat) => (
              <div
                key={chat._id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <MessageSquare size={16} style={{ color: '#6C63FF' }} />
                <span className="text-gray-300 text-sm flex-1">{chat.title}</span>
                <span className="text-gray-600 text-xs">
                  {new Date(chat.updatedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Abhi tak koi chat nahi</p>
            <p className="text-gray-600 text-sm mt-1">
              Pehle ek repo ingest karo phir chat shuru karo
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}