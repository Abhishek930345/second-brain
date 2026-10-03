import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Search, FileCode } from 'lucide-react';

export default function CodeSearch() {
  const [repos, setRepos]         = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [query, setQuery]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [results, setResults]     = useState(null);

  const fetchRepos = async () => {
    try {
      const { data } = await api.get('/repos/ingested');
      setRepos(data.filter(r => r.status === 'ready'));
    } catch {
      toast.error('Repos fetch failed');
    }
  };

  useEffect(() => { fetchRepos(); }, []);

  const handleSearch = async () => {
    if (!query.trim()) return toast.error('Search query daalo');
    setLoading(true);
    setResults(null);
    try {
      const { data } = await api.post('/features/search', {
        query,
        repoName: selectedRepo || null
      });
      setResults(data);
    } catch {
      toast.error('Search mein error aaya');
    } finally {
      setLoading(false);
    }
  };

  const getRelevanceColor = (relevance) => {
    switch (relevance?.toLowerCase()) {
      case 'high':   return '#00FF94';
      case 'medium': return '#FFB800';
      default:       return '#8B8B9E';
    }
  };

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
          <Search style={{ color: '#6C63FF' }} />
          Code Search 🔍
        </h1>
        <p className="text-gray-400">Google ki tarah apni codebase search karo</p>
      </div>

      {/* Search Bar */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex gap-3 mb-4">
          <div
            className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Search size={18} className="text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="payment validation logic dhundho..."
              className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none"
            />
          </div>

          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="px-4 py-3 rounded-xl text-white outline-none"
            style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <option value="">All Repos</option>
            {repos.map(r => (
              <option key={r._id} value={r.repoName}>{r.repoName}</option>
            ))}
          </select>

          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-8 py-3 rounded-xl font-semibold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #6C63FF, #00D4FF)' }}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Quick Searches */}
        <div className="flex flex-wrap gap-2">
          {[
            'authentication logic',
            'database connection',
            'error handling',
            'API routes',
            'payment flow',
            'validation'
          ].map((s, i) => (
            <button
              key={i}
              onClick={() => setQuery(s)}
              className="px-3 py-1 rounded-lg text-xs text-gray-400 hover:text-white transition-all"
              style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)' }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="text-5xl mb-4 animate-pulse">🔍</div>
          <p className="text-gray-400">Codebase search ho rahi hai...</p>
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <div>
          <p className="text-gray-400 mb-4 text-sm">
            {results.results?.length || 0} results mile — "{query}"
          </p>

          {results.results?.length > 0 ? (
            <div className="space-y-3">
              {results.results.map((r, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-5 hover:border-opacity-50 transition-all"
                  style={{
                    background: '#111118',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <FileCode size={18} style={{ color: '#6C63FF' }} />
                    <span className="text-white font-mono text-sm font-medium">
                      {r.file}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-lg"
                      style={{
                        background: `${getRelevanceColor(r.relevance)}22`,
                        color: getRelevanceColor(r.relevance)
                      }}
                    >
                      {r.relevance} relevance
                    </span>
                  </div>

                  <p className="text-gray-300 text-sm mb-3">{r.description}</p>

                  {r.snippet && (
                    <pre
                      className="p-3 rounded-xl text-xs font-mono overflow-x-auto"
                      style={{
                        background: 'rgba(0,0,0,0.4)',
                        color: '#00FF94',
                        border: '1px solid rgba(255,255,255,0.05)'
                      }}
                    >
                      {r.snippet}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div
              className="rounded-2xl p-12 text-center"
              style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <p className="text-gray-400">Koi results nahi mile</p>
              <p className="text-gray-600 text-sm mt-1">
                Alag keywords try karo
              </p>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}