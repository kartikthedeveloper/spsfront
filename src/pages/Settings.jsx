import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import AppShell from '../components/AppShell';
import { PageHeader } from '../components/ui';
import api from '../api/axios';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then(({ data }) => setSettings(data.settings));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch('/settings', settings);
      setSettings(data.settings);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return null;

  const field = (key, label, type = 'text') => (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        className="input"
        value={settings[key] ?? ''}
        onChange={(e) => setSettings({ ...settings, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
      />
    </div>
  );

  return (
    <AppShell title="Settings">
      <PageHeader title="Institute Settings" description="Branding and automation rules used across the CRM." />

      <form onSubmit={submit} className="space-y-6 max-w-2xl">
        <div className="card p-5 space-y-4">
          <p className="font-display font-semibold text-ink-950">Branding</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('instituteName', 'Institute Name')}
            {field('logoUrl', 'Logo URL')}
            <div>
              <label className="label">Primary Color</label>
              <input type="color" className="input h-10" value={settings.primaryColor} onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })} />
            </div>
            <div>
              <label className="label">Accent Color</label>
              <input type="color" className="input h-10" value={settings.accentColor} onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <p className="font-display font-semibold text-ink-950">Fee Reminders</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {field('feeReminderDaysBefore', 'Days Before Due', 'number')}
            {field('feeReminderDaysAfter', 'Days After Due', 'number')}
            {field('requireApprovalAboveDiscountPercent', 'Discount Approval Above (%)', 'number')}
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <p className="font-display font-semibold text-ink-950">Attendance & Approvals</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {field('attendanceAlertThreshold', 'Attendance Alert Below (%)', 'number')}
            {field('leadFollowUpFrequencyDays', 'Lead Follow-up Frequency (days)', 'number')}
            {field('requireApprovalAboveExpense', 'Expense Approval Above (₹)', 'number')}
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <p className="font-display font-semibold text-ink-950">ID Cards</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {field('idCardValidityMonths', 'ID Card Validity (months)', 'number')}
          </div>
        </div>

        <button disabled={saving} className="btn-primary">
          <Save size={16} /> {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>
    </AppShell>
  );
}
