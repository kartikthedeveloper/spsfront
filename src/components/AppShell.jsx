import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell({ title, children }) {
  return (
    <div className="flex min-h-screen bg-ink-50">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Topbar title={title} />
        <main className="p-6 max-w-[1400px] mx-auto">{children}</main>
      </div>
    </div>
  );
}
