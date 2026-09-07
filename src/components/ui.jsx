import React from 'react';

export function StatCard({ label, value, sub, icon: Icon, tone = 'ink' }) {
  const tones = {
    ink: 'bg-ink-800 text-white',
    marigold: 'bg-marigold-500 text-white',
    sage: 'bg-sage-500 text-white',
    clay: 'bg-clay-500 text-white',
  };
  return (
    <div className="card p-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">{label}</p>
        <p className="mt-2 font-display text-2xl font-semibold text-ink-950">{value}</p>
        {sub && <p className="mt-1 text-xs text-ink-600">{sub}</p>}
      </div>
      {Icon && (
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${tones[tone]}`}>
          <Icon size={18} />
        </div>
      )}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/40 backdrop-blur-sm">
      <div className={`card w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-ink-950">{title}</h3>
          <button onClick={onClose} className="text-ink-600 hover:text-ink-950 text-xl leading-none">
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Badge({ children, tone = 'ink' }) {
  const tones = {
    ink: 'bg-ink-100 text-ink-800',
    marigold: 'bg-marigold-100 text-marigold-600',
    sage: 'bg-sage-100 text-sage-600',
    clay: 'bg-clay-100 text-clay-600',
  };
  return <span className={`badge ${tones[tone]}`}>{children}</span>;
}

export function EmptyState({ title, description }) {
  return (
    <div className="card p-10 text-center">
      <p className="font-display text-lg font-semibold text-ink-950">{title}</p>
      {description && <p className="mt-1 text-sm text-ink-600">{description}</p>}
    </div>
  );
}

export function PageHeader({ title, description, action }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink-950">{title}</h2>
        {description && <p className="text-sm text-ink-600 mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}
