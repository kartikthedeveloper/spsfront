import React from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ title }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-100 bg-ink-50/90 backdrop-blur px-6 py-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink-950">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 text-sm text-ink-700">
          <span className="badge bg-ink-100 text-ink-800 capitalize">{user?.role?.replace('_', ' ')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-ink-800 text-white flex items-center justify-center">
            <User size={15} />
          </div>
          <span className="text-sm font-medium hidden sm:block">{user?.name}</span>
        </div>
        <button onClick={logout} className="btn-ghost !px-2.5" title="Log out">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
