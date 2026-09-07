import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, FileDown, CheckCircle2 } from 'lucide-react';
import AppShell from '../components/AppShell';
import { PageHeader, EmptyState, Modal, Badge } from '../components/ui';
import api from '../api/axios';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Salary() {
  const [salaries, setSalaries] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    staff: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    baseSalary: '',
    kpiScore: 100,
    deductions: 0,
  });
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/salaries').then(({ data }) => setSalaries(data.salaries));

  useEffect(() => {
    load();
    api.get('/auth/users').then(({ data }) => setStaffList(data.users));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/salaries', {
        ...form,
        baseSalary: Number(form.baseSalary),
        kpiScore: Number(form.kpiScore),
        deductions: Number(form.deductions),
      });
      toast.success('Salary generated');
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not generate salary');
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (id) => {
    try {
      await api.patch(`/salaries/${id}/pay`);
      toast.success('Marked as paid');
      load();
    } catch (err) {
      toast.error('Could not update');
    }
  };

  return (
    <AppShell title="Salary">
      <PageHeader
        title="Salary Management"
        description="KPI-based auto-calculation: every point above/below a 100 score shifts pay by 0.5% of base salary."
        action={
          <button className="btn-accent" onClick={() => setOpen(true)}>
            <Plus size={16} /> Generate Salary
          </button>
        }
      />

      {salaries.length === 0 ? (
        <EmptyState title="No salary records yet" description="Generate a monthly salary slip for your staff." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-ink-600 border-b border-ink-100">
                <th className="px-4 py-3">Staff</th>
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3">Base</th>
                <th className="px-4 py-3">KPI</th>
                <th className="px-4 py-3">Net Salary</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {salaries.map((s) => (
                <tr key={s._id} className="border-b border-ink-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink-950">{s.staff?.name}</td>
                  <td className="px-4 py-3 text-ink-700">{monthNames[s.month - 1]} {s.year}</td>
                  <td className="px-4 py-3 text-ink-700">₹{s.baseSalary.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-ink-700">{s.kpiScore}%</td>
                  <td className="px-4 py-3 font-semibold text-ink-950">₹{s.netSalary.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <Badge tone={s.status === 'paid' ? 'sage' : 'marigold'}>{s.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a href={`${api.defaults.baseURL}/salaries/${s._id}/slip`} target="_blank" rel="noreferrer" className="btn-ghost !px-2 !py-1">
                        <FileDown size={14} />
                      </a>
                      {s.status !== 'paid' && (
                        <button onClick={() => markPaid(s._id)} className="btn-ghost !px-2 !py-1" title="Mark paid">
                          <CheckCircle2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Generate Salary">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Staff Member</label>
            <select className="input" required value={form.staff} onChange={(e) => setForm({ ...form, staff: e.target.value })}>
              <option value="">Select staff</option>
              {staffList.filter((u) => u.role !== 'student').map((u) => (
                <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Month</label>
              <select className="input" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })}>
                {monthNames.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Year</label>
              <input type="number" className="input" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Base Salary (₹)</label>
              <input type="number" min="0" className="input" required value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: e.target.value })} />
            </div>
            <div>
              <label className="label">KPI Score (%)</label>
              <input type="number" className="input" value={form.kpiScore} onChange={(e) => setForm({ ...form, kpiScore: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Deductions (₹)</label>
            <input type="number" min="0" className="input" value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} />
          </div>
          <button disabled={saving} className="btn-primary w-full">{saving ? 'Generating…' : 'Generate Salary'}</button>
        </form>
      </Modal>
    </AppShell>
  );
}
