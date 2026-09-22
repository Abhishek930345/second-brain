import { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  FolderGit2,
  GitBranch,
  Star,
  RefreshCw,
  Trash2,
  MessageSquare,
  Lock,
  Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Repos() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchRepos();
  }, []);

  const fetchRepos = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/repos/github');
      setRepos(data);
    } catch {
      toast.error('Repos fetch karne mein error aaya');
    } finally {
      setLoading(false);
    }
  };

  const handleIngest = async (repo) => {
    try {
      setIngesting(prev => ({ ...prev, [repo.fullName]: true }));
      toast.loading(`${repo.name} ingest ho raha hai...`, { id: repo.fullName });

      await api.post('/repos/ingest', {
        repoFullName: repo.fullName,
        repoName: repo.name,
        description: repo.description,
        language: repo.language,
        stars: repo.stars
      });

      toast.success(`${repo.name} ingestion shuru ho gayi!`, { id: repo.fullName });
      fetchRepos();

    } catch {
      toast.error('Ingestion mein error aaya', { id: repo.fullName });
    } finally {
      setIngesting(prev => ({ ...prev, [repo.fullName]: false }));
    }
  };

  const handleDelete = async (repoId, repoName) => {
    try {
      await api.delete(`/repos/${repoId}`);
      toast.success(`${repoName} delete ho gaya`);
      fetchRepos();
    } catch {
      toast.error('Delete karne mein error aaya');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready':     return '#00FF94';
      case 'ingesting': return '#FFB800';
      case 'error':     return '#FF4444';
      default:          return '#8B8B9E';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ready':     return '✅ Ready';
      case 'ingesting': return '⏳ Ingesting...';
      case 'error':     return '❌ Error';
      default:          return '⭕ Not Ingested';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-accent text-xl animate-pulse">
            Repos load ho rahe hain... 🔄
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Teri Repos 📁
          </h1>
          <p className="text-gray-400">
            Repo select karo aur ingest karo
          </p>
        </div>
        <button
          onClick={fetchRepos}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-400 hover:text-white transition-all"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Repos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {repos.map((repo) => (
          <div
            key={repo.fullName}
            className="rounded-2xl p-5 flex flex-col gap-4"
            style={{
              background: '#111118',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            {/* Repo Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <FolderGit2 size={20} style={{ color: '#6C63FF' }} />
                <span className="text-white font-semibold text-sm">
                  {repo.name}
                </span>
              </div>
              {repo.isPrivate
                ? <Lock size={14} className="text-gray-500" />
                : <Globe size={14} className="text-gray-500" />
              }
            </div>

            {/* Description */}
            {repo.description && (
              <p className="text-gray-400 text-xs line-clamp-2">
                {repo.description}
              </p>
            )}

            {/* Meta */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {repo.language && (
                <span className="flex items-center gap-1">
                  <GitBranch size={12} />
                  {repo.language}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Star size={12} />
                {repo.stars}
              </span>
            </div>

            {/* Status */}
            {repo.ingestedData && (
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: getStatusColor(repo.ingestedData.status) }}>
                  {getStatusText(repo.ingestedData.status)}
                </span>
                {repo.ingestedData.totalChunks > 0 && (
                  <span className="text-gray-500">
                    {repo.ingestedData.totalChunks} chunks
                  </span>
                )}
              </div>
            )}

            {/* Scores */}
            {repo.ingestedData?.status === 'ready' && (
              <div className="space-y-2">
                {[
                  { label: 'Security', value: repo.ingestedData.securityScore, color: '#00FF94' },
                  { label: 'Quality',  value: repo.ingestedData.qualityScore,  color: '#6C63FF' },
                  { label: 'Docs',     value: repo.ingestedData.docScore,      color: '#00D4FF' },
                ].map((score) => (
                  <div key={score.label}>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{score.label}</span>
                      <span>{score.value}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-gray-800">
                      <div
                        className="h-1 rounded-full transition-all duration-500"
                        style={{
                          width: `${score.value}%`,
                          background: score.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2 mt-auto">
              {!repo.isIngested ? (
                <button
                  onClick={() => handleIngest(repo)}
                  disabled={ingesting[repo.fullName]}
                  className="flex-1 py-2 rounded-xl text-sm font-medium text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #6C63FF, #00D4FF)' }}
                >
                  {ingesting[repo.fullName] ? '⏳ Ingesting...' : '🚀 Ingest Karo'}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate(`/chat?repo=${repo.name}`)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm text-white transition-all"
                    style={{ background: 'rgba(108,99,255,0.2)' }}
                  >
                    <MessageSquare size={14} />
                    Chat
                  </button>
                  <button
                    onClick={() => handleDelete(repo.ingestedData._id, repo.name)}
                    className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}