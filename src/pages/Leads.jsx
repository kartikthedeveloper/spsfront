import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  MessageCircle,
  UserCheck,
  Search,
  Flame,
  Users,
  Phone,
  Mail,
  BookOpen,
  UserRound,
  CalendarDays,
  Clock3,
  StickyNote,
  X,
  ChevronRight,
  Target,
  TrendingUp,
  Filter,
  RefreshCw,
  CheckCircle2,
  CircleDot,
  Edit3,
  Trash2,
  Save,
  MessageSquare,
  CalendarClock,
} from 'lucide-react';

import AppShell from '../components/AppShell';
import { PageHeader, Modal, Badge } from '../components/ui';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

/* =========================================================
   STAGES
========================================================= */
const stages = [
  { key: 'new', label: 'New', subtitle: 'Fresh enquiries', icon: CircleDot },
  { key: 'contacted', label: 'Contacted', subtitle: 'Initial conversation', icon: Phone },
  { key: 'demo_scheduled', label: 'Demo Scheduled', subtitle: 'Demo / counselling', icon: CalendarDays },
  { key: 'follow_up', label: 'Follow-up', subtitle: 'Needs attention', icon: Clock3 },
  { key: 'converted', label: 'Converted', subtitle: 'Admissions', icon: CheckCircle2 },
  { key: 'lost', label: 'Lost', subtitle: 'Closed enquiries', icon: X },
];

const priorityTone = { hot: 'clay', warm: 'marigold', cold: 'ink' };

const priorityConfig = {
  hot: { label: 'Hot', icon: Flame, className: 'bg-clay-50 text-clay-700 border-clay-200' },
  warm: { label: 'Warm', icon: Target, className: 'bg-marigold-50 text-marigold-700 border-marigold-200' },
  cold: { label: 'Cold', icon: CircleDot, className: 'bg-ink-50 text-ink-600 border-ink-200' },
};

const sourceLabels = {
  website: 'Website',
  referral: 'Referral',
  social_media: 'Social Media',
  walk_in: 'Walk-in',
  call: 'Call',
  ad_campaign: 'Ad Campaign',
  other: 'Other',
};

const stageColors = {
  new: 'from-blue-500 to-indigo-500',
  contacted: 'from-violet-500 to-purple-500',
  demo_scheduled: 'from-amber-500 to-orange-500',
  follow_up: 'from-pink-500 to-rose-500',
  converted: 'from-emerald-500 to-green-500',
  lost: 'from-slate-500 to-gray-600',
};

const initialForm = {
  fullName: '',
  phone: '',
  altPhone: '',
  email: '',
  source: 'website',
  priority: 'warm',
  stage: 'new',
  branch: '',
  interestedCourse: '',
  budgetRange: '',
  followUpAt: '',
  comingDate: '',
  customMessage: '',
};

/* =========================================================
   HELPERS
========================================================= */
function getInitials(name = '') {
  return (
    name.split(' ').filter(Boolean).slice(0, 2)
      .map((p) => p[0]?.toUpperCase()).join('') || '?'
  );
}

function formatStage(stage) {
  return (
    stages.find((s) => s.key === stage)?.label ||
    String(stage || '').replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function formatDate(date) {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return '-'; }
}

function formatDateTime(date) {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return '-'; }
}

function toLocalInput(date) {
  if (!date) return '';
  try {
    const d = new Date(date);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ''; }
}

/* =========================================================
   STAT CARD
========================================================= */
function StatCard({ icon: Icon, label, value, description, iconClass = '', active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-2xl border p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
        active ? 'border-indigo-400 ring-2 ring-indigo-200 bg-indigo-50/40' : 'border-ink-100 bg-white'
      }`}
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-ink-50 opacity-70 transition-transform duration-500 group-hover:scale-150" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-ink-950">{value}</p>
          {description && <p className="mt-1 truncate text-xs text-ink-500">{description}</p>}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon size={19} />
        </div>
      </div>
    </button>
  );
}

/* =========================================================
   LEAD LIST ROW
========================================================= */
function LeadRow({ lead, stage, onOpen, onAdvance }) {
  const priority = priorityConfig[lead.priority] || priorityConfig.warm;
  const PriorityIcon = priority.icon;
  const isClosed = stage.key === 'converted' || stage.key === 'lost';
  const courseName = lead.interestedCourse?.name || 'Course not specified';

  return (
    <div
      onClick={() => onOpen(lead._id)}
      className="group relative cursor-pointer rounded-xl border border-ink-100 bg-white px-3 py-3 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:border-ink-200 hover:shadow-md sm:px-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-sm">
          {getInitials(lead.fullName)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold text-ink-950">
              {lead.fullName || 'Unnamed Lead'}
            </p>
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${priority.className}`}>
              <PriorityIcon size={9} />
              {priority.label}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-500">
            <span className="flex items-center gap-1">
              <Phone size={11} /> {lead.phone || '-'}
            </span>
            <span className="hidden items-center gap-1 sm:flex">
              <BookOpen size={11} />
              <span className="max-w-[160px] truncate">{courseName}</span>
            </span>

            {/* ✅ Coming Date chip */}
            {lead.comingDate && (
              <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">
                <CalendarClock size={11} />
                Coming: {formatDate(lead.comingDate)}
              </span>
            )}

            <span className="hidden items-center gap-1 md:flex">
              <span className="rounded-md bg-ink-100 px-1.5 py-0.5 font-medium">
                {sourceLabels[lead.source] || lead.source || 'Other'}
              </span>
            </span>
            {lead.assignedTo?.name && (
              <span className="hidden items-center gap-1 lg:flex">
                <UserRound size={11} /> {lead.assignedTo.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!isClosed && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAdvance(lead); }}
              className="hidden items-center gap-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-ink-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 sm:inline-flex"
              title="Move to next stage"
            >
              Next <ChevronRight size={12} />
            </button>
          )}
          <ChevronRight size={16} className="text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-ink-500" />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */
export default function Leads() {
  const { user } = useAuth();

  const [board, setBoard] = useState({});
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(initialForm);
  const [editSaving, setEditSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [remarkText, setRemarkText] = useState('');
  const [remarkComingDate, setRemarkComingDate] = useState('');
  const [branches, setBranches] = useState([]);
  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [remarkSaving, setRemarkSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  const [activeStage, setActiveStage] = useState('new');
  const [quickFilter, setQuickFilter] = useState(null);

  const [form, setForm] = useState(initialForm);

  /* ===================== LOAD ===================== */
  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/leads/pipeline');
      setBoard(data.board || {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    api.get('/branches').then(({ data }) => setBranches(data.branches || [])).catch(() => {});
    api.get('/academics/courses').then(({ data }) => setCourses(data.courses || [])).catch(() => {});
  }, []);

  /* ===================== DERIVED ===================== */
  const allLeads = useMemo(() => {
    return stages.flatMap((stage) =>
      (board[stage.key] || []).map((lead) => ({ ...lead, __stage: stage.key }))
    );
  }, [board]);

  const stats = useMemo(() => {
    const total = allLeads.length;
    const hot = allLeads.filter((l) => l.priority === 'hot').length;
    const followUps = (board.follow_up || []).length;
    const converted = (board.converted || []).length;
    const active = allLeads.filter((l) => l.__stage !== 'converted' && l.__stage !== 'lost').length;
    return { total, hot, followUps, converted, active };
  }, [allLeads, board]);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allLeads.filter((lead) => {
      const matchesSearch =
        !query ||
        lead.fullName?.toLowerCase().includes(query) ||
        lead.phone?.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.interestedCourse?.name?.toLowerCase().includes(query) ||
        lead.assignedTo?.name?.toLowerCase().includes(query) ||
        lead.leadOwner?.name?.toLowerCase().includes(query);
      const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter;
      const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
      return matchesSearch && matchesPriority && matchesSource;
    });
  }, [allLeads, search, priorityFilter, sourceFilter]);

  const visibleLeads = useMemo(() => {
    let list = filteredLeads;
    if (quickFilter === 'all') { /* all */ }
    else if (quickFilter === 'hot') list = list.filter((l) => l.priority === 'hot');
    else if (quickFilter === 'follow_up') list = list.filter((l) => l.__stage === 'follow_up');
    else if (quickFilter === 'active') list = list.filter((l) => l.__stage !== 'converted' && l.__stage !== 'lost');
    else if (quickFilter === 'converted') list = list.filter((l) => l.__stage === 'converted');
    else list = list.filter((l) => l.__stage === activeStage);

    /* ✅ Sort: comingDate pehle (soonest first), nulls last; then newest createdAt */
    return [...list].sort((a, b) => {
      const aDate = a.comingDate ? new Date(a.comingDate).getTime() : Infinity;
      const bDate = b.comingDate ? new Date(b.comingDate).getTime() : Infinity;
      if (aDate !== bDate) return aDate - bDate;
      const aCreated = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bCreated = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bCreated - aCreated;
    });
  }, [filteredLeads, activeStage, quickFilter]);

  const stageCounts = useMemo(() => {
    const counts = {};
    stages.forEach((stage) => {
      counts[stage.key] = filteredLeads.filter((l) => l.__stage === stage.key).length;
    });
    return counts;
  }, [filteredLeads]);

  /* ===================== CRUD ===================== */
  const updateEditField = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const openEdit = () => {
    if (!detail?.lead) return;
    const lead = detail.lead;
    setEditForm({
      fullName: lead.fullName || '',
      phone: lead.phone || '',
      altPhone: lead.altPhone || '',
      email: lead.email || '',
      source: lead.source || 'website',
      priority: lead.priority || 'warm',
      stage: lead.stage || 'new',
      branch: lead.branch?._id || lead.branch || '',
      interestedCourse: lead.interestedCourse?._id || lead.interestedCourse || '',
      budgetRange: lead.budgetRange || '',
      followUpAt: toLocalInput(lead.followUpAt),
      comingDate: toLocalInput(lead.comingDate),
      customMessage: lead.customMessage || '',
    });
    setEditOpen(true);
  };

  const updateLead = async (e) => {
    e.preventDefault();
    if (!detail?.lead?._id) return;
    try {
      setEditSaving(true);
      const payload = {
        fullName: editForm.fullName.trim(),
        phone: editForm.phone.trim(),
        altPhone: editForm.altPhone.trim(),
        email: editForm.email.trim(),
        source: editForm.source,
        priority: editForm.priority,
        stage: editForm.stage,
        interestedCourse: editForm.interestedCourse || null,
        budgetRange: editForm.budgetRange.trim(),
        followUpAt: editForm.followUpAt || null,
        comingDate: editForm.comingDate || null,
        customMessage: editForm.customMessage.trim(),
      };
      await api.patch(`/leads/${detail.lead._id}`, payload);
      toast.success('Lead updated successfully');
      setEditOpen(false);
      await load();
      await openDetail(detail.lead._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update lead');
    } finally {
      setEditSaving(false);
    }
  };

  const deleteLead = async () => {
    if (!detail?.lead?._id || deleting) return;
    const confirmed = window.confirm(
      `Delete lead "${detail.lead.fullName}"? This action cannot be undone.`
    );
    if (!confirmed) return;
    try {
      setDeleting(true);
      await api.delete(`/leads/${detail.lead._id}`);
      toast.success('Lead deleted successfully');
      setDetail(null);
      setEditOpen(false);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete lead');
    } finally {
      setDeleting(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = { ...form };
      if (user.role !== 'admin') delete payload.branch;
      await api.post('/leads', payload);
      toast.success('Lead captured successfully');
      setForm(initialForm);
      setOpen(false);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create lead');
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (id) => {
    try {
      setDetailLoading(true);
      const { data } = await api.get(`/leads/${id}`);
      setDetail(data);
      setRemarkComingDate(toLocalInput(data.lead?.comingDate));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load lead details');
    } finally {
      setDetailLoading(false);
    }
  };

  const advanceStage = async (lead) => {
    const idx = stages.findIndex((s) => s.key === lead.__stage || s.key === lead.stage);
    const nextIndex = Math.min(idx + 1, 3);
    if (idx < 0 || idx >= 3) return;
    const next = stages[nextIndex];
    try {
      await api.patch(`/leads/${lead._id}`, { stage: next.key });
      toast.success(`Moved to ${next.label}`);
      await load();
      if (detail?.lead?._id === lead._id) openDetail(lead._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update stage');
    }
  };

  const addNote = async () => {
    if (!noteText.trim() || !detail?.lead?._id) return;
    try {
      setNoteSaving(true);
      await api.post(`/leads/${detail.lead._id}/notes`, { text: noteText.trim() });
      toast.success('Note added');
      setNoteText('');
      await openDetail(detail.lead._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add note');
    } finally {
      setNoteSaving(false);
    }
  };

  /* ✅ NEW: Add Remark (with optional comingDate) */
  const addRemark = async () => {
    if (!remarkText.trim() || !detail?.lead?._id) return;
    try {
      setRemarkSaving(true);
      await api.post(`/leads/${detail.lead._id}/remarks`, {
        text: remarkText.trim(),
        comingDate: remarkComingDate || null,
      });
      toast.success('Remark added');
      setRemarkText('');
      await load();
      await openDetail(detail.lead._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add remark');
    } finally {
      setRemarkSaving(false);
    }
  };

  const convert = async () => {
    if (!detail?.lead?._id) return;
    try {
      await api.post(`/leads/${detail.lead._id}/convert`, {
        course: detail.lead.interestedCourse?._id,
      });
      toast.success('Lead converted to student');
      setDetail(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not convert lead');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setPriorityFilter('all');
    setSourceFilter('all');
  };

  const handleQuickFilter = (key) => {
    setQuickFilter(quickFilter === key ? null : key);
  };

  const handleStageTab = (key) => {
    setQuickFilter(null);
    setActiveStage(key);
  };

  const activeSectionLabel = quickFilter
    ? { all: 'All Leads', hot: 'Hot Leads', follow_up: 'Follow-ups', active: 'Active Leads', converted: 'Converted Leads' }[quickFilter]
    : stages.find((s) => s.key === activeStage)?.label || 'Leads';

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <AppShell title="Leads">
      {/* ✅ Global z-index / scroll fix */}
      <style>{`
        .modal-overlay-z { z-index: 9999 !important; }
        .modal-content-z { z-index: 10000 !important; }
      `}</style>

      <div className="space-y-6">
        {/* HEADER */}
        <PageHeader
          title="Lead Pipeline"
          description="Track enquiries from first contact through admission."
          action={
            <button
              type="button"
              className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold border border-violet-500/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_5px_0_#4338CA,0_10px_20px_rgba(79,70,229,0.18)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_6px_0_#4338CA,0_14px_25px_rgba(79,70,229,0.25)] active:translate-y-[2px] active:shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),0_2px_0_#4338CA,0_5px_10px_rgba(79,70,229,0.15)]"
              onClick={() => setOpen(true)}
            >
              <Plus size={16} /> New Lead
            </button>
          }
        />

        {/* STATS */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <StatCard icon={Users} label="Total Leads" value={stats.total} description="All enquiries" iconClass="bg-indigo-50 text-indigo-600" active={quickFilter === 'all'} onClick={() => handleQuickFilter('all')} />
          <StatCard icon={Flame} label="Hot Leads" value={stats.hot} description="High priority" iconClass="bg-clay-50 text-clay-600" active={quickFilter === 'hot'} onClick={() => handleQuickFilter('hot')} />
          <StatCard icon={Clock3} label="Follow-ups" value={stats.followUps} description="Need attention" iconClass="bg-marigold-50 text-marigold-600" active={quickFilter === 'follow_up'} onClick={() => handleQuickFilter('follow_up')} />
          <StatCard icon={TrendingUp} label="Active Leads" value={stats.active} description="Open pipeline" iconClass="bg-violet-50 text-violet-600" active={quickFilter === 'active'} onClick={() => handleQuickFilter('active')} />
          <StatCard icon={CheckCircle2} label="Converted" value={stats.converted} description="Admissions" iconClass="bg-sage-50 text-sage-600" active={quickFilter === 'converted'} onClick={() => handleQuickFilter('converted')} />
        </div>

        {/* FILTERS */}
        <div className="rounded-2xl border border-ink-100 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                className="input h-11 w-full pl-10"
                placeholder="Search by name, phone, email, course or owner..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-800">
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <select className="input h-11 min-w-[145px] pl-9" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                  <option value="all">All Priority</option>
                  <option value="hot">Hot</option>
                  <option value="warm">Warm</option>
                  <option value="cold">Cold</option>
                </select>
              </div>

              <select className="input h-11 min-w-[150px]" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
                <option value="all">All Sources</option>
                {Object.entries(sourceLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              {(search || priorityFilter !== 'all' || sourceFilter !== 'all') && (
                <button type="button" onClick={clearFilters} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-600 transition hover:bg-ink-50 hover:text-ink-950">
                  <X size={15} /> Clear
                </button>
              )}

              <button type="button" onClick={load} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-600 transition hover:bg-ink-50 hover:text-ink-950" title="Refresh">
                <RefreshCw size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* STAGE TABS */}
        {!quickFilter && (
          <div className="rounded-2xl border border-ink-100 bg-white p-2 shadow-sm">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {stages.map((stage) => {
                const StageIcon = stage.icon;
                const isActive = activeStage === stage.key;
                return (
                  <button
                    key={stage.key}
                    type="button"
                    onClick={() => handleStageTab(stage.key)}
                    className={`group flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all duration-200 ${
                      isActive ? 'border-indigo-300 bg-indigo-50 shadow-sm' : 'border-ink-100 bg-white hover:border-ink-200 hover:bg-ink-50'
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${stageColors[stage.key]} text-white shadow-sm`}>
                      <StageIcon size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`truncate text-xs font-bold ${isActive ? 'text-indigo-900' : 'text-ink-800'}`}>{stage.label}</p>
                        <span className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold ${isActive ? 'bg-indigo-200 text-indigo-800' : 'bg-ink-100 text-ink-600'}`}>
                          {stageCounts[stage.key] || 0}
                        </span>
                      </div>
                      <p className="truncate text-[9px] text-ink-400">{stage.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-indigo-600" />
            <h3 className="text-sm font-bold text-ink-950">{activeSectionLabel}</h3>
            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold text-ink-600">
              {visibleLeads.length}
            </span>
          </div>
          {quickFilter && (
            <button type="button" onClick={() => setQuickFilter(null)} className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-ink-600 transition hover:bg-ink-50 hover:text-ink-900">
              <X size={12} /> Clear filter
            </button>
          )}
        </div>

        {/* LIST */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (<div key={i} className="h-16 animate-pulse rounded-xl bg-ink-100" />))}
          </div>
        ) : visibleLeads.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-ink-100 text-ink-400">
              <Search size={20} />
            </div>
            <p className="text-sm font-bold text-ink-800">No leads found</p>
            <p className="mt-1 text-xs text-ink-500">
              {search || priorityFilter !== 'all' || sourceFilter !== 'all'
                ? 'Try adjusting your filters or search query.'
                : 'No leads in this section yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleLeads.map((lead) => (
              <LeadRow
                key={lead._id}
                lead={lead}
                stage={stages.find((s) => s.key === lead.__stage) || stages[0]}
                onOpen={openDetail}
                onAdvance={advanceStage}
              />
            ))}
          </div>
        )}

        {/* =========================================================
            NEW LEAD MODAL
        ========================================================== */}
        <Modal
          open={open}
          onClose={() => { if (!saving) { setOpen(false); setForm(initialForm); } }}
          title="Capture New Lead"
          wide
        >
          <form onSubmit={submit}>
            <div className="mb-5 rounded-2xl bg-gradient-to-r from-indigo-50 via-violet-50 to-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                  <Users size={19} />
                </div>
                <div>
                  <p className="font-bold text-ink-950">New Enquiry</p>
                  <p className="text-xs text-ink-500">Add prospect information to your sales pipeline.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Full Name <span className="text-red-500">*</span></label>
                <input className="input" placeholder="Enter student's full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div>
                <label className="label">Phone <span className="text-red-500">*</span></label>
                <input className="input" required type="tel" placeholder="Enter phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">Alternate Phone</label>
                <input className="input" type="tel" placeholder="Enter alternate phone number" value={form.altPhone} onChange={(e) => setForm({ ...form, altPhone: e.target.value })} />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" placeholder="student@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label">Lead Source</label>
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
                  <option value="hot">Hot — Immediate</option>
                  <option value="warm">Warm — Follow-up</option>
                  <option value="cold">Cold — Nurture</option>
                </select>
              </div>

              {user.role === 'admin' && (
                <div>
                  <label className="label">Branch <span className="text-red-500">*</span></label>
                  <select className="input" required value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
                    <option value="">Select branch</option>
                    {branches.map((branch) => (
                      <option key={branch._id} value={branch._id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="label">Interested Course</label>
                <select className="input" value={form.interestedCourse} onChange={(e) => setForm({ ...form, interestedCourse: e.target.value })}>
                  <option value="">Not specified</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>{course.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Budget Range</label>
                <input className="input" placeholder="e.g. ₹20,000 - ₹30,000" value={form.budgetRange} onChange={(e) => setForm({ ...form, budgetRange: e.target.value })} />
              </div>

              {/* ✅ NEW: Coming Date (create form me) */}
              <div>
                <label className="label flex items-center gap-1.5">
                  <CalendarClock size={13} /> Expected Coming Date
                </label>
                <input
                  className="input"
                  type="datetime-local"
                  value={form.comingDate}
                  onChange={(e) => setForm({ ...form, comingDate: e.target.value })}
                />
                <p className="mt-1 text-[11px] text-ink-400">Student kab aane wala hai (visit / demo / admission).</p>
              </div>

              <div>
                <label className="label">Follow-up Date & Time</label>
                <input className="input" type="datetime-local" value={form.followUpAt} onChange={(e) => setForm({ ...form, followUpAt: e.target.value })} />
              </div>

              <div className="mt-4 md:col-span-2">
                <label className="label flex items-center gap-2">
                  <MessageSquare size={14} /> Custom WhatsApp Message
                </label>
                <textarea
                  className="input min-h-[110px] resize-y"
                  placeholder="Write the message that should open when WhatsApp is clicked..."
                  value={form.customMessage}
                  onChange={(e) => setForm({ ...form, customMessage: e.target.value })}
                />
                <p className="mt-1.5 text-[11px] text-ink-400">Leave empty to use the default Success Point message.</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-ink-100 pt-4 sm:flex-row sm:justify-end">
              <button type="button" disabled={saving} onClick={() => { setOpen(false); setForm(initialForm); }} className="btn border border-ink-200 bg-white text-ink-700 hover:bg-ink-50">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary min-w-[150px]">
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Plus size={15} /> Capture Lead
                  </span>
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* =========================================================
            EDIT LEAD MODAL
        ========================================================== */}
        <Modal
          open={editOpen}
          onClose={() => { if (!editSaving) setEditOpen(false); }}
          title="Edit Lead"
          wide
        >
          <form onSubmit={updateLead}>
            <div className="mb-5 rounded-2xl bg-gradient-to-r from-indigo-50 via-violet-50 to-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                  <Edit3 size={19} />
                </div>
                <div>
                  <p className="font-bold text-ink-950">Update Lead</p>
                  <p className="text-xs text-ink-500">Update enquiry information, coming date and WhatsApp message.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Full Name <span className="text-red-500">*</span></label>
                <input className="input" required value={editForm.fullName} onChange={(e) => updateEditField('fullName', e.target.value)} />
              </div>
              <div>
                <label className="label">Phone <span className="text-red-500">*</span></label>
                <input className="input" required type="tel" value={editForm.phone} onChange={(e) => updateEditField('phone', e.target.value)} />
              </div>
              <div>
                <label className="label">Alternate Phone</label>
                <input className="input" type="tel" value={editForm.altPhone} onChange={(e) => updateEditField('altPhone', e.target.value)} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={editForm.email} onChange={(e) => updateEditField('email', e.target.value)} />
              </div>

              <div>
                <label className="label">Lead Source</label>
                <select className="input" value={editForm.source} onChange={(e) => updateEditField('source', e.target.value)}>
                  {Object.entries(sourceLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Priority</label>
                <select className="input" value={editForm.priority} onChange={(e) => updateEditField('priority', e.target.value)}>
                  <option value="hot">Hot — Immediate</option>
                  <option value="warm">Warm — Follow-up</option>
                  <option value="cold">Cold — Nurture</option>
                </select>
              </div>

              <div>
                <label className="label">Stage</label>
                <select className="input" value={editForm.stage} onChange={(e) => updateEditField('stage', e.target.value)}>
                  {stages.map((stage) => (
                    <option key={stage.key} value={stage.key}>{stage.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Interested Course</label>
                <select className="input" value={editForm.interestedCourse} onChange={(e) => updateEditField('interestedCourse', e.target.value)}>
                  <option value="">Not specified</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>{course.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Budget Range</label>
                <input className="input" placeholder="e.g. ₹20,000 - ₹30,000" value={editForm.budgetRange} onChange={(e) => updateEditField('budgetRange', e.target.value)} />
              </div>

              {/* ✅ Coming Date */}
              <div>
                <label className="label flex items-center gap-1.5">
                  <CalendarClock size={13} /> Expected Coming Date
                </label>
                <input
                  className="input"
                  type="datetime-local"
                  value={editForm.comingDate}
                  onChange={(e) => updateEditField('comingDate', e.target.value)}
                />
              </div>

              <div>
                <label className="label">Follow-up Date & Time</label>
                <input className="input" type="datetime-local" value={editForm.followUpAt} onChange={(e) => updateEditField('followUpAt', e.target.value)} />
              </div>

              {user.role === 'admin' && (
                <div>
                  <label className="label">Branch</label>
                  <select className="input" value={editForm.branch} onChange={(e) => updateEditField('branch', e.target.value)}>
                    <option value="">Current Branch</option>
                    {branches.map((branch) => (
                      <option key={branch._id} value={branch._id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="label flex items-center gap-2">
                  <MessageSquare size={14} /> Custom WhatsApp Message
                </label>
                <textarea
                  className="input min-h-[130px] resize-y"
                  placeholder="Write your custom WhatsApp message..."
                  value={editForm.customMessage}
                  onChange={(e) => updateEditField('customMessage', e.target.value)}
                />
                <p className="mt-1.5 text-[11px] text-ink-400">If empty, the default Success Point message will be used.</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-ink-100 pt-4 sm:flex-row sm:justify-end">
              <button type="button" disabled={editSaving} onClick={() => setEditOpen(false)} className="btn border border-ink-200 bg-white text-ink-700 hover:bg-ink-50">
                Cancel
              </button>
              <button type="submit" disabled={editSaving} className="btn-primary min-w-[150px]">
                {editSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Save size={15} /> Save Changes
                  </span>
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* =========================================================
            DETAIL MODAL (Z-INDEX FIX + REMARKS HISTORY)
        ========================================================== */}
        <Modal
          open={!!detail || detailLoading}
          onClose={() => { if (!detailLoading) { setDetail(null); setNoteText(''); setRemarkText(''); } }}
          title=""
          wide
        >
          {detailLoading ? (
            <div className="space-y-4 py-6">
              <div className="mx-auto h-14 w-14 animate-pulse rounded-2xl bg-ink-100" />
              <div className="mx-auto h-5 w-48 animate-pulse rounded bg-ink-100" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-16 animate-pulse rounded-xl bg-ink-50" />
                <div className="h-16 animate-pulse rounded-xl bg-ink-50" />
                <div className="h-16 animate-pulse rounded-xl bg-ink-50" />
                <div className="h-16 animate-pulse rounded-xl bg-ink-50" />
              </div>
            </div>
          ) : (
            detail && (
              /* ✅ Max height + internal scroll — kabhi content hide nahi hoga */
              <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
                {/* Profile Header */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink-950 via-ink-900 to-indigo-950 p-5 text-white">
                  <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-indigo-500/20 blur-2xl" />
                  <div className="absolute -bottom-16 left-20 h-32 w-32 rounded-full bg-violet-500/20 blur-2xl" />

                  <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold ring-1 ring-white/20 backdrop-blur">
                        {getInitials(detail.lead.fullName)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-bold">{detail.lead.fullName}</h2>
                          <Badge tone={priorityTone[detail.lead.priority]}>{detail.lead.priority}</Badge>
                        </div>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-white/70">
                          <Phone size={13} /> {detail.lead.phone}
                        </p>
                        {detail.lead.comingDate && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                            <CalendarClock size={12} /> Coming: {formatDateTime(detail.lead.comingDate)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur">
                      <p className="text-[10px] uppercase tracking-wider text-white/50">Current Stage</p>
                      <p className="mt-0.5 text-sm font-bold">{formatStage(detail.lead.stage)}</p>
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-5 w-1 rounded-full bg-indigo-600" />
                    <h3 className="text-sm font-bold text-ink-950">Lead Information</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl border border-ink-100 bg-white p-3">
                      <div className="flex items-center gap-2 text-ink-400">
                        <Phone size={14} />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Phone</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-ink-900">{detail.lead.phone || '-'}</p>
                    </div>
                    <div className="rounded-xl border border-ink-100 bg-white p-3">
                      <div className="flex items-center gap-2 text-ink-400">
                        <Mail size={14} />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Email</span>
                      </div>
                      <p className="mt-2 truncate text-sm font-semibold text-ink-900">{detail.lead.email || '-'}</p>
                    </div>
                    <div className="rounded-xl border border-ink-100 bg-white p-3">
                      <div className="flex items-center gap-2 text-ink-400">
                        <BookOpen size={14} />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Course</span>
                      </div>
                      <p className="mt-2 truncate text-sm font-semibold text-ink-900">{detail.lead.interestedCourse?.name || '-'}</p>
                    </div>
                    <div className="rounded-xl border border-ink-100 bg-white p-3">
                      <div className="flex items-center gap-2 text-ink-400">
                        <Target size={14} />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Source</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-ink-900">
                        {sourceLabels[detail.lead.source] || detail.lead.source || '-'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-ink-100 bg-white p-3">
                      <div className="flex items-center gap-2 text-ink-400">
                        <CalendarClock size={14} />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Coming Date</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-emerald-700">
                        {formatDateTime(detail.lead.comingDate)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-ink-100 bg-white p-3">
                      <div className="flex items-center gap-2 text-ink-400">
                        <UserRound size={14} />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Owner</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-ink-900">
                        {detail.lead.leadOwner?.name || detail.lead.assignedTo?.name || '-'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-ink-100 bg-white p-3">
                      <div className="flex items-center gap-2 text-ink-400">
                        <CalendarDays size={14} />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Created</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-ink-900">{formatDate(detail.lead.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Message */}
                <div className="rounded-2xl border border-ink-100 bg-gradient-to-br from-emerald-50/70 to-white p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <MessageSquare size={15} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-ink-950">WhatsApp Message</h3>
                      <p className="text-[10px] text-ink-400">Message used for the WhatsApp button</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-emerald-100 bg-white p-3">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                      {detail.lead.customMessage?.trim() || detail.whatsappMessage ||
                        `Hi ${detail.lead.fullName}, this is Success Point regarding your enquiry about ${
                          detail.lead.interestedCourse?.name || 'our courses'
                        }.`}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 border-y border-ink-100 py-4">
                  {detail.whatsappLink && (
                    <a href={detail.whatsappLink} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-sage-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sage-600 hover:shadow-md">
                      <MessageCircle size={16} /> WhatsApp
                    </a>
                  )}
                  <button type="button" onClick={openEdit}
                    className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100">
                    <Edit3 size={16} /> Edit Lead
                  </button>
                  {detail.lead.stage !== 'converted' && detail.lead.stage !== 'lost' && (
                    <button type="button" onClick={convert}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md">
                      <UserCheck size={16} /> Convert to Student
                    </button>
                  )}
                  <button type="button" onClick={deleteLead} disabled={deleting}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60">
                    <Trash2 size={16} /> {deleting ? 'Deleting...' : 'Delete Lead'}
                  </button>
                </div>

                {/* ✅ REMARKS — Date-wise history */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <MessageSquare size={15} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-ink-950">Remarks History</h3>
                        <p className="text-[10px] text-ink-400">All remarks recorded date-wise</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-ink-100 px-2 py-1 text-[10px] font-semibold text-ink-600">
                      {detail.lead.remarks?.length || 0} remarks
                    </span>
                  </div>

                  <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-ink-100 bg-indigo-50/30 p-3">
                    {detail.lead.remarks?.length ? (
                      [...detail.lead.remarks]
                        .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
                        .map((remark, index) => (
                          <div key={index} className="relative rounded-xl border border-indigo-100 bg-white p-3 shadow-sm">
                            <div className="flex gap-3">
                              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                                <MessageSquare size={13} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm leading-relaxed text-ink-800">{remark.text}</p>
                                <p className="mt-1.5 text-[10px] text-ink-400">
                                  {remark.addedBy?.name || 'User'} · {formatDateTime(remark.addedAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="flex min-h-[80px] items-center justify-center text-center">
                        <div>
                          <MessageSquare size={22} className="mx-auto text-ink-300" />
                          <p className="mt-2 text-xs text-ink-400">No remarks yet</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Add Remark */}
                  <div className="mt-3 space-y-2 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input
                        className="input flex-1"
                        placeholder="Write a new remark..."
                        value={remarkText}
                        onChange={(e) => setRemarkText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            addRemark();
                          }
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <CalendarClock size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                          <input
                            type="datetime-local"
                            className="input h-11 min-w-[210px] pl-9"
                            value={remarkComingDate}
                            onChange={(e) => setRemarkComingDate(e.target.value)}
                            title="Update expected coming date (optional)"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={remarkSaving || !remarkText.trim()}
                          onClick={addRemark}
                          className="btn-primary min-w-[110px]"
                        >
                          {remarkSaving ? 'Adding...' : 'Add Remark'}
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-ink-400">
                      Coming date optional hai — agar diya to lead ka expected coming date update ho jayega.
                    </p>
                  </div>
                </div>

                {/* Notes (existing activity) */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-marigold-50 text-marigold-600">
                        <StickyNote size={15} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-ink-950">Notes & Activity</h3>
                        <p className="text-[10px] text-ink-400">Keep track of conversations and follow-ups</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-ink-100 px-2 py-1 text-[10px] font-semibold text-ink-600">
                      {detail.lead.notes?.length || 0} notes
                    </span>
                  </div>

                  <div className="max-h-60 space-y-2 overflow-y-auto rounded-2xl border border-ink-100 bg-ink-50/50 p-3">
                    {detail.lead.notes?.length ? (
                      [...detail.lead.notes]
                        .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
                        .map((note, index) => (
                          <div key={index} className="relative rounded-xl border border-ink-100 bg-white p-3 shadow-sm">
                            <div className="flex gap-3">
                              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                <StickyNote size={13} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm leading-relaxed text-ink-800">{note.text}</p>
                                <p className="mt-1.5 text-[10px] text-ink-400">
                                  {note.addedBy?.name || 'User'} · {formatDateTime(note.addedAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="flex min-h-[100px] items-center justify-center text-center">
                        <div>
                          <StickyNote size={22} className="mx-auto text-ink-300" />
                          <p className="mt-2 text-xs text-ink-400">No activity notes yet</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      className="input flex-1"
                      placeholder="Add a note about this lead..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          addNote();
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={noteSaving || !noteText.trim()}
                      onClick={addNote}
                      className="btn-primary min-w-[100px]"
                    >
                      {noteSaving ? 'Adding...' : 'Add Note'}
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
