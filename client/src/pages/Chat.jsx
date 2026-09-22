// import { useState, useEffect, useRef } from 'react';
// import Layout from '../components/layout/Layout';
// import api from '../api/axios';
// import toast from 'react-hot-toast';
// import { useSearchParams } from 'react-router-dom';
// import { Send, Bot, User, FileCode } from 'lucide-react';

// export default function Chat() {
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [chatId, setChatId] = useState(null);
//   const [repos, setRepos] = useState([]);
//   const [selectedRepo, setSelectedRepo] = useState('');
//   const messagesEndRef = useRef(null);
//   const [searchParams] = useSearchParams();

//   useEffect(() => {
//     fetchIngestedRepos();
//     const repoFromUrl = searchParams.get('repo');
//     if (repoFromUrl) setSelectedRepo(repoFromUrl);
//   }, [searchParams]);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   const fetchIngestedRepos = async () => {
//     try {
//       const { data } = await api.get('/repos/ingested');
//       setRepos(data.filter(r => r.status === 'ready'));
//     } catch {
//       console.log('Repos fetch failed');
//     }
//   };

//   const sendMessage = async () => {
//     if (!input.trim() || loading) return;

//     const userMessage = { role: 'user', content: input };
//     setMessages(prev => [...prev, userMessage]);
//     setInput('');
//     setLoading(true);

//     try {
//       const { data } = await api.post('/query/ask', {
//         question: input,
//         repoName: selectedRepo || null,
//         chatId
//       });

//       const aiMessage = {
//         role: 'assistant',
//         content: data.answer,
//         sources: data.sources
//       };

//       setMessages(prev => [...prev, aiMessage]);
//       setChatId(data.chatId);

//     } catch {
//       toast.error('Jawab aane mein error aaya');
//       setMessages(prev => prev.slice(0, -1));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleKeyDown = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       sendMessage();
//     }
//   };

//   return (
//     <Layout>
//       <div className="flex flex-col h-[calc(100vh-64px)]">

//         {/* Header */}
//         <div className="flex items-center justify-between mb-4">
//           <div>
//             <h1 className="text-2xl font-bold text-white">Chat 💬</h1>
//             <p className="text-gray-400 text-sm">Apni codebase se poochho</p>
//           </div>

//           {/* Repo Filter */}
//           <select
//             value={selectedRepo}
//             onChange={(e) => setSelectedRepo(e.target.value)}
//             className="px-4 py-2 rounded-xl text-white text-sm outline-none"
//             style={{
//               background: '#111118',
//               border: '1px solid rgba(255,255,255,0.1)'
//             }}
//           >
//             <option value="">All Repos</option>
//             {repos.map(repo => (
//               <option key={repo._id} value={repo.repoName}>
//                 {repo.repoName}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* Messages Area */}
//         <div
//           className="flex-1 overflow-y-auto rounded-2xl p-4 space-y-4 mb-4"
//           style={{
//             background: '#111118',
//             border: '1px solid rgba(255,255,255,0.08)'
//           }}
//         >
//           {/* Welcome Message */}
//           {messages.length === 0 && (
//             <div className="flex flex-col items-center justify-center h-full text-center">
//               <div className="text-5xl mb-4">🧠</div>
//               <h2 className="text-xl font-bold text-white mb-2">
//                 Second Brain Ready Hai!
//               </h2>
//               <p className="text-gray-400 mb-6">
//                 Apni codebase ke baare mein kuch bhi poochho
//               </p>
//               <div className="grid grid-cols-1 gap-2 w-full max-w-md">
//                 {[
//                   'Mera auth system kaise kaam karta hai?',
//                   'Is project mein koi security issue hai?',
//                   'API routes kahan defined hain?',
//                   'Main function kahan hai?'
//                 ].map((suggestion, i) => (
//                   <button
//                     key={i}
//                     onClick={() => setInput(suggestion)}
//                     className="text-left px-4 py-2 rounded-xl text-sm text-gray-300 hover:text-white transition-all"
//                     style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)' }}
//                   >
//                     {suggestion}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Chat Messages */}
//           {messages.map((msg, i) => (
//             <div
//               key={i}
//               className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
//             >
//               {msg.role === 'assistant' && (
//                 <div
//                   className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
//                   style={{ background: 'rgba(108,99,255,0.2)' }}
//                 >
//                   <Bot size={16} style={{ color: '#6C63FF' }} />
//                 </div>
//               )}

//               <div className={`max-w-2xl ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
//                 <div
//                   className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
//                   style={{
//                     background: msg.role === 'user'
//                       ? 'linear-gradient(135deg, #6C63FF, #00D4FF)'
//                       : 'rgba(255,255,255,0.05)',
//                     color: 'white',
//                     whiteSpace: 'pre-wrap'
//                   }}
//                 >
//                   {msg.content}
//                 </div>

//                 {/* Sources */}
//                 {msg.sources?.length > 0 && (
//                   <div className="flex flex-wrap gap-2">
//                     {msg.sources.map((source, j) => (
//                       <span
//                         key={j}
//                         className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
//                         style={{
//                           background: 'rgba(0,212,255,0.1)',
//                           color: '#00D4FF',
//                           border: '1px solid rgba(0,212,255,0.2)'
//                         }}
//                       >
//                         <FileCode size={10} />
//                         {source.file}
//                       </span>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               {msg.role === 'user' && (
//                 <div
//                   className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
//                   style={{ background: 'rgba(0,212,255,0.2)' }}
//                 >
//                   <User size={16} style={{ color: '#00D4FF' }} />
//                 </div>
//               )}
//             </div>
//           ))}

//           {/* AI Typing Indicator */}
//           {loading && (
//             <div className="flex gap-3 justify-start">
//               <div
//                 className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
//                 style={{ background: 'rgba(108,99,255,0.2)' }}
//               >
//                 <Bot size={16} style={{ color: '#6C63FF' }} />
//               </div>
//               <div
//                 className="px-4 py-3 rounded-2xl"
//                 style={{ background: 'rgba(255,255,255,0.05)' }}
//               >
//                 <div className="flex gap-1">
//                   {[0, 1, 2].map(i => (
//                     <div
//                       key={i}
//                       className="w-2 h-2 rounded-full animate-bounce"
//                       style={{
//                         background: '#6C63FF',
//                         animationDelay: `${i * 0.15}s`
//                       }}
//                     />
//                   ))}
//                 </div>
//               </div>
//             </div>
//           )}

//           <div ref={messagesEndRef} />
//         </div>

//         {/* Input Area */}
//         <div
//           className="flex gap-3 p-3 rounded-2xl"
//           style={{
//             background: '#111118',
//             border: '1px solid rgba(255,255,255,0.08)'
//           }}
//         >
//           <textarea
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             onKeyDown={handleKeyDown}
//             placeholder="Apni codebase ke baare mein poochho... (Enter bhejo)"
//             rows={1}
//             className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none resize-none text-sm py-2"
//           />
//           <button
//             onClick={sendMessage}
//             disabled={!input.trim() || loading}
//             className="p-3 rounded-xl transition-all disabled:opacity-50"
//             style={{
//               background: input.trim()
//                 ? 'linear-gradient(135deg, #6C63FF, #00D4FF)'
//                 : 'rgba(255,255,255,0.05)'
//             }}
//           >
//             <Send size={18} className="text-white" />
//           </button>
//         </div>
//       </div>
//     </Layout>
//   );
// }

import { useState, useEffect, useRef } from 'react';
import Layout from '../components/layout/Layout';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { Send, Bot, User, FileCode } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function Chat() {
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [chatId, setChatId]         = useState(null);
  const [repos, setRepos]           = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const messagesEndRef              = useRef(null);
  const [searchParams]              = useSearchParams();

  useEffect(() => {
    fetchIngestedRepos();
    const repoFromUrl = searchParams.get('repo');
    if (repoFromUrl) setSelectedRepo(repoFromUrl);
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchIngestedRepos = async () => {
    try {
      const { data } = await api.get('/repos/ingested');
      setRepos(data.filter(r => r.status === 'ready'));
    } catch {
      console.log('Repos fetch failed');
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/query/ask', {
        question: input,
        repoName: selectedRepo || null,
        chatId
      });

      const aiMessage = {
        role:    'assistant',
        content: data.answer,
        sources: data.sources
      };

      setMessages(prev => [...prev, aiMessage]);
      setChatId(data.chatId);

    } catch {
      toast.error('Jawab aane mein error aaya');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Markdown components
  const markdownComponents = {
    h1: ({ children }) => (
      <h1 className="text-xl font-bold mb-3 text-white border-b pb-2"
        style={{ borderColor: 'rgba(108,99,255,0.3)' }}>
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-lg font-bold mb-2 mt-4"
        style={{ color: '#6C63FF' }}>
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-base font-semibold mb-2 mt-3"
        style={{ color: '#00D4FF' }}>
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="mb-3 text-gray-200 leading-relaxed">
        {children}
      </p>
    ),
    code: ({ inline, children }) =>
      inline ? (
        <code className="px-2 py-0.5 rounded text-xs font-mono"
          style={{ background: 'rgba(108,99,255,0.3)', color: '#00D4FF' }}>
          {children}
        </code>
      ) : (
        <pre className="p-4 rounded-xl my-3 overflow-x-auto text-xs font-mono"
          style={{ background: 'rgba(0,0,0,0.5)', color: '#00FF94', border: '1px solid rgba(255,255,255,0.1)' }}>
          <code>{children}</code>
        </pre>
      ),
    ul: ({ children }) => (
      <ul className="mb-3 space-y-1 pl-2">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-3 space-y-1 pl-4 list-decimal">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="text-gray-200 flex gap-2 items-start">
        <span style={{ color: '#6C63FF' }} className="mt-1 flex-shrink-0">▸</span>
        <span>{children}</span>
      </li>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-white">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic" style={{ color: '#00D4FF' }}>{children}</em>
    ),
    blockquote: ({ children }) => (
      <blockquote className="pl-4 py-1 my-3 text-gray-300 italic"
        style={{ borderLeft: '3px solid #6C63FF' }}>
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto my-3 rounded-xl"
        style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <table className="w-full text-xs border-collapse">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="px-3 py-2 text-left font-semibold text-white"
        style={{ background: 'rgba(108,99,255,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-3 py-2 text-gray-300"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        {children}
      </td>
    ),
    hr: () => (
      <hr className="my-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
    ),
  };
  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-64px)]">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Chat 💬</h1>
            <p className="text-gray-400 text-sm">Apni codebase se poochho</p>
          </div>

          {/* Repo Filter */}
          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="px-4 py-2 rounded-xl text-white text-sm outline-none cursor-pointer"
            style={{
              background: '#111118',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <option value="">All Repos</option>
            {repos.map(repo => (
              <option key={repo._id} value={repo.repoName}>
                {repo.repoName}
              </option>
            ))}
          </select>
        </div>

        {/* Messages Area */}
        <div
          className="flex-1 overflow-y-auto rounded-2xl p-4 space-y-4 mb-4"
          style={{
            background: '#111118',
            border: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          {/* Welcome Message */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-5xl mb-4">🧠</div>
              <h2 className="text-xl font-bold text-white mb-2">
                Second Brain Ready Hai!
              </h2>
              <p className="text-gray-400 mb-6">
                Apni codebase ke baare mein kuch bhi poochho
              </p>
              <div className="grid grid-cols-1 gap-2 w-full max-w-md">
                {[
                  'Mera auth system kaise kaam karta hai?',
                  'Is project mein koi security issue hai?',
                  'API routes kahan defined hain?',
                  'Main function kahan hai?'
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(suggestion)}
                    className="text-left px-4 py-2 rounded-xl text-sm text-gray-300 hover:text-white transition-all"
                    style={{
                      background: 'rgba(108,99,255,0.1)',
                      border: '1px solid rgba(108,99,255,0.2)'
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* AI Avatar */}
              {msg.role === 'assistant' && (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                  style={{ background: 'rgba(108,99,255,0.2)' }}
                >
                  <Bot size={16} style={{ color: '#6C63FF' }} />
                </div>
              )}

              <div className={`max-w-2xl ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>

                {/* Message Bubble */}
                <div
                  className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                  style={{
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #6C63FF, #00D4FF)'
                      : 'rgba(255,255,255,0.05)',
                    color: 'white',
                    maxWidth: '100%'
                  }}
                >
                  {msg.role === 'user' ? (
                    <p className="text-white">{msg.content}</p>
                  ) : (
                    <ReactMarkdown components={markdownComponents}>
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>

                {/* Sources */}
                {msg.sources?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((source, j) => (
                      <span
                        key={j}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                        style={{
                          background: 'rgba(0,212,255,0.1)',
                          color: '#00D4FF',
                          border: '1px solid rgba(0,212,255,0.2)'
                        }}
                      >
                        <FileCode size={10} />
                        {source.file}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* User Avatar */}
              {msg.role === 'user' && (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                  style={{ background: 'rgba(0,212,255,0.2)' }}
                >
                  <User size={16} style={{ color: '#00D4FF' }} />
                </div>
              )}
            </div>
          ))}

          {/* AI Typing Indicator */}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(108,99,255,0.2)' }}
              >
                <Bot size={16} style={{ color: '#6C63FF' }} />
              </div>
              <div
                className="px-4 py-3 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <div className="flex gap-1 items-center">
                  <span className="text-gray-400 text-xs mr-2">Soch raha hai</span>
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{
                        background: '#6C63FF',
                        animationDelay: `${i * 0.15}s`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div
          className="flex gap-3 p-3 rounded-2xl"
          style={{
            background: '#111118',
            border: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Apni codebase ke baare mein poochho... (Enter se bhejo)"
            rows={1}
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none resize-none text-sm py-2"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="p-3 rounded-xl transition-all disabled:opacity-50"
            style={{
              background: input.trim()
                ? 'linear-gradient(135deg, #6C63FF, #00D4FF)'
                : 'rgba(255,255,255,0.05)'
            }}
          >
            <Send size={18} className="text-white" />
          </button>
        </div>
      </div>
    </Layout>
  );
}