import React from 'react';
import { FileSpreadsheet, Download } from 'lucide-react';
import AppShell from '../components/AppShell';
import { PageHeader } from '../components/ui';
import api from '../api/axios';

const reports = [
  { key: 'fees', label: 'Fee Collection Report', description: 'Every payment received, with receipt numbers and modes.' },
  { key: 'fee-defaulters', label: 'Fee Defaulters Report', description: 'Students with pending fee balances.' },
  { key: 'attendance', label: 'Attendance Report', description: 'Daily attendance records across batches.' },
  { key: 'leads', label: 'Lead Report', description: 'All leads with stage, source and ownership.' },
  { key: 'expenses', label: 'Expense Report', description: 'All recorded expenses by category.' },
];

export default function Reports() {
  const download = async (key, label) => {
    const res = await api.get(`/reports/${key}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${key}-report.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AppShell title="Reports">
      <PageHeader
        title="Reports"
        description="Export any report as a free Excel (.xlsx) file — no paid reporting service required."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reports.map((r) => (
          <div key={r.key} className="card p-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-sage-500 text-white flex items-center justify-center shrink-0">
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <p className="font-display font-semibold text-ink-950">{r.label}</p>
                <p className="text-xs text-ink-600 mt-1">{r.description}</p>
              </div>
            </div>
            <button className="btn-ghost !px-2.5 shrink-0" onClick={() => download(r.key, r.label)} title="Download">
              <Download size={16} />
            </button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
