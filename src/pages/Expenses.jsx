import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Receipt } from 'lucide-react';
import AppShell from '../components/AppShell';
import { PageHeader, EmptyState, Modal, Badge } from '../components/ui';
import api from '../api/axios';

const categories = ['rent', 'utilities', 'salary', 'marketing', 'maintenance', 'supplies', 'other'];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'other', amount: '', date: new Date().toISOString().slice(0, 10), notes: '' });
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/expenses').then(({ data }) => setExpenses(data.expenses));

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/expenses', { ...form, amount: Number(form.amount) });
      toast.success('Expense recorded');
      if (data.budgetWarning) toast(data.budgetWarning, { icon: '⚠️', duration: 6000 });
      setOpen(false);
      setForm({ title: '', category: 'other', amount: '', date: new Date().toISOString().slice(0, 10), notes: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not record expense');
    } finally {
      setSaving(false);
    }
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <AppShell title="Expenses">
      <PageHeader
        title="Expense Management"
        description={`Total recorded: ₹${total.toLocaleString('en-IN')}`}
        action={
          <button className="btn-accent" onClick={() => setOpen(true)}>
            <Plus size={16} /> Add Expense
          </button>
        }
      />

      {expenses.length === 0 ? (
        <EmptyState title="No expenses recorded yet" description="Track rent, marketing, salaries and more here." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-ink-600 border-b border-ink-100">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e._id} className="border-b border-ink-100 last:border-0">
                  <td className="px-4 py-3 text-ink-700">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-medium text-ink-950">{e.title}</td>
                  <td className="px-4 py-3"><Badge tone="ink">{e.category}</Badge></td>
                  <td className="px-4 py-3 font-semibold text-clay-600">₹{e.amount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-ink-700">{e.recordedBy?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Record Expense">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Amount (₹)</label>
              <input type="number" min="0" className="input" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button disabled={saving} className="btn-primary w-full">
            <Receipt size={16} /> {saving ? 'Saving…' : 'Save Expense'}
          </button>
        </form>
      </Modal>
    </AppShell>
  );
}
