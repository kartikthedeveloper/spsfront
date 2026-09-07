import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  MessageCircle,
  ArrowRight,
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
  MoreHorizontal,
} from 'lucide-react';

import AppShell from '../components/AppShell';
import { PageHeader, Modal, Badge, EmptyState } from '../components/ui';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const stages = [
  {
    key: 'new',
    label: 'New',
    subtitle: 'Fresh enquiries',
    icon: CircleDot,
  },
  {
    key: 'contacted',
    label: 'Contacted',
    subtitle: 'Initial conversation',
    icon: Phone,
  },
  {
    key: 'demo_scheduled',
    label: 'Demo Scheduled',
    subtitle: 'Demo / counselling',
    icon: CalendarDays,
  },
  {
    key: 'follow_up',
    label: 'Follow-up',
    subtitle: 'Needs attention',
    icon: Clock3,
  },
  {
    key: 'converted',
    label: 'Converted',
    subtitle: 'Admissions',
    icon: CheckCircle2,
  },
  {
    key: 'lost',
    label: 'Lost',
    subtitle: 'Closed enquiries',
    icon: X,
  },
];

const priorityTone = {
  hot: 'clay',
  warm: 'marigold',
  cold: 'ink',
};

const priorityConfig = {
  hot: {
    label: 'Hot',
    icon: Flame,
    className: 'bg-clay-50 text-clay-700 border-clay-200',
  },
  warm: {
    label: 'Warm',
    icon: Target,
    className: 'bg-marigold-50 text-marigold-700 border-marigold-200',
  },
  cold: {
    label: 'Cold',
    icon: CircleDot,
    className: 'bg-ink-50 text-ink-600 border-ink-200',
  },
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
  email: '',
  source: 'website',
  priority: 'warm',
  branch: '',
  interestedCourse: '',
};

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';
}

function formatStage(stage) {
  return (
    stages.find((item) => item.key === stage)?.label ||
    String(stage || '')
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function formatDate(date) {
  if (!date) return '-';

  try {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

function formatDateTime(date) {
  if (!date) return '-';

  try {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

function StatCard({ icon: Icon, label, value, description, iconClass = '' }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-ink-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-ink-50 opacity-70 transition-transform duration-500 group-hover:scale-150" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            {label}
          </p>

          <p className="mt-1 text-2xl font-bold tracking-tight text-ink-950">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs text-ink-500">{description}</p>
          )}
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

function LeadCard({ lead, stage, onOpen, onAdvance }) {
  const priority = priorityConfig[lead.priority] || priorityConfig.warm;
  const PriorityIcon = priority.icon;

  const isClosed =
    stage.key === 'converted' || stage.key === 'lost';

  return (
    <div
      onClick={() => onOpen(lead._id)}
      className="group cursor-pointer rounded-2xl border border-ink-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-ink-200 hover:shadow-xl"
    >
      {/* Top */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-sm">
            {getInitials(lead.fullName)}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink-950">
              {lead.fullName}
            </p>

            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-500">
              <Phone size={11} />
              <span className="truncate">{lead.phone || '-'}</span>
            </div>
          </div>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${priority.className}`}
        >
          <PriorityIcon size={10} />
          {priority.label}
        </span>
      </div>

      {/* Course */}
      <div className="mt-4 rounded-xl bg-ink-50/80 p-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
            <BookOpen size={13} />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wide text-ink-400">
              Interested Course
            </p>
            <p className="truncate text-xs font-semibold text-ink-800">
              {lead.interestedCourse?.name || 'Course not specified'}
            </p>
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-ink-500">
          <span className="shrink-0 rounded-md bg-ink-100 px-1.5 py-1 font-medium">
            {sourceLabels[lead.source] || lead.source || 'Other'}
          </span>

          {lead.assignedTo && (
            <span className="flex min-w-0 items-center gap-1 truncate">
              <UserRound size={11} />
              <span className="truncate">{lead.assignedTo.name}</span>
            </span>
          )}
        </div>

        {!isClosed && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdvance(lead);
            }}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-ink-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          >
            Next
            <ChevronRight size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function Leads() {
  const { user } = useAuth();

  const [board, setBoard] = useState({});
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [branches, setBranches] = useState([]);
  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  const [form, setForm] = useState(initialForm);

  const load = async () => {
    try {
      setLoading(true);

      const { data } = await api.get('/leads/pipeline');
      setBoard(data.board || {});
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Could not load leads'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    api
      .get('/branches')
      .then(({ data }) => setBranches(data.branches || []))
      .catch(() => {});

    api
      .get('/academics/courses')
      .then(({ data }) => setCourses(data.courses || []))
      .catch(() => {});
  }, []);

  const allLeads = useMemo(() => {
    return stages.flatMap((stage) =>
      (board[stage.key] || []).map((lead) => ({
        ...lead,
        __stage: stage.key,
      }))
    );
  }, [board]);

  const stats = useMemo(() => {
    const total = allLeads.length;

    const hot = allLeads.filter(
      (lead) => lead.priority === 'hot'
    ).length;

    const followUps = (board.follow_up || []).length;

    const converted = (board.converted || []).length;

    const active = allLeads.filter(
      (lead) =>
        lead.__stage !== 'converted' &&
        lead.__stage !== 'lost'
    ).length;

    return {
      total,
      hot,
      followUps,
      converted,
      active,
    };
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
        lead.assignedTo?.name?.toLowerCase().includes(query);

      const matchesPriority =
        priorityFilter === 'all' ||
        lead.priority === priorityFilter;

      const matchesSource =
        sourceFilter === 'all' ||
        lead.source === sourceFilter;

      return (
        matchesSearch &&
        matchesPriority &&
        matchesSource
      );
    });
  }, [allLeads, search, priorityFilter, sourceFilter]);

  const leadsByStage = useMemo(() => {
    const grouped = {};

    stages.forEach((stage) => {
      grouped[stage.key] = filteredLeads.filter(
        (lead) => lead.__stage === stage.key
      );
    });

    return grouped;
  }, [filteredLeads]);

  const submit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const payload = { ...form };

      if (user.role !== 'admin') {
        delete payload.branch;
      }

      await api.post('/leads', payload);

      toast.success('Lead captured successfully');

      setForm(initialForm);
      setOpen(false);

      await load();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Could not create lead'
      );
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (id) => {
    try {
      setDetailLoading(true);

      const { data } = await api.get(`/leads/${id}`);

      setDetail(data);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Could not load lead details'
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const advanceStage = async (lead) => {
    const idx = stages.findIndex(
      (stage) => stage.key === lead.__stage || stage.key === lead.stage
    );

    // Never automatically move into converted/lost.
    const nextIndex = Math.min(idx + 1, 3);

    if (idx < 0 || idx >= 3) return;

    const next = stages[nextIndex];

    try {
      await api.patch(`/leads/${lead._id}`, {
        stage: next.key,
      });

      toast.success(`Moved to ${next.label}`);

      await load();

      if (detail?.lead?._id === lead._id) {
        openDetail(lead._id);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Could not update stage'
      );
    }
  };

  const addNote = async () => {
    if (!noteText.trim() || !detail?.lead?._id) return;

    try {
      setNoteSaving(true);

      await api.post(
        `/leads/${detail.lead._id}/notes`,
        {
          text: noteText.trim(),
        }
      );

      toast.success('Note added');

      setNoteText('');

      await openDetail(detail.lead._id);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Could not add note'
      );
    } finally {
      setNoteSaving(false);
    }
  };

  const convert = async () => {
    if (!detail?.lead?._id) return;

    try {
      await api.post(
        `/leads/${detail.lead._id}/convert`,
        {
          course:
            detail.lead.interestedCourse?._id,
        }
      );

      toast.success('Lead converted to student');

      setDetail(null);

      await load();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Could not convert lead'
      );
    }
  };

  const clearFilters = () => {
    setSearch('');
    setPriorityFilter('all');
    setSourceFilter('all');
  };

  return (
    <AppShell title="Leads">
      <div className="space-y-6">
        {/* =========================================================
            HEADER
        ========================================================== */}
        <PageHeader
          title="Lead Pipeline"
          description="Track enquiries from first contact through admission."
          action={
            <button
              type="button"
              className="group
              inline-flex items-center gap-2

              px-4 py-2.5
              rounded-xl

              bg-gradient-to-r
              from-violet-600
              to-indigo-600

              text-white
              text-xs
              font-bold

              border border-violet-500/20

              shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_5px_0_#4338CA,0_10px_20px_rgba(79,70,229,0.18)]

              transition-all duration-300

              hover:-translate-y-1
              hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_6px_0_#4338CA,0_14px_25px_rgba(79,70,229,0.25)]

              active:translate-y-[2px]
              active:shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),0_2px_0_#4338CA,0_5px_10px_rgba(79,70,229,0.15)]
            "
              onClick={() => setOpen(true)}
            >
              <Plus size={16} />
              New Lead
            </button>
          }
        />

        {/* =========================================================
            SUMMARY
        ========================================================== */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <StatCard
            icon={Users}
            label="Total Leads"
            value={stats.total}
            description="All enquiries"
            iconClass="bg-indigo-50 text-indigo-600"
          />

          <StatCard
            icon={Flame}
            label="Hot Leads"
            value={stats.hot}
            description="High priority"
            iconClass="bg-clay-50 text-clay-600"
          />

          <StatCard
            icon={Clock3}
            label="Follow-ups"
            value={stats.followUps}
            description="Need attention"
            iconClass="bg-marigold-50 text-marigold-600"
          />

          <StatCard
            icon={TrendingUp}
            label="Active Leads"
            value={stats.active}
            description="Open pipeline"
            iconClass="bg-violet-50 text-violet-600"
          />

          <StatCard
            icon={CheckCircle2}
            label="Converted"
            value={stats.converted}
            description="Admissions"
            iconClass="bg-sage-50 text-sage-600"
          />
        </div>

        {/* =========================================================
            FILTER BAR
        ========================================================== */}
        <div className="rounded-2xl border border-ink-100 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Search */}
            <div className="relative min-w-0 flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
              />

              <input
                className="input h-11 w-full pl-10"
                placeholder="Search by name, phone, email, course or owner..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-800"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Filter
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                />

                <select
                  className="input h-11 min-w-[145px] pl-9"
                  value={priorityFilter}
                  onChange={(e) =>
                    setPriorityFilter(e.target.value)
                  }
                >
                  <option value="all">All Priority</option>
                  <option value="hot">Hot</option>
                  <option value="warm">Warm</option>
                  <option value="cold">Cold</option>
                </select>
              </div>

              <select
                className="input h-11 min-w-[150px]"
                value={sourceFilter}
                onChange={(e) =>
                  setSourceFilter(e.target.value)
                }
              >
                <option value="all">All Sources</option>

                {Object.entries(sourceLabels).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                )}
              </select>

              {(search ||
                priorityFilter !== 'all' ||
                sourceFilter !== 'all') && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-600 transition hover:bg-ink-50 hover:text-ink-950"
                >
                  <X size={15} />
                  Clear
                </button>
              )}

              <button
                type="button"
                onClick={load}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-600 transition hover:bg-ink-50 hover:text-ink-950"
                title="Refresh"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3">
            <p className="text-xs text-ink-500">
              Showing{' '}
              <span className="font-bold text-ink-800">
                {filteredLeads.length}
              </span>{' '}
              of{' '}
              <span className="font-bold text-ink-800">
                {allLeads.length}
              </span>{' '}
              leads
            </p>

            <div className="hidden items-center gap-1.5 text-xs text-ink-400 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live pipeline
            </div>
          </div>
        </div>

        {/* =========================================================
            PIPELINE
        ========================================================== */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {stages.map((stage) => (
              <div
                key={stage.key}
                className="min-h-[300px] animate-pulse rounded-2xl border border-ink-100 bg-ink-50 p-3"
              >
                <div className="mb-4 h-10 rounded-xl bg-ink-200" />

                <div className="space-y-3">
                  <div className="h-36 rounded-2xl bg-ink-200" />
                  <div className="h-36 rounded-2xl bg-ink-200" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-5">
            {stages.map((stage) => {
              const StageIcon = stage.icon;
              const leads = leadsByStage[stage.key] || [];

              return (
                <div
                  key={stage.key}
                  className="w-[300px] shrink-0"
                >
                  {/* Column Header */}
                  <div className="mb-3 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
                    <div
                      className={`h-1.5 bg-gradient-to-r ${
                        stageColors[stage.key]
                      }`}
                    />

                    <div className="p-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-50 text-ink-700">
                            <StageIcon size={16} />
                          </div>

                          <div>
                            <p className="text-sm font-bold text-ink-950">
                              {stage.label}
                            </p>

                            <p className="text-[10px] text-ink-400">
                              {stage.subtitle}
                            </p>
                          </div>
                        </div>

                        <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-ink-100 px-2 text-xs font-bold text-ink-700">
                          {leads.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="min-h-[100px] space-y-3 rounded-2xl bg-ink-50/60 p-2">
                    {leads.length === 0 ? (
                      <div className="flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-ink-200 bg-white/70 px-4 text-center">
                        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-ink-100 text-ink-400">
                          <StageIcon size={16} />
                        </div>

                        <p className="text-xs font-medium text-ink-500">
                          No leads here
                        </p>
                      </div>
                    ) : (
                      leads.map((lead) => (
                        <LeadCard
                          key={lead._id}
                          lead={lead}
                          stage={stage}
                          onOpen={openDetail}
                          onAdvance={advanceStage}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* =========================================================
            NEW LEAD MODAL
        ========================================================== */}
        <Modal
          open={open}
          onClose={() => {
            if (!saving) {
              setOpen(false);
              setForm(initialForm);
            }
          }}
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
                  <p className="font-bold text-ink-950">
                    New Enquiry
                  </p>

                  <p className="text-xs text-ink-500">
                    Add prospect information to your sales pipeline.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Full Name */}
              <div>
                <label className="label">
                  Full Name <span className="text-red-500">*</span>
                </label>

                <input
                  className="input"
                  required
                  placeholder="Enter student's full name"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      fullName: e.target.value,
                    })
                  }
                />
              </div>

              {/* Phone */}
              <div>
                <label className="label">
                  Phone <span className="text-red-500">*</span>
                </label>

                <input
                  className="input"
                  required
                  type="tel"
                  placeholder="Enter phone number"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone: e.target.value,
                    })
                  }
                />
              </div>

              {/* Email */}
              <div>
                <label className="label">Email</label>

                <input
                  type="email"
                  className="input"
                  placeholder="student@example.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                />
              </div>

              {/* Source */}
              <div>
                <label className="label">Lead Source</label>

                <select
                  className="input"
                  value={form.source}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      source: e.target.value,
                    })
                  }
                >
                  <option value="website">Website</option>
                  <option value="referral">Referral</option>
                  <option value="social_media">
                    Social Media
                  </option>
                  <option value="walk_in">Walk-in</option>
                  <option value="call">Call</option>
                  <option value="ad_campaign">
                    Ad Campaign
                  </option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="label">Priority</label>

                <select
                  className="input"
                  value={form.priority}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      priority: e.target.value,
                    })
                  }
                >
                  <option value="hot">Hot — Immediate</option>
                  <option value="warm">Warm — Follow-up</option>
                  <option value="cold">Cold — Nurture</option>
                </select>
              </div>

              {/* Branch */}
              {user.role === 'admin' && (
                <div>
                  <label className="label">
                    Branch <span className="text-red-500">*</span>
                  </label>

                  <select
                    className="input"
                    required
                    value={form.branch}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        branch: e.target.value,
                      })
                    }
                  >
                    <option value="">
                      Select branch
                    </option>

                    {branches.map((branch) => (
                      <option
                        key={branch._id}
                        value={branch._id}
                      >
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Course */}
              <div className="md:col-span-2">
                <label className="label">
                  Interested Course
                </label>

                <select
                  className="input"
                  value={form.interestedCourse}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      interestedCourse: e.target.value,
                    })
                  }
                >
                  <option value="">
                    Not specified
                  </option>

                  {courses.map((course) => (
                    <option
                      key={course._id}
                      value={course._id}
                    >
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-ink-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setOpen(false);
                  setForm(initialForm);
                }}
                className="btn border border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary min-w-[150px]"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Plus size={15} />
                    Capture Lead
                  </span>
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* =========================================================
            LEAD DETAIL MODAL
        ========================================================== */}
        <Modal
          open={!!detail || detailLoading}
          onClose={() => {
            if (!detailLoading) {
              setDetail(null);
              setNoteText('');
            }
          }}
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
              <div className="space-y-5">
                {/* Profile Header */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink-950 via-ink-900 to-indigo-950 p-5 text-white">
                  <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-indigo-500/20 blur-2xl" />
                  <div className="absolute -bottom-16 left-20 h-32 w-32 rounded-full bg-violet-500/20 blur-2xl" />

                  <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold ring-1 ring-white/20 backdrop-blur">
                        {getInitials(
                          detail.lead.fullName
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-bold">
                            {detail.lead.fullName}
                          </h2>

                          <Badge
                            tone={
                              priorityTone[
                                detail.lead.priority
                              ]
                            }
                          >
                            {detail.lead.priority}
                          </Badge>
                        </div>

                        <p className="mt-1 flex items-center gap-1.5 text-sm text-white/70">
                          <Phone size={13} />
                          {detail.lead.phone}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur">
                      <p className="text-[10px] uppercase tracking-wider text-white/50">
                        Current Stage
                      </p>

                      <p className="mt-0.5 text-sm font-bold">
                        {formatStage(detail.lead.stage)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Information Grid */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-5 w-1 rounded-full bg-indigo-600" />
                    <h3 className="text-sm font-bold text-ink-950">
                      Lead Information
                    </h3>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl border border-ink-100 bg-white p-3">
                      <div className="flex items-center gap-2 text-ink-400">
                        <Phone size={14} />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">
                          Phone
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-semibold text-ink-900">
                        {detail.lead.phone || '-'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-ink-100 bg-white p-3">
                      <div className="flex items-center gap-2 text-ink-400">
                        <Mail size={14} />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">
                          Email
                        </span>
                      </div>

                      <p className="mt-2 truncate text-sm font-semibold text-ink-900">
                        {detail.lead.email || '-'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-ink-100 bg-white p-3">
                      <div className="flex items-center gap-2 text-ink-400">
                        <BookOpen size={14} />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">
                          Course
                        </span>
                      </div>

                      <p className="mt-2 truncate text-sm font-semibold text-ink-900">
                        {detail.lead.interestedCourse?.name ||
                          '-'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-ink-100 bg-white p-3">
                      <div className="flex items-center gap-2 text-ink-400">
                        <Target size={14} />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">
                          Source
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-semibold text-ink-900">
                        {sourceLabels[
                          detail.lead.source
                        ] ||
                          detail.lead.source ||
                          '-'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-ink-100 bg-white p-3">
                      <div className="flex items-center gap-2 text-ink-400">
                        <UserRound size={14} />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">
                          Owner
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-semibold text-ink-900">
                        {detail.lead.leadOwner?.name ||
                          detail.lead.assignedTo?.name ||
                          '-'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-ink-100 bg-white p-3">
                      <div className="flex items-center gap-2 text-ink-400">
                        <CalendarDays size={14} />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">
                          Created
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-semibold text-ink-900">
                        {formatDate(
                          detail.lead.createdAt
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 border-y border-ink-100 py-4">
                  {detail.whatsappLink && (
                    <a
                      href={detail.whatsappLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-sage-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sage-600 hover:shadow-md"
                    >
                      <MessageCircle size={16} />
                      WhatsApp
                    </a>
                  )}

                  {detail.lead.stage !== 'converted' &&
                    detail.lead.stage !== 'lost' && (
                      <button
                        type="button"
                        onClick={convert}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md"
                      >
                        <UserCheck size={16} />
                        Convert to Student
                      </button>
                    )}
                </div>

                {/* Notes */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-marigold-50 text-marigold-600">
                        <StickyNote size={15} />
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-ink-950">
                          Notes & Activity
                        </h3>

                        <p className="text-[10px] text-ink-400">
                          Keep track of conversations and follow-ups
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-ink-100 px-2 py-1 text-[10px] font-semibold text-ink-600">
                      {detail.lead.notes?.length || 0}{' '}
                      notes
                    </span>
                  </div>

                  <div className="max-h-60 space-y-2 overflow-y-auto rounded-2xl border border-ink-100 bg-ink-50/50 p-3">
                    {detail.lead.notes?.length ? (
                      detail.lead.notes
                        .slice()
                        .reverse()
                        .map((note, index) => (
                          <div
                            key={index}
                            className="relative rounded-xl border border-ink-100 bg-white p-3 shadow-sm"
                          >
                            <div className="flex gap-3">
                              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                <StickyNote
                                  size={13}
                                />
                              </div>

                              <div className="min-w-0">
                                <p className="text-sm leading-relaxed text-ink-800">
                                  {note.text}
                                </p>

                                <p className="mt-1.5 text-[10px] text-ink-400">
                                  {note.addedBy?.name ||
                                    'User'}{' '}
                                  ·{' '}
                                  {formatDateTime(
                                    note.addedAt
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="flex min-h-[100px] items-center justify-center text-center">
                        <div>
                          <StickyNote
                            size={22}
                            className="mx-auto text-ink-300"
                          />

                          <p className="mt-2 text-xs text-ink-400">
                            No activity notes yet
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Add Note */}
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      className="input flex-1"
                      placeholder="Add a note about this lead..."
                      value={noteText}
                      onChange={(e) =>
                        setNoteText(e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (
                          e.key === 'Enter' &&
                          !e.shiftKey
                        ) {
                          e.preventDefault();
                          addNote();
                        }
                      }}
                    />

                    <button
                      type="button"
                      disabled={
                        noteSaving ||
                        !noteText.trim()
                      }
                      onClick={addNote}
                      className="btn-primary min-w-[100px]"
                    >
                      {noteSaving
                        ? 'Adding...'
                        : 'Add Note'}
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