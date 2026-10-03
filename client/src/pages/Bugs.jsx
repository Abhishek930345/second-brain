import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Bug, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

export default function Bugs() {
  const [repos, setRepos]         = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);

  const fetchRepos = async () => {
    try {
      const { data } = await api.get('/repos/ingested');
      setRepos(data.filter(r => r.status === 'ready'));
    } catch {
      toast.error('Repos fetch failed');
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const handleScan = async () => {
    if (!selectedRepo) return toast.error('Pehle repo select karo');
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post('/features/bugs', { repoName: selectedRepo });
      setResult(data);
    } catch {
      toast.error('Bug scan mein error aaya');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':   return '#FF4444';
      case 'medium': return '#FFB800';
      case 'low':    return '#00FF94';
      default:       return '#8B8B9E';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':   return <AlertTriangle size={16} style={{ color: '#FF4444' }} />;
      case 'medium': return <Shield size={16} style={{ color: '#FFB800' }} />;
      default:       return <CheckCircle size={16} style={{ color: '#00FF94' }} />;
    }
  };

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
          <Bug style={{ color: '#FF4444' }} />
          Bug Finder 🐛
        </h1>
        <p className="text-gray-400">AI se apni repo mein bugs dhundho</p>
      </div>

      {/* Controls */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex gap-4">
          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl text-white outline-none"
            style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <option value="">Repo select karo</option>
            {repos.map(r => (
              <option key={r._id} value={r.repoName}>{r.repoName}</option>
            ))}
          </select>

          <button
            onClick={handleScan}
            disabled={loading || !selectedRepo}
            className="px-8 py-3 rounded-xl font-semibold text-white disabled:opacity-50 transition-all"
            style={{ background: 'linear-gradient(135deg, #FF4444, #FFB800)' }}
          >
            {loading ? '🔍 Scanning...' : '🐛 Bugs Dhundho'}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="text-5xl mb-4 animate-bounce">🔍</div>
          <p className="text-gray-400">AI tera code scan kar raha hai...</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4">
          {/* Summary */}
          <div
            className="rounded-2xl p-6"
            style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <h2 className="text-lg font-bold text-white mb-2">📊 Summary</h2>
            <p className="text-gray-300">{result.summary}</p>
            <div className="flex gap-4 mt-4">
              {['high', 'medium', 'low'].map(sev => {
                const count = result.bugs?.filter(b =>
                  b.severity?.toLowerCase() === sev
                ).length || 0;
                return (
                  <div key={sev} className="flex items-center gap-2">
                    {getSeverityIcon(sev)}
                    <span style={{ color: getSeverityColor(sev) }}>
                      {count} {sev}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bug List */}
          {result.bugs?.length > 0 ? (
            <div className="space-y-3">
              {result.bugs.map((bug, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-5"
                  style={{
                    background: '#111118',
                    border: `1px solid ${getSeverityColor(bug.severity)}33`
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {getSeverityIcon(bug.severity)}
                    <span
                      className="text-xs px-2 py-1 rounded-lg font-medium uppercase"
                      style={{
                        background: `${getSeverityColor(bug.severity)}22`,
                        color: getSeverityColor(bug.severity)
                      }}
                    >
                      {bug.severity}
                    </span>
                    <span className="text-gray-400 text-sm font-mono">
                      {bug.file} {bug.line && `— Line ${bug.line}`}
                    </span>
                  </div>

                  <p className="text-white mb-3 font-medium">{bug.issue}</p>

                  {bug.fix && (
                    <div
                      className="p-3 rounded-xl text-sm"
                      style={{ background: 'rgba(0,255,148,0.08)', border: '1px solid rgba(0,255,148,0.2)' }}
                    >
                      <span className="text-green-400 font-medium">✅ Fix: </span>
                      <span className="text-gray-300">{bug.fix}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div
              className="rounded-2xl p-12 text-center"
              style={{ background: '#111118', border: '1px solid rgba(0,255,148,0.2)' }}
            >
              <div className="text-5xl mb-4">✅</div>
              <p className="text-green-400 font-semibold text-lg">Koi bugs nahi mile!</p>
              <p className="text-gray-500 mt-2">Tera code clean hai 🎉</p>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}