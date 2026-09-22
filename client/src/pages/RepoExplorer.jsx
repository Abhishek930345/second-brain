import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import api from '../api/axios';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import {
  FolderOpen, Folder, FileCode, ChevronRight,
  ChevronDown, Copy, Check, Bot, Bug,
  Search, Clock, AlertTriangle, Loader
} from 'lucide-react';

// ─── File Icon ─────────────────────────────────
function FileIcon({ name }) {
  const ext = name.split('.').pop().toLowerCase();
  const colors = {
    js: '#FFB800', jsx: '#00D4FF', ts: '#3178C6',
    tsx: '#3178C6', py: '#3776AB', css: '#264DE4',
    html: '#E34F26', json: '#00FF94', md: '#fff',
    java: '#ED8B00', go: '#00ADD8'
  };
  return (
    <FileCode
      size={14}
      style={{ color: colors[ext] || '#8B8B9E', flexShrink: 0 }}
    />
  );
}

// ─── Tree Node ─────────────────────────────────
function TreeNode({ node, onFileClick, selectedFile, depth = 0 }) {
  const [open, setOpen] = useState(depth < 2);
  const isFolder   = node.type === 'tree';
  const isSelected = selectedFile === node.path;

  return (
    <div>
      <div
        onClick={() => isFolder ? setOpen(!open) : onFileClick(node)}
        className="flex items-center gap-1.5 py-1 px-2 rounded-lg cursor-pointer transition-all text-sm"
        style={{
          paddingLeft: `${depth * 14 + 8}px`,
          background:  isSelected ? 'rgba(108,99,255,0.2)' : 'transparent',
          color:       isSelected ? '#6C63FF' : '#9CA3AF'
        }}
        onMouseEnter={e => {
          if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={e => {
          if (!isSelected) e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = isSelected ? '#6C63FF' : '#9CA3AF';
        }}
      >
        {isFolder ? (
          <>
            {open
              ? <ChevronDown size={12} style={{ flexShrink: 0 }} />
              : <ChevronRight size={12} style={{ flexShrink: 0 }} />
            }
            {open
              ? <FolderOpen size={14} style={{ color: '#FFB800', flexShrink: 0 }} />
              : <Folder     size={14} style={{ color: '#FFB800', flexShrink: 0 }} />
            }
          </>
        ) : (
          <>
            <span style={{ width: 12 }} />
            <FileIcon name={node.name} />
          </>
        )}
        <span className="truncate text-xs">{node.name}</span>
      </div>

      {isFolder && open && node.children?.map(child => (
        <TreeNode
          key={child.path}
          node={child}
          onFileClick={onFileClick}
          selectedFile={selectedFile}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────
export default function RepoExplorer() {
  const { repoName } = useParams();
  const navigate = useNavigate();
  const [tree, setTree]             = useState([]);
  const [reposList, setReposList]   = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileData, setFileData]     = useState(null);
  const [loading, setLoading]       = useState(false);
  const [treeLoading, setTreeLoading] = useState(true);
  const [activeTab, setActiveTab]   = useState('code');
  const [aiResult, setAiResult]     = useState(null);
  const [aiLoading, setAiLoading]   = useState(false);
  const [copied, setCopied]         = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [history, setHistory]       = useState(null);
  const [todos, setTodos]           = useState(null);
  const [repoFullName, setRepoFullName] = useState('');

  useEffect(() => {
    fetchTree();
  }, [repoName]);

  const fetchTree = async () => {
    try {
      setTreeLoading(true);

      // RepoFullName get karo
      const reposRes = await api.get('/repos/ingested');
      const readyRepos = reposRes.data || [];
      setReposList(readyRepos);

      if (readyRepos.length === 0) {
        setTree([]);
        return;
      }

      const repo = repoName
        ? readyRepos.find(r => r.repoName === repoName)
        : readyRepos[0];

      if (!repo) return toast.error('Repo nahi mili');

      if (!repoName && repo.repoName) {
        navigate(`/explorer/${repo.repoName}`, { replace: true });
        return;
      }

      const fullName = repo.repoFullName;
      setRepoFullName(fullName);

      const { data } = await api.get('/explorer/tree', {
        params: { repoFullName: fullName }
      });
      setTree(data.tree || []);

    } catch {
      toast.error('Tree load nahi hua');
    } finally {
      setTreeLoading(false);
    }
  };

  const handleFileClick = async (node) => {
    if (node.type === 'tree') return;
    setSelectedFile(node.path);
    setFileData(null);
    setAiResult(null);
    setSearchResults(null);
    setHistory(null);
    setTodos(null);
    setActiveTab('code');
    setLoading(true);

    try {
      const { data } = await api.post('/explorer/file', {
        repoFullName,
        filePath: node.path
      });
      setFileData(data);

      // Auto summary load karo
      loadSummary(data.content, node.path);

    } catch {
      toast.error('File load nahi hui');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async (content, filePath) => {
    try {
      const { data } = await api.post('/explorer/summary', {
        content, filePath
      });
      setFileData(prev => prev ? { ...prev, summary: data.summary } : null);
    } catch {
      // Summary optional hai
    }
  };

  const handleExplain = async () => {
    if (!fileData) return;
    setAiLoading(true);
    setAiResult(null);
    setActiveTab('explain');
    try {
      const { data } = await api.post('/explorer/explain', {
        content:  fileData.content,
        filePath: selectedFile
      });
      setAiResult({ type: 'explain', data: data.explanation });
    } catch {
      toast.error('Explain nahi ho saka');
    } finally {
      setAiLoading(false);
    }
  };

  const handleBugs = async () => {
    if (!fileData) return;
    setAiLoading(true);
    setAiResult(null);
    setActiveTab('bugs');
    try {
      const { data } = await api.post('/explorer/bugs', {
        content:  fileData.content,
        filePath: selectedFile
      });
      setAiResult({ type: 'bugs', data });
    } catch {
      toast.error('Bug scan nahi hua');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !fileData) return;
    try {
      const { data } = await api.post('/explorer/search', {
        content:  fileData.content,
        filePath: selectedFile,
        query:    searchQuery
      });
      setSearchResults(data.results);
      setActiveTab('search');
    } catch {
      toast.error('Search nahi hua');
    }
  };

  const handleHistory = async () => {
    if (!selectedFile) return;
    setActiveTab('history');
    if (history) return;
    try {
      const { data } = await api.post('/explorer/history', {
        repoFullName,
        filePath: selectedFile
      });
      setHistory(data.commits);
    } catch {
      toast.error('History load nahi hui');
    }
  };

  const handleTodos = async () => {
    if (!fileData) return;
    setActiveTab('todos');
    if (todos) return;
    try {
      const { data } = await api.post('/explorer/todos', {
        content:  fileData.content,
        filePath: selectedFile
      });
      setTodos(data.todos);
    } catch {
      toast.error('TODOs nahi mile');
    }
  };

  const handleCopy = () => {
    if (!fileData) return;
    navigator.clipboard.writeText(fileData.content);
    setCopied(true);
    toast.success('Code copy ho gaya!');
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeverityColor = (s) => {
    if (s === 'high')   return '#FF4444';
    if (s === 'medium') return '#FFB800';
    return '#00FF94';
  };

  const getTodoColor = (type) => {
    if (type === 'FIXME' || type === 'BUG') return '#FF4444';
    if (type === 'HACK'  || type === 'XXX') return '#FFB800';
    return '#6C63FF';
  };

  const tabs = [
    { id: 'code',    label: '📄 Code'    },
    { id: 'explain', label: '🤖 Explain' },
    { id: 'bugs',    label: '🐛 Bugs'    },
    { id: 'search',  label: '🔍 Search'  },
    { id: 'history', label: '⏰ History' },
    { id: 'todos',   label: '📝 TODOs'   },
  ];

  return (
    <Layout>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FolderOpen style={{ color: '#FFB800' }} />
            {repoName || 'Repo Explorer'}
          </h1>
          <p className="text-gray-400 text-sm">
            File select karo — AI se samjho
          </p>
        </div>

        {reposList.length > 0 && (
          <select
            value={repoName || ''}
            onChange={(e) => navigate(`/explorer/${e.target.value}`)}
            className="px-4 py-2 rounded-xl text-white outline-none text-sm cursor-pointer"
            style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {reposList.map((r) => (
              <option key={r._id || r.repoName} value={r.repoName}>
                {r.repoName}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Main Layout */}
      <div className="flex gap-4 h-[calc(100vh-160px)]">

        {/* Left — File Tree */}
        <div
          className="w-64 flex-shrink-0 rounded-2xl overflow-y-auto"
          style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div
            className="p-3 text-xs font-semibold text-gray-400 uppercase sticky top-0"
            style={{ background: '#111118', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            📁 Files
          </div>

          <div className="p-2">
            {treeLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader size={20} className="animate-spin text-accent" style={{ color: '#6C63FF' }} />
              </div>
            ) : (
              tree.map(node => (
                <TreeNode
                  key={node.path}
                  node={node}
                  onFileClick={handleFileClick}
                  selectedFile={selectedFile}
                />
              ))
            )}
          </div>
        </div>

        {/* Right — Code Viewer */}
        <div className="flex-1 flex flex-col min-w-0">

          {!selectedFile ? (
            <div
              className="flex-1 rounded-2xl flex flex-col items-center justify-center"
              style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="text-6xl mb-4">📄</div>
              <p className="text-gray-400 text-lg">Koi file select karo</p>
              <p className="text-gray-600 text-sm mt-1">
                Left sidebar se file choose karo
              </p>
            </div>
          ) : (
            <>
              {/* File Info Bar */}
              {fileData && (
                <div
                  className="rounded-2xl p-3 mb-3 flex items-center gap-4"
                  style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <span className="text-white text-sm font-mono font-medium truncate flex-1">
                    📄 {selectedFile}
                  </span>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-gray-400 flex-shrink-0">
                    <span>{fileData.lines} lines</span>
                    <span
                      className="px-2 py-0.5 rounded-lg"
                      style={{
                        background: fileData.complexity === 'High'
                          ? 'rgba(255,68,68,0.15)'
                          : fileData.complexity === 'Medium'
                          ? 'rgba(255,184,0,0.15)'
                          : 'rgba(0,255,148,0.15)',
                        color: fileData.complexity === 'High'
                          ? '#FF4444'
                          : fileData.complexity === 'Medium'
                          ? '#FFB800'
                          : '#00FF94'
                      }}
                    >
                      {fileData.complexity} complexity
                    </span>
                    {fileData.todoCount > 0 && (
                      <span
                        className="px-2 py-0.5 rounded-lg"
                        style={{ background: 'rgba(255,184,0,0.15)', color: '#FFB800' }}
                      >
                        {fileData.todoCount} TODOs
                      </span>
                    )}
                  </div>

                  {/* Copy Button */}
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-all flex-shrink-0"
                    style={{
                      background: copied ? 'rgba(0,255,148,0.15)' : 'rgba(255,255,255,0.05)',
                      color:      copied ? '#00FF94' : '#fff'
                    }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              )}

              {/* AI Summary */}
              {fileData?.summary && (
                <div
                  className="rounded-xl px-4 py-2 mb-3 text-sm flex items-center gap-2"
                  style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)' }}
                >
                  <Bot size={14} style={{ color: '#6C63FF', flexShrink: 0 }} />
                  <span className="text-gray-300">{fileData.summary}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 mb-3 flex-wrap">
                <button
                  onClick={handleExplain}
                  disabled={!fileData || aiLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-all"
                  style={{ background: 'rgba(108,99,255,0.2)', border: '1px solid rgba(108,99,255,0.3)' }}
                >
                  <Bot size={14} />
                  🤖 Explain
                </button>

                <button
                  onClick={handleBugs}
                  disabled={!fileData || aiLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-all"
                  style={{ background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.3)' }}
                >
                  <Bug size={14} />
                  🐛 Find Bugs
                </button>

                <button
                  onClick={handleTodos}
                  disabled={!fileData}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-all"
                  style={{ background: 'rgba(255,184,0,0.15)', border: '1px solid rgba(255,184,0,0.3)' }}
                >
                  <AlertTriangle size={14} />
                  📝 TODOs
                </button>

                <button
                  onClick={handleHistory}
                  disabled={!fileData}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-all"
                  style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)' }}
                >
                  <Clock size={14} />
                  ⏰ History
                </button>

                {/* Search */}
                <div className="flex gap-2 flex-1 ml-auto">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Function dhundho..."
                    className="flex-1 px-3 py-2 rounded-xl text-sm text-white placeholder-gray-500 outline-none min-w-0"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <button
                    onClick={handleSearch}
                    className="px-4 py-2 rounded-xl text-sm text-white"
                    style={{ background: 'rgba(0,255,148,0.15)', border: '1px solid rgba(0,255,148,0.3)' }}
                  >
                    <Search size={14} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-3">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="px-3 py-1.5 rounded-lg text-xs transition-all"
                    style={{
                      background: activeTab === tab.id
                        ? 'rgba(108,99,255,0.2)'
                        : 'transparent',
                      color: activeTab === tab.id ? '#6C63FF' : '#6B7280'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div
                className="flex-1 rounded-2xl overflow-auto"
                style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {loading && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Loader size={32} className="animate-spin mx-auto mb-3" style={{ color: '#6C63FF' }} />
                      <p className="text-gray-400">File load ho rahi hai...</p>
                    </div>
                  </div>
                )}

                {/* CODE TAB */}
                {!loading && activeTab === 'code' && fileData && (
                  <pre
                    className="p-4 text-xs font-mono leading-relaxed overflow-auto h-full"
                    style={{ color: '#E2E8F0' }}
                  >
                    {fileData.content.split('\n').map((line, i) => (
                      <div key={i} className="flex gap-4 hover:bg-white/5 rounded">
                        <span
                          className="select-none text-right flex-shrink-0"
                          style={{ color: '#4B5563', width: '40px' }}
                        >
                          {i + 1}
                        </span>
                        <span className="flex-1">{line || ' '}</span>
                      </div>
                    ))}
                  </pre>
                )}

                {/* EXPLAIN TAB */}
                {activeTab === 'explain' && (
                  <div className="p-4 h-full overflow-auto">
                    {aiLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="text-4xl mb-3 animate-pulse">🤖</div>
                          <p className="text-gray-400">AI explain kar raha hai...</p>
                        </div>
                      </div>
                    ) : aiResult?.type === 'explain' ? (
                      <div className="prose prose-invert max-w-none">
                        <ReactMarkdown>{aiResult.data}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        🤖 Explain button dabao
                      </div>
                    )}
                  </div>
                )}

                {/* BUGS TAB */}
                {activeTab === 'bugs' && (
                  <div className="p-4 h-full overflow-auto">
                    {aiLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="text-4xl mb-3 animate-bounce">🐛</div>
                          <p className="text-gray-400">Bugs dhundh raha hai...</p>
                        </div>
                      </div>
                    ) : aiResult?.type === 'bugs' ? (
                      <div className="space-y-3">
                        <p className="text-gray-400 text-sm">{aiResult.data.summary}</p>
                        {aiResult.data.bugs?.length > 0 ? (
                          aiResult.data.bugs.map((bug, i) => (
                            <div
                              key={i}
                              className="p-4 rounded-xl"
                              style={{
                                background: `${getSeverityColor(bug.severity)}11`,
                                border:     `1px solid ${getSeverityColor(bug.severity)}33`
                              }}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span
                                  className="text-xs px-2 py-0.5 rounded font-medium"
                                  style={{
                                    background: `${getSeverityColor(bug.severity)}22`,
                                    color:      getSeverityColor(bug.severity)
                                  }}
                                >
                                  {bug.severity?.toUpperCase()}
                                </span>
                                {bug.line && (
                                  <span className="text-gray-500 text-xs">Line {bug.line}</span>
                                )}
                              </div>
                              <p className="text-white text-sm mb-2">{bug.issue}</p>
                              {bug.fix && (
                                <p className="text-green-400 text-xs">
                                  ✅ Fix: {bug.fix}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <div className="text-4xl mb-2">✅</div>
                            <p className="text-green-400">Koi bugs nahi mile!</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        🐛 Find Bugs button dabao
                      </div>
                    )}
                  </div>
                )}

                {/* SEARCH TAB */}
                {activeTab === 'search' && (
                  <div className="p-4 h-full overflow-auto">
                    {searchResults ? (
                      searchResults.length > 0 ? (
                        <div className="space-y-3">
                          <p className="text-gray-400 text-sm">
                            {searchResults.length} results — "{searchQuery}"
                          </p>
                          {searchResults.map((r, i) => (
                            <div
                              key={i}
                              className="p-3 rounded-xl"
                              style={{ background: 'rgba(0,255,148,0.05)', border: '1px solid rgba(0,255,148,0.15)' }}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span
                                  className="text-xs px-2 py-0.5 rounded"
                                  style={{ background: 'rgba(108,99,255,0.2)', color: '#6C63FF' }}
                                >
                                  Line {r.lineNumber}
                                </span>
                              </div>
                              <pre className="text-xs font-mono text-gray-300 overflow-x-auto">
                                {r.context}
                              </pre>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          Koi results nahi mile
                        </div>
                      )
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        🔍 Function name type karo aur search karo
                      </div>
                    )}
                  </div>
                )}

                {/* HISTORY TAB */}
                {activeTab === 'history' && (
                  <div className="p-4 h-full overflow-auto">
                    {history ? (
                      history.length > 0 ? (
                        <div className="space-y-3">
                          {history.map((commit, i) => (
                            <div
                              key={i}
                              className="p-3 rounded-xl flex items-start gap-3"
                              style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}
                            >
                              <span
                                className="text-xs font-mono px-2 py-0.5 rounded flex-shrink-0"
                                style={{ background: 'rgba(0,212,255,0.15)', color: '#00D4FF' }}
                              >
                                {commit.sha}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm truncate">
                                  {commit.message}
                                </p>
                                <p className="text-gray-500 text-xs mt-1">
                                  👤 {commit.author} · {new Date(commit.date).toLocaleDateString('en-IN')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          Koi commits nahi mile
                        </div>
                      )
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Loader size={24} className="animate-spin" style={{ color: '#6C63FF' }} />
                      </div>
                    )}
                  </div>
                )}

                {/* TODOS TAB */}
                {activeTab === 'todos' && (
                  <div className="p-4 h-full overflow-auto">
                    {todos ? (
                      todos.length > 0 ? (
                        <div className="space-y-3">
                          <p className="text-gray-400 text-sm">{todos.length} items mile</p>
                          {todos.map((todo, i) => (
                            <div
                              key={i}
                              className="p-3 rounded-xl"
                              style={{
                                background: `${getTodoColor(todo.type)}11`,
                                border:     `1px solid ${getTodoColor(todo.type)}33`
                              }}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className="text-xs px-2 py-0.5 rounded font-bold"
                                  style={{
                                    background: `${getTodoColor(todo.type)}22`,
                                    color:      getTodoColor(todo.type)
                                  }}
                                >
                                  {todo.type}
                                </span>
                                <span className="text-gray-500 text-xs">
                                  Line {todo.lineNumber}
                                </span>
                              </div>
                              <p className="text-gray-300 text-sm">{todo.message}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-2">✅</div>
                          <p className="text-green-400">Koi TODO/FIXME nahi mila!</p>
                        </div>
                      )
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Loader size={24} className="animate-spin" style={{ color: '#6C63FF' }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}