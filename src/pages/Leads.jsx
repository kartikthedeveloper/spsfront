import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, MessageCircle, ArrowRight, UserCheck } from 'lucide-react';
import AppShell from '../components/AppShell';
import { PageHeader, Modal, Badge } from '../components/ui';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const stages = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'demo_scheduled', label: 'Demo Scheduled' },
  { key: 'follow_up', label: 'Follow-up' },
  { key: 'converted', label: 'Converted' },
  { key: 'lost', label: 'Lost' },
];

const priorityTone = { hot: 'clay', warm: 'marigold', cold: 'ink' };

export default function Leads() {
  const { user } = useAuth();
  const [board, setBoard] = useState({});
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [branches, setBranches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', source: 'website', priority: 'warm', branch: '', interestedCourse: '' });

  const load = () => api.get('/leads/pipeline').then(({ data }) => setBoard(data.board));
  useEffect(() => {
    load();
    api.get('/branches').then(({ data }) => setBranches(data.branches));
    api.get('/academics/courses').then(({ data }) => setCourses(data.courses));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (user.role !== 'admin') delete payload.branch;
      await api.post('/leads', payload);
      toast.success('Lead captured');
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create lead');
    }
  };

  const openDetail = async (id) => {
    const { data } = await api.get(`/leads/${id}`);
    setDetail(data);
  };

  const advanceStage = async (lead) => {
    const idx = stages.findIndex((s) => s.key === lead.stage);
    const next = stages[Math.min(idx + 1, stages.length - 3)]; // don't auto-advance into converted/lost
    try {
      await api.patch(`/leads/${lead._id}`, { stage: next.key });
      toast.success(`Moved to ${next.label}`);
      load();
      if (detail) openDetail(lead._id);
    } catch (err) {
      toast.error('Could not update stage');
    }
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    await api.post(`/leads/${detail.lead._id}/notes`, { text: noteText });
    setNoteText('');
    openDetail(detail.lead._id);
  };

  const convert = async () => {
    try {
      await api.post(`/leads/${detail.lead._id}/convert`, { course: detail.lead.interestedCourse?._id });
      toast.success('Lead converted to student');
      setDetail(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not convert lead');
    }
  };

  return (
    <AppShell title="Leads">
      <PageHeader
        title="Lead Pipeline"
        description="Track enquiries from first contact through admission."
        action={
          <button className="btn-accent" onClick={() => setOpen(true)}>
            <Plus size={16} /> New Lead
          </button>
        }
      />

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div key={stage.key} className="w-72 shrink-0">
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="font-semibold text-sm text-ink-950">{stage.label}</p>
              <span className="text-xs text-ink-600 bg-ink-100 rounded-full px-2 py-0.5">{board[stage.key]?.length || 0}</span>
            </div>
            <div className="space-y-2 min-h-[80px]">
              {(board[stage.key] || []).map((lead) => (
                <div key={lead._id} className="card p-3.5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => openDetail(lead._id)}>
                  <div className="flex items-start justify-between">
                    <p className="font-medium text-sm text-ink-950">{lead.fullName}</p>
                    <Badge tone={priorityTone[lead.priority]}>{lead.priority}</Badge>
                  </div>
                  <p className="text-xs text-ink-600 mt-1">{lead.phone}</p>
                  {lead.interestedCourse && <p className="text-xs text-ink-600 mt-0.5">{lead.interestedCourse.name}</p>}
                  {lead.assignedTo && <p className="text-xs text-ink-600/70 mt-1">Owner: {lead.assignedTo.name}</p>}
                  {stage.key !== 'converted' && stage.key !== 'lost' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        advanceStage(lead);
                      }}
                      className="mt-2 text-xs font-medium text-ink-800 hover:text-marigold-600 flex items-center gap-1"
                    >
                      Advance <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Capture New Lead">
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Full Name</label>
            <input className="input" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Source</label>
            <select className="input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="social_media">Social Media</option>
              <option value="walk_in">Walk-in</option>
              <option value="call">Call</option>
              <option value="ad_campaign">Ad Campaign</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
            </select>
          </div>
          {user.role === 'admin' && (
            <div>
              <label className="label">Branch</label>
              <select className="input" required value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
                <option value="">Select branch</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Interested Course</label>
            <select className="input" value={form.interestedCourse} onChange={(e) => setForm({ ...form, interestedCourse: e.target.value })}>
              <option value="">Not specified</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary w-full mt-2">Capture Lead</button>
        </form>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.lead?.fullName || ''} wide>
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <p><span className="text-ink-600">Phone:</span> {detail.lead.phone}</p>
              <p><span className="text-ink-600">Email:</span> {detail.lead.email || '-'}</p>
              <p><span className="text-ink-600">Source:</span> {detail.lead.source}</p>
              <p><span className="text-ink-600">Stage:</span> <Badge>{detail.lead.stage}</Badge></p>
              <p><span className="text-ink-600">Course:</span> {detail.lead.interestedCourse?.name || '-'}</p>
              <p><span className="text-ink-600">Owner:</span> {detail.lead.leadOwner?.name || '-'}</p>
            </div>

            <div className="flex gap-2">
              <a href={detail.whatsappLink} target="_blank" rel="noreferrer" className="btn bg-sage-500 text-white hover:bg-sage-600">
                <MessageCircle size={15} /> WhatsApp
              </a>
              {detail.lead.stage !== 'converted' && (
                <button onClick={convert} className="btn-accent">
                  <UserCheck size={15} /> Convert to Student
                </button>
              )}
            </div>

            <div>
              <p className="label mb-2">Notes & Activity</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {detail.lead.notes?.slice().reverse().map((n, i) => (
                  <div key={i} className="bg-ink-50 rounded-lg p-2.5 text-sm">
                    <p className="text-ink-950">{n.text}</p>
                    <p className="text-xs text-ink-600 mt-1">{n.addedBy?.name} · {new Date(n.addedAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <input className="input" placeholder="Add a note…" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
                <button className="btn-primary" onClick={addNote}>Add</button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
