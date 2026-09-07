import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import AppShell from '../components/AppShell';
import { PageHeader, EmptyState, Badge } from '../components/ui';
import api from '../api/axios';

export default function Attendance() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [summary, setSummary] = useState([]);

  useEffect(() => {
    api.get('/academics/batches').then(({ data }) => setBatches(data.batches));
  }, []);

  useEffect(() => {
    if (!selectedBatch) return;
    api.get('/students', { params: { batch: selectedBatch, limit: 200 } }).then(({ data }) => {
      setStudents(data.students);
      const initial = {};
      data.students.forEach((s) => (initial[s._id] = 'present'));
      setStatusMap(initial);
    });
    api.get('/attendance/summary', { params: { batch: selectedBatch } }).then(({ data }) => setSummary(data.summary));
  }, [selectedBatch]);

  const submit = async () => {
    try {
      const records = Object.entries(statusMap).map(([student, status]) => ({ student, status }));
      await api.post('/attendance/mark', { batch: selectedBatch, date, records });
      toast.success('Attendance saved');
      api.get('/attendance/summary', { params: { batch: selectedBatch } }).then(({ data }) => setSummary(data.summary));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save attendance');
    }
  };

  const cycle = (id) => {
    const order = ['present', 'absent', 'leave'];
    setStatusMap((prev) => ({ ...prev, [id]: order[(order.indexOf(prev[id]) + 1) % order.length] }));
  };

  const statusStyle = {
    present: { icon: CheckCircle2, tone: 'text-sage-600', bg: 'bg-sage-100' },
    absent: { icon: XCircle, tone: 'text-clay-600', bg: 'bg-clay-100' },
    leave: { icon: Clock, tone: 'text-marigold-600', bg: 'bg-marigold-100' },
  };

  return (
    <AppShell title="Attendance">
      <PageHeader title="Mark Attendance" description="Select a batch and date, then tap a student to cycle their status." />

      <div className="card p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="label">Batch</label>
            <select className="input" value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
              <option value="">Select batch</option>
              {batches.map((b) => (
                <option key={b._id} value={b._id}>{b.name} — {b.course?.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        {selectedBatch && students.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              {students.map((s) => {
                const st = statusStyle[statusMap[s._id]];
                const Icon = st.icon;
                return (
                  <button
                    key={s._id}
                    onClick={() => cycle(s._id)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium border border-ink-100 ${st.bg}`}
                  >
                    <Icon size={15} className={st.tone} />
                    {s.name}
                  </button>
                );
              })}
            </div>
            <button className="btn-primary" onClick={submit}>Save Attendance</button>
          </>
        )}
        {selectedBatch && students.length === 0 && <EmptyState title="No students assigned to this batch yet" />}
      </div>

      {selectedBatch && summary.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-ink-600 border-b border-ink-100">
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Present</th>
                <th className="px-4 py-3">Total Days</th>
                <th className="px-4 py-3">Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((row) => (
                <tr key={row.student._id} className="border-b border-ink-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink-950">{row.student.name}</td>
                  <td className="px-4 py-3 text-ink-700">{row.present}</td>
                  <td className="px-4 py-3 text-ink-700">{row.total}</td>
                  <td className="px-4 py-3">
                    <Badge tone={row.percentage < 75 ? 'clay' : 'sage'}>{row.percentage}%</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
