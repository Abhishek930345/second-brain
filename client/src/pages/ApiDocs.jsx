import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FileText, Copy, Check } from 'lucide-react';

export default function ApiDocs() {
  const [repos, setRepos]         = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [loading, setLoading]     = useState(false);
  const [docs, setDocs]           = useState(null);
  const [copied, setCopied]       = useState(false);

  useEffect(() => { fetchRepos(); }, []);

  const fetchRepos = async () => {
    try {
      const { data } = await api.get('/repos/ingested');
      setRepos(data.filter(r => r.status === 'ready'));
    } catch {
      toast.error('Repos fetch failed');
    }
  };

  const handleGenerate = async () => {
    if (!selectedRepo) return toast.error('Pehle repo select karo');
    setLoading(true);
    setDocs(null);
    try {
      const { data } = await api.post('/features/api-docs', {
        repoName: selectedRepo
      });
      setDocs(data);
    } catch {
      toast.error('Docs generate karne mein error aaya');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(docs, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMethodColor = (method) => {
    switch (method?.toUpperCase()) {
      case 'GET':    return '#00FF94';
      case 'POST':   return '#6C63FF';
      case 'PUT':    return '#FFB800';
      case 'DELETE': return '#FF4444';
      default:       return '#8B8B9E';
    }
  };

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
          <FileText style={{ color: '#00D4FF' }} />
          API Docs Generator 📝
        </h1>
        <p className="text-gray-400">AI se apni API ki documentation generate karo</p>
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
            onClick={handleGenerate}
            disabled={loading || !selectedRepo}
            className="px-8 py-3 rounded-xl font-semibold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #00D4FF, #6C63FF)' }}
          >
            {loading ? '⚙️ Generating...' : '📝 Docs Generate Karo'}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="text-5xl mb-4 animate-pulse">⚙️</div>
          <p className="text-gray-400">AI teri API analyze kar raha hai...</p>
        </div>
      )}

      {/* Docs */}
      {docs && !loading && (
        <div>
          {/* Title + Copy */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">
              {docs.title || 'API Documentation'}
            </h2>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', color: copied ? '#00FF94' : '#fff' }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'JSON Copy Karo'}
            </button>
          </div>

          {/* Endpoints */}
          {docs.endpoints?.length > 0 ? (
            <div className="space-y-4">
              {docs.endpoints.map((ep, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-5"
                  style={{
                    background: '#111118',
                    border: `1px solid ${getMethodColor(ep.method)}33`
                  }}
                >
                  {/* Method + Path */}
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="px-3 py-1 rounded-lg text-xs font-bold font-mono"
                      style={{
                        background: `${getMethodColor(ep.method)}22`,
                        color: getMethodColor(ep.method)
                      }}
                    >
                      {ep.method}
                    </span>
                    <code
                      className="text-sm font-mono"
                      style={{ color: '#00D4FF' }}
                    >
                      {docs.baseUrl || '/api'}{ep.path}
                    </code>
                    {ep.auth && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-lg"
                        style={{ background: 'rgba(255,184,0,0.15)', color: '#FFB800' }}
                      >
                        🔒 Auth Required
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-300 text-sm mb-4">{ep.description}</p>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Request Body */}
                    {ep.requestBody && Object.keys(ep.requestBody).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 mb-2 uppercase">
                          Request Body
                        </p>
                        <div
                          className="p-3 rounded-xl text-xs font-mono"
                          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}
                        >
                          {Object.entries(ep.requestBody).map(([k, v]) => (
                            <div key={k} className="flex gap-2">
                              <span style={{ color: '#6C63FF' }}>{k}:</span>
                              <span className="text-gray-400">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Response */}
                    {ep.response && Object.keys(ep.response).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 mb-2 uppercase">
                          Response
                        </p>
                        <div
                          className="p-3 rounded-xl text-xs font-mono"
                          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}
                        >
                          {Object.entries(ep.response).map(([k, v]) => (
                            <div key={k} className="flex gap-2">
                              <span style={{ color: '#00FF94' }}>{k}:</span>
                              <span className="text-gray-400">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="rounded-2xl p-6"
              style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <pre className="text-gray-300 text-sm whitespace-pre-wrap">
                {docs.raw || JSON.stringify(docs, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}