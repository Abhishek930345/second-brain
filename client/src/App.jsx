// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import { AuthProvider, useAuth } from './context/AuthContext';
// import { Toaster } from 'react-hot-toast';

// import Login from './pages/Login';
// import Dashboard from './pages/Dashboard';
// import Chat from './pages/Chat';
// import Repos from './pages/Repos';

// const ProtectedRoute = ({ children }) => {
//   const { user, loading } = useAuth();

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-screen bg-primary">
//         <div className="text-accent text-xl animate-pulse">
//           Loading... 🧠
//         </div>
//       </div>
//     );
//   }

//   return user ? children : <Navigate to="/" />;
// };

// const AppRoutes = () => {
//   const { user, loading } = useAuth();

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-screen bg-primary">
//         <div className="text-accent text-xl animate-pulse">Loading... 🧠</div>
//       </div>
//     );
//   }

//   return (
//     <Routes>
//       <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login />} />
//       <Route path="/dashboard" element={
//         <ProtectedRoute><Dashboard /></ProtectedRoute>
//       } />
//       <Route path="/repos" element={
//         <ProtectedRoute><Repos /></ProtectedRoute>
//       } />
//       <Route path="/chat" element={
//         <ProtectedRoute><Chat /></ProtectedRoute>
//       } />
//     </Routes>
//   );
// };

// export default function App() {
//   return (
//     <BrowserRouter>
//       <AuthProvider>
//         <Toaster
//           position="top-right"
//           toastOptions={{
//             style: {
//               background: '#111118',
//               color: '#fff',
//               border: '1px solid #6C63FF'
//             }
//           }}
//         />
//         <AppRoutes />
//       </AuthProvider>
//     </BrowserRouter>
//   );
// }

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

import Login     from './pages/Login';
import Dashboard from './pages/Dashboard';
import Chat      from './pages/Chat';
import Repos     from './pages/Repos';
import Bugs      from './pages/Bugs';
import CodeSearch from './pages/CodeSearch';
import ApiDocs   from './pages/ApiDocs';
import RepoExplorer from './pages/RepoExplorer';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary">
        <div className="text-accent text-xl animate-pulse">Loading... 🧠</div>
      </div>
    );
  }
  return user ? children : <Navigate to="/" />;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary">
        <div className="text-accent text-xl animate-pulse">Loading... 🧠</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/repos"     element={<ProtectedRoute><Repos /></ProtectedRoute>} />
      <Route path="/chat"      element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/bugs"      element={<ProtectedRoute><Bugs /></ProtectedRoute>} />
      <Route path="/search"    element={<ProtectedRoute><CodeSearch /></ProtectedRoute>} />
      <Route path="/docs"      element={<ProtectedRoute><ApiDocs /></ProtectedRoute>} />
      <Route path="/explorer"  element={<ProtectedRoute><RepoExplorer /></ProtectedRoute>} />
      <Route path="/explorer/:repoName" element={
        <ProtectedRoute><RepoExplorer /></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#111118',
              color: '#fff',
              border: '1px solid #6C63FF'
            }
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}