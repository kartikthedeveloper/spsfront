import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Send, Megaphone, ExternalLink } from 'lucide-react';
import AppShell from '../components/AppShell';
import { PageHeader, EmptyState, Badge } from '../components/ui';
import api from '../api/axios';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState({ title: '', message: '', channel: 'email', audience: 'both' });
  const [sending, setSending] = useState(false);
  const [waLinks, setWaLinks] = useState([]);

  const load = () => api.get('/campaigns').then(({ data }) => setCampaigns(data.campaigns));

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    setWaLinks([]);
    try {
      const { data } = await api.post('/campaigns', form);
      toast.success(`Campaign sent to ${data.campaign.recipientCount} recipients`);
      if (data.whatsappLinks?.length) setWaLinks(data.whatsappLinks);
      setForm({ title: '', message: '', channel: 'email', audience: 'both' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send campaign');
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell title="Campaigns">
      <PageHeader
        title="Campaigns"
        description="Free outreach only: bulk email (SMTP) and WhatsApp click-to-chat links — no paid SMS/WhatsApp Business API."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-5 lg:col-span-1 h-fit">
          <p className="font-display font-semibold text-ink-950 mb-4 flex items-center gap-2">
            <Megaphone size={16} className="text-marigold-500" /> New Campaign
          </p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="label">Message</label>
              <textarea className="input" rows={4} required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Channel</label>
                <select className="input" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
                  <option value="email">Email</option>
                  <option value="whatsapp_manual">WhatsApp (click-to-chat)</option>
                </select>
              </div>
              <div>
                <label className="label">Audience</label>
                <select className="input" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                  <option value="both">Leads + Students</option>
                  <option value="leads">Leads only</option>
                  <option value="students">Students only</option>
                </select>
              </div>
            </div>
            <button disabled={sending} className="btn-accent w-full">
              <Send size={16} /> {sending ? 'Sending…' : 'Send Campaign'}
            </button>
          </form>

          {waLinks.length > 0 && (
            <div className="mt-5 pt-4 border-t border-ink-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-700 mb-2">
                Tap to open WhatsApp chat
              </p>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {waLinks.map((w, i) => (
                  <a
                    key={i}
                    href={w.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between text-sm rounded-lg px-3 py-2 bg-sage-100 text-sage-600 hover:bg-sage-100/70"
                  >
                    {w.name || w.phone}
                    <ExternalLink size={13} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {campaigns.length === 0 ? (
            <EmptyState title="No campaigns sent yet" />
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-ink-600 border-b border-ink-100">
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Channel</th>
                    <th className="px-4 py-3">Audience</th>
                    <th className="px-4 py-3">Recipients</th>
                    <th className="px-4 py-3">Sent By</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c._id} className="border-b border-ink-100 last:border-0">
                      <td className="px-4 py-3 font-medium text-ink-950">{c.title}</td>
                      <td className="px-4 py-3"><Badge tone={c.channel === 'email' ? 'ink' : 'sage'}>{c.channel.replace('_', ' ')}</Badge></td>
                      <td className="px-4 py-3 text-ink-700 capitalize">{c.audience}</td>
                      <td className="px-4 py-3 text-ink-700">{c.recipientCount}</td>
                      <td className="px-4 py-3 text-ink-700">{c.sentBy?.name}</td>
                      <td className="px-4 py-3 text-ink-700">{new Date(c.sentAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
