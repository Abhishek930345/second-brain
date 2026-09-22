import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FolderGit2,
  MessageSquare,
  LogOut,
  Brain
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/repos',     icon: FolderGit2,      label: 'Repos'     },
  { path: '/chat',      icon: MessageSquare,   label: 'Chat'      },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <div className="h-screen w-64 flex flex-col fixed left-0 top-0"
      style={{ background: '#111118', borderRight: '1px solid rgba(255,255,255,0.08)' }}>

      {/* Logo */}
      <div className="p-6 flex items-center gap-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Brain size={28} style={{ color: '#6C63FF' }} />
        <span className="text-xl font-bold text-white">Second Brain</span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-white font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
            style={({ isActive }) =>
              isActive ? { background: 'rgba(108,99,255,0.15)', color: '#6C63FF' } : {}
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Info + Logout */}
      <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {/* User */}
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <img
            src={user?.avatar}
            alt={user?.username}
            className="w-8 h-8 rounded-full"
          />
          <div>
            <p className="text-white text-sm font-medium">{user?.username}</p>
            <p className="text-gray-500 text-xs">GitHub</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}