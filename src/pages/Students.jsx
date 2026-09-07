import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  IdCard,
  Pencil,
  Trash2,
  X,
  Eye,
  Upload,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  BookOpen,
  Layers,
  Tag,
  Users,
  GraduationCap,
  IndianRupee,
  FileText,
  MoreVertical,
  Filter,
  RefreshCw,
  CheckCircle2,
  Clock3,
  AlertCircle,
  UserRound,
  Building2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

import AppShell from '../components/AppShell';
import { PageHeader, Badge, EmptyState } from '../components/ui';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const statusTone = {
  enquiry: 'ink',
  form_filled: 'marigold',
  documents_pending: 'clay',
  confirmed: 'sage',
  cancelled: 'clay',
};

const statusOptions = [
  'enquiry',
  'form_filled',
  'documents_pending',
  'confirmed',
  'cancelled',
];

const statusMeta = {
  enquiry: {
    label: 'Enquiry',
    icon: Clock3,
  },
  form_filled: {
    label: 'Form Filled',
    icon: FileText,
  },
  documents_pending: {
    label: 'Documents Pending',
    icon: AlertCircle,
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    icon: X,
  },
};

const initialCreateForm = {
  name: '',
  fatherName: '',
  dob: '',
  gender: 'male',
  phone: '',
  altPhone: '',
  email: '',
  address: '',
  photoUrl: '',
  branch: '',
  course: '',
  batch: '',
  totalFee: 0,
  discount: 0,
  admissionStatus: 'confirmed',
  leadSource: '',
};

export default function Students() {
  const { user } = useAuth();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters & pagination
  const [filters, setFilters] = useState({
    search: '',
    branch: '',
    course: '',
    batch: '',
    status: '',
    page: 1,
    limit: 10,
  });

  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
  });

  const [showFilters, setShowFilters] = useState(false);

  // Modals / drawer
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailMode, setDetailMode] = useState('view');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Delete confirmation
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');

  // Dropdown data
  const [branches, setBranches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);

  // Forms
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [editForm, setEditForm] = useState({});

  // Documents
  const [docName, setDocName] = useState('');
  const [docUrl, setDocUrl] = useState('');

  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addingDocument, setAddingDocument] = useState(false);

  // ─────────────────────────────────────────────
  // Data
  // ─────────────────────────────────────────────

  const loadStudents = async () => {
    setLoading(true);

    try {
      const params = { ...filters };

      const res = await api.get('/students', {
        params,
      });

      setStudents(res.data.students || []);

      setPagination({
        total: res.data.total || 0,
        pages: res.data.pages || 0,
      });
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to load students'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [filters]);

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [branchesRes, coursesRes, batchesRes] =
          await Promise.all([
            api.get('/branches'),
            api.get('/academics/courses'),
            api.get('/academics/batches'),
          ]);

        setBranches(branchesRes.data.branches || []);
        setCourses(coursesRes.data.courses || []);
        setBatches(batchesRes.data.batches || []);
      } catch (err) {
        toast.error('Failed to load admission options');
      }
    };

    loadDropdowns();
  }, []);

  // ─────────────────────────────────────────────
  // Derived values
  // ─────────────────────────────────────────────

  const selectedCount = selectedIds.length;

  const allCurrentPageSelected =
    students.length > 0 &&
    students.every((student) => selectedIds.includes(student._id));

  const activeFiltersCount = useMemo(() => {
    return [
      filters.branch,
      filters.course,
      filters.batch,
      filters.status,
    ].filter(Boolean).length;
  }, [
    filters.branch,
    filters.course,
    filters.batch,
    filters.status,
  ]);

  const branchName = (branch) => {
    if (!branch) return '-';

    if (typeof branch === 'object') {
      return branch.name || '-';
    }

    return (
      branches.find((item) => item._id === branch)?.name || '-'
    );
  };

  const courseName = (course) => {
    if (!course) return '-';

    if (typeof course === 'object') {
      return course.name || '-';
    }

    return (
      courses.find((item) => item._id === course)?.name || '-'
    );
  };

  const batchName = (batch) => {
    if (!batch) return 'Unassigned';

    if (typeof batch === 'object') {
      return batch.name || 'Unassigned';
    }

    return (
      batches.find((item) => item._id === batch)?.name ||
      'Unassigned'
    );
  };

  // ─────────────────────────────────────────────
  // Create student
  // ─────────────────────────────────────────────

  const handleCreate = async (e) => {
    e.preventDefault();

    setCreating(true);

    try {
      const payload = { ...createForm };

      if (user.role !== 'admin') {
        delete payload.branch;
      }

      await api.post('/students', payload);

      toast.success('Admission created successfully');

      setCreateModalOpen(false);
      setCreateForm(initialCreateForm);

      loadStudents();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Could not create admission'
      );
    } finally {
      setCreating(false);
    }
  };

  // ─────────────────────────────────────────────
  // Detail
  // ─────────────────────────────────────────────

  const openDetail = async (student) => {
    setSelectedStudent(student);
    setEditForm({ ...student });
    setDetailMode('view');
    setDetailDrawerOpen(true);
    setDocName('');
    setDocUrl('');

    try {
      const res = await api.get(`/students/${student._id}`);

      if (res.data.student) {
        setSelectedStudent(res.data.student);
        setEditForm(res.data.student);
      }
    } catch {
      // Existing row data is still usable.
    }
  };

  const closeDetail = () => {
    setDetailDrawerOpen(false);

    setTimeout(() => {
      setSelectedStudent(null);
      setDetailMode('view');
    }, 250);
  };

  const handleEditToggle = () => {
    if (detailMode === 'view') {
      setDetailMode('edit');
      setEditForm({ ...selectedStudent });
    } else {
      setDetailMode('view');
      setEditForm({ ...selectedStudent });
    }
  };

  // ─────────────────────────────────────────────
  // Update
  // ─────────────────────────────────────────────

  const handleUpdate = async (e) => {
    e?.preventDefault();

    if (!selectedStudent?._id) return;

    setUpdating(true);

    try {
      const payload = { ...editForm };

      delete payload._id;
      delete payload.admissionId;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.__v;

      if (user.role !== 'admin') {
        delete payload.branch;
      }

      const res = await api.patch(
        `/students/${selectedStudent._id}`,
        payload
      );

      toast.success('Student updated successfully');

      setSelectedStudent(res.data.student);
      setEditForm(res.data.student);
      setDetailMode('view');

      loadStudents();
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Update failed'
      );
    } finally {
      setUpdating(false);
    }
  };

  // ─────────────────────────────────────────────
  // Delete
  // ─────────────────────────────────────────────

  const confirmDelete = (student) => {
    setStudentToDelete(student);
    setConfirmDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!studentToDelete?._id) return;

    setDeleting(true);

    try {
      await api.delete(
        `/students/${studentToDelete._id}`
      );

      toast.success('Student deactivated');

      setConfirmDeleteOpen(false);
      setStudentToDelete(null);

      if (detailDrawerOpen) {
        closeDetail();
      }

      loadStudents();
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Delete failed'
      );
    } finally {
      setDeleting(false);
    }
  };

  // ─────────────────────────────────────────────
  // Documents
  // ─────────────────────────────────────────────

  const handleAddDocument = async () => {
    if (!docName.trim() || !docUrl.trim()) {
      toast.error('Document name and URL are required');
      return;
    }

    if (!selectedStudent?._id) return;

    setAddingDocument(true);

    try {
      await api.post(
        `/students/${selectedStudent._id}/documents`,
        {
          name: docName.trim(),
          url: docUrl.trim(),
        }
      );

      toast.success('Document added');

      const res = await api.get(
        `/students/${selectedStudent._id}`
      );

      setSelectedStudent(res.data.student);
      setEditForm(res.data.student);

      setDocName('');
      setDocUrl('');
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Could not add document'
      );
    } finally {
      setAddingDocument(false);
    }
  };

  const handleRemoveDocument = async (docId) => {
    if (!selectedStudent?._id) return;

    const confirmed = window.confirm(
      'Remove this document?'
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/students/${selectedStudent._id}/documents/${docId}`
      );

      toast.success('Document removed');

      const res = await api.get(
        `/students/${selectedStudent._id}`
      );

      setSelectedStudent(res.data.student);
      setEditForm(res.data.student);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Could not remove document'
      );
    }
  };

  // ─────────────────────────────────────────────
  // Bulk status
  // ─────────────────────────────────────────────

  const handleBulkStatus = async () => {
    if (!bulkStatus) {
      toast.error('Select a status');
      return;
    }

    if (selectedIds.length === 0) {
      toast.error('Select at least one student');
      return;
    }

    try {
      await api.patch('/students/bulk/status', {
        studentIds: selectedIds,
        admissionStatus: bulkStatus,
      });

      toast.success(
        `Updated ${selectedIds.length} students`
      );

      setSelectedIds([]);
      setBulkStatus('');

      loadStudents();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Bulk update failed'
      );
    }
  };

  // ─────────────────────────────────────────────
  // Filters
  // ─────────────────────────────────────────────

  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const clearFilters = () => {
    setFilters((prev) => ({
      ...prev,
      search: '',
      branch: '',
      course: '',
      batch: '',
      status: '',
      page: 1,
    }));
  };

  const goToPage = (page) => {
    if (page < 1) return;
    if (pagination.pages && page > pagination.pages) return;

    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  // ─────────────────────────────────────────────
  // Selection
  // ─────────────────────────────────────────────

  const toggleStudentSelection = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (allCurrentPageSelected) {
      setSelectedIds((prev) =>
        prev.filter(
          (id) =>
            !students.some(
              (student) => student._id === id
            )
        )
      );
    } else {
      setSelectedIds((prev) => [
        ...new Set([
          ...prev,
          ...students.map((student) => student._id),
        ]),
      ]);
    }
  };

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  const formatStatus = (status) => {
    if (!status) return 'Unknown';

    return status
      .split('_')
      .map(
        (word) =>
          word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(' ');
  };

  const formatDate = (date) => {
    if (!date) return '-';

    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderStatusBadge = (status) => {
    return (
      <Badge tone={statusTone[status] || 'ink'}>
        {formatStatus(status)}
      </Badge>
    );
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <AppShell title="Students">
      <div className="space-y-5 pb-8">

        {/* ═══════════════════════════════════════
            HEADER
        ═══════════════════════════════════════ */}

        <PageHeader
          title="Student Admissions"
          description="Search, admit and manage student profiles."
          action={
            <button
              className="
                group
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
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus size={17} />
              <span>New Admission</span>
            </button>
          }
        />

        {/* ═══════════════════════════════════════
            TOP SUMMARY
        ═══════════════════════════════════════ */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">

          <MiniStat
            icon={<Users size={19} />}
            label="Total Students"
            value={pagination.total || 0}
            description="Across current records"
          />

          <MiniStat
            icon={<CheckCircle2 size={19} />}
            label="Showing"
            value={students.length}
            description="Students on this page"
          />

          <MiniStat
            icon={<GraduationCap size={19} />}
            label="Courses"
            value={courses.length}
            description="Available courses"
          />

          <MiniStat
            icon={<Building2 size={19} />}
            label="Branches"
            value={branches.length}
            description="Available branches"
          />

        </div>

        {/* ═══════════════════════════════════════
            FILTER PANEL
        ═══════════════════════════════════════ */}

        <div
          className="
            rounded-2xl
            border border-ink-100
            bg-white
            shadow-[0_8px_30px_rgba(15,23,42,0.06)]
            overflow-hidden
          "
        >

          {/* Filter Header */}

          <div
            className="
              px-4 sm:px-5 py-4
              flex flex-col sm:flex-row
              gap-3
              sm:items-center
              sm:justify-between
              bg-gradient-to-r
              from-ink-50/80
              to-white
              border-b border-ink-100
            "
          >
            <div className="flex items-center gap-3">

              <div
                className="
                  w-10 h-10
                  rounded-xl
                  bg-ink-950
                  text-white
                  flex items-center justify-center
                  shadow-md
                "
              >
                <Filter size={18} />
              </div>

              <div>
                <h3 className="font-semibold text-ink-950">
                  Search & Filters
                </h3>

                <p className="text-xs text-ink-500 mt-0.5">
                  Find students quickly
                  {activeFiltersCount > 0 &&
                    ` • ${activeFiltersCount} filters active`}
                </p>
              </div>

            </div>

            <div className="flex items-center gap-2">

              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="
                    text-xs sm:text-sm
                    font-medium
                    text-ink-600
                    hover:text-ink-950
                    px-3 py-2
                    rounded-lg
                    hover:bg-ink-100
                    transition
                  "
                >
                  Clear filters
                </button>
              )}

              <button
                className="
                  sm:hidden
                  p-2
                  rounded-lg
                  border border-ink-200
                  text-ink-600
                  hover:bg-ink-50
                "
                onClick={() =>
                  setShowFilters((prev) => !prev)
                }
              >
                <Filter size={17} />
              </button>

              <button
                className="
                  hidden sm:flex
                  p-2
                  rounded-lg
                  border border-ink-200
                  text-ink-600
                  hover:bg-ink-50
                  transition
                "
                onClick={loadStudents}
                title="Refresh"
              >
                <RefreshCw
                  size={16}
                  className={
                    loading ? 'animate-spin' : ''
                  }
                />
              </button>

            </div>
          </div>

          {/* Filters */}

          <div
            className={`
              p-4 sm:p-5
              ${
                showFilters
                  ? 'block'
                  : 'hidden sm:block'
              }
            `}
          >

            <div
              className={`
                grid gap-3
                ${
                  user?.role === 'admin'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                }
              `}
            >

              {/* Search */}

              <div className="relative sm:col-span-2 lg:col-span-1 xl:col-span-2">
      
                <input
                  className="
                    input
                    w-full
                    pl-10
                    h-11
                    rounded-xl
                    border-ink-200
                    focus:border-ink-400
                    focus:ring-4
                    focus:ring-ink-100
                    transition
                  "
                  placeholder="Search name, phone or admission ID..."
                  value={filters.search}
                  onChange={(e) =>
                    updateFilter(
                      'search',
                      e.target.value
                    )
                  }
                />
              </div>

              {/* Branch */}

              {user?.role === 'admin' && (
                <FilterSelect
                  value={filters.branch}
                  onChange={(value) =>
                    updateFilter('branch', value)
                  }
                  options={branches}
                  placeholder="All Branches"
                  icon={<Building2 size={15} />}
                  valueKey="_id"
                  labelKey="name"
                />
              )}

              {/* Course */}

              <FilterSelect
                value={filters.course}
                onChange={(value) =>
                  updateFilter('course', value)
                }
                options={courses}
                placeholder="All Courses"
                icon={<BookOpen size={15} />}
                valueKey="_id"
                labelKey="name"
              />

              {/* Batch */}

              <FilterSelect
                value={filters.batch}
                onChange={(value) =>
                  updateFilter('batch', value)
                }
                options={batches}
                placeholder="All Batches"
                icon={<Layers size={15} />}
                valueKey="_id"
                labelKey="name"
              />

              {/* Status */}

              <div className="relative">
                <select
                  className="
                    input
                    w-full
                    h-11
                    rounded-xl
                    border-ink-200
                    pl-3
                    pr-8
                    appearance-none
                  "
                  value={filters.status}
                  onChange={(e) =>
                    updateFilter(
                      'status',
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    All Status
                  </option>

                  {statusOptions.map((status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Mobile refresh */}

            <button
              className="
                sm:hidden
                mt-3
                w-full
                h-10
                rounded-xl
                border border-ink-200
                flex items-center
                justify-center
                gap-2
                text-sm
                font-medium
                text-ink-700
                hover:bg-ink-50
              "
              onClick={loadStudents}
            >
              <RefreshCw
                size={15}
                className={
                  loading ? 'animate-spin' : ''
                }
              />
              Refresh Students
            </button>

          </div>
        </div>

        {/* ═══════════════════════════════════════
            BULK ACTION BAR
        ═══════════════════════════════════════ */}

        {selectedCount > 0 && (
          <div
            className="
              sticky top-2 z-20
              rounded-2xl
              border border-ink-200
              bg-ink-950
              text-white
              p-3 sm:p-4
              shadow-2xl
            "
          >
            <div
              className="
                flex
                flex-col
                sm:flex-row
                gap-3
                sm:items-center
                sm:justify-between
              "
            >

              <div className="flex items-center gap-3">

                <div
                  className="
                    w-9 h-9
                    rounded-xl
                    bg-white/10
                    flex items-center justify-center
                  "
                >
                  <CheckCircle2 size={17} />
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    {selectedCount} student
                    {selectedCount !== 1
                      ? 's'
                      : ''}{' '}
                    selected
                  </p>

                  <p className="text-[11px] text-white/60">
                    Apply a status to selected
                    students
                  </p>
                </div>

              </div>

              <div
                className="
                  flex
                  flex-col
                  sm:flex-row
                  gap-2
                  w-full sm:w-auto
                "
              >

                <select
                  className="
                    h-10
                    rounded-xl
                    bg-white/10
                    border border-white/15
                    text-white
                    px-3
                    text-sm
                    w-full sm:w-52
                    outline-none
                  "
                  value={bulkStatus}
                  onChange={(e) =>
                    setBulkStatus(e.target.value)
                  }
                >
                  <option
                    value=""
                    className="text-ink-950"
                  >
                    Change status...
                  </option>

                  {statusOptions.map((status) => (
                    <option
                      key={status}
                      value={status}
                      className="text-ink-950"
                    >
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>

                <button
                  className="
                    h-10
                    px-4
                    rounded-xl
                    bg-white
                    text-ink-950
                    font-semibold
                    text-sm
                    hover:bg-ink-100
                    transition
                  "
                  onClick={handleBulkStatus}
                >
                  Apply
                </button>

                <button
                  className="
                    h-10
                    px-4
                    rounded-xl
                    bg-white/10
                    border border-white/15
                    text-white
                    text-sm
                    hover:bg-white/15
                  "
                  onClick={() => {
                    setSelectedIds([]);
                    setBulkStatus('');
                  }}
                >
                  Clear
                </button>

              </div>

            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
            STUDENT LIST
        ═══════════════════════════════════════ */}

        <div
          className="
            rounded-2xl
            border border-ink-100
            bg-white
            shadow-[0_8px_30px_rgba(15,23,42,0.06)]
            overflow-hidden
          "
        >

          {/* Desktop Table */}

          <div className="hidden lg:block overflow-x-auto">

            <table className="w-full text-sm">

              <thead>
                <tr
                  className="
                    bg-ink-50/80
                    border-b border-ink-100
                    text-left
                  "
                >

                  <th className="px-5 py-4 w-10">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-black"
                      checked={allCurrentPageSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>

                  <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-ink-500">
                    Student
                  </th>

                  <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-ink-500">
                    Admission ID
                  </th>

                  <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-ink-500">
                    Course
                  </th>

                  <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-ink-500">
                    Contact
                  </th>

                  <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-ink-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-ink-500">
                    Action
                  </th>

                </tr>
              </thead>

              <tbody>

                {loading
                  ? Array.from({ length: 6 }).map(
                      (_, index) => (
                        <DesktopSkeleton
                          key={index}
                        />
                      )
                    )
                  : students.map((student) => (
                      <DesktopStudentRow
                        key={student._id}
                        student={student}
                        selected={selectedIds.includes(
                          student._id
                        )}
                        onSelect={() =>
                          toggleStudentSelection(
                            student._id
                          )
                        }
                        onOpen={() =>
                          openDetail(student)
                        }
                        onDelete={() =>
                          confirmDelete(student)
                        }
                        user={user}
                        renderStatusBadge={
                          renderStatusBadge
                        }
                        courseName={courseName}
                        batchName={batchName}
                      />
                    ))}

              </tbody>
            </table>

          </div>

          {/* Mobile / Tablet Cards */}

          <div className="lg:hidden">

            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map(
                  (_, index) => (
                    <MobileSkeleton key={index} />
                  )
                )}
              </div>
            ) : students.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="No students found"
                  description="Try adjusting your filters or add a new admission."
                />
              </div>
            ) : (
              <div className="p-3 sm:p-4 space-y-3">

                {students.map((student) => (
                  <MobileStudentCard
                    key={student._id}
                    student={student}
                    selected={selectedIds.includes(
                      student._id
                    )}
                    onSelect={() =>
                      toggleStudentSelection(
                        student._id
                      )
                    }
                    onOpen={() =>
                      openDetail(student)
                    }
                    onDelete={() =>
                      confirmDelete(student)
                    }
                    user={user}
                    renderStatusBadge={
                      renderStatusBadge
                    }
                    courseName={courseName}
                    batchName={batchName}
                  />
                ))}

              </div>
            )}

          </div>

          {/* Empty desktop */}

          {!loading &&
            students.length === 0 && (
              <div className="hidden lg:block p-8">
                <EmptyState
                  title="No students found"
                  description="Try adjusting your filters or add a new admission."
                />
              </div>
            )}

          {/* ═══════════════════════════════════
              PAGINATION
          ═══════════════════════════════════ */}

          {!loading && students.length > 0 && (
            <div
              className="
                border-t border-ink-100
                px-4 sm:px-5 py-4
                flex
                flex-col
                sm:flex-row
                gap-3
                sm:items-center
                sm:justify-between
              "
            >

              <p className="text-xs sm:text-sm text-ink-500 text-center sm:text-left">
                Showing{' '}
                <span className="font-semibold text-ink-800">
                  {students.length}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-ink-800">
                  {pagination.total}
                </span>{' '}
                students
              </p>

              <div className="flex items-center justify-center gap-2">

                <button
                  className="
                    w-9 h-9
                    rounded-xl
                    border border-ink-200
                    flex items-center justify-center
                    text-ink-600
                    hover:bg-ink-50
                    disabled:opacity-40
                    disabled:cursor-not-allowed
                    transition
                  "
                  disabled={filters.page <= 1}
                  onClick={() =>
                    goToPage(filters.page - 1)
                  }
                >
                  <ChevronLeft size={17} />
                </button>

                <div
                  className="
                    h-9
                    min-w-[100px]
                    px-3
                    rounded-xl
                    bg-ink-950
                    text-white
                    flex items-center justify-center
                    text-xs sm:text-sm
                    font-medium
                  "
                >
                  Page {filters.page} of{' '}
                  {pagination.pages || 1}
                </div>

                <button
                  className="
                    w-9 h-9
                    rounded-xl
                    border border-ink-200
                    flex items-center justify-center
                    text-ink-600
                    hover:bg-ink-50
                    disabled:opacity-40
                    disabled:cursor-not-allowed
                    transition
                  "
                  disabled={
                    !pagination.pages ||
                    filters.page >= pagination.pages
                  }
                  onClick={() =>
                    goToPage(filters.page + 1)
                  }
                >
                  <ChevronRight size={17} />
                </button>

              </div>

            </div>
          )}

        </div>

      </div>

      {/* ═══════════════════════════════════════
          CREATE ADMISSION MODAL
      ═══════════════════════════════════════ */}

      <ResponsiveModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="New Admission"
        subtitle="Create a new student admission record"
        wide
      >

        <form
          onSubmit={handleCreate}
          className="space-y-6"
        >

          <FormSection
            icon={<UserRound size={17} />}
            title="Personal Information"
            description="Basic student details"
          >

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <FormField
                label="Student Name"
                required
              >
                <input
                  className="input"
                  required
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      name: e.target.value,
                    })
                  }
                  placeholder="Enter student name"
                />
              </FormField>

              <FormField label="Father's Name">
                <input
                  className="input"
                  value={createForm.fatherName}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      fatherName: e.target.value,
                    })
                  }
                  placeholder="Enter father's name"
                />
              </FormField>

              <FormField label="Date of Birth">
                <input
                  type="date"
                  className="input"
                  value={createForm.dob}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      dob: e.target.value,
                    })
                  }
                />
              </FormField>

              <FormField label="Gender">
                <select
                  className="input"
                  value={createForm.gender}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      gender: e.target.value,
                    })
                  }
                >
                  <option value="male">Male</option>
                  <option value="female">
                    Female
                  </option>
                  <option value="other">
                    Other
                  </option>
                </select>
              </FormField>

            </div>
          </FormSection>

          <FormSection
            icon={<Phone size={17} />}
            title="Contact Information"
            description="Student contact details"
          >

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <FormField
                label="Phone"
                required
              >
                <div className="relative">
                  <Phone
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                  />

                  <input
                    className="input pl-9"
                    required
                    value={createForm.phone}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        phone: e.target.value,
                      })
                    }
                    placeholder="10 digit mobile number"
                  />
                </div>
              </FormField>

              <FormField label="Alternate Phone">
                <input
                  className="input"
                  value={createForm.altPhone}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      altPhone: e.target.value,
                    })
                  }
                  placeholder="Alternate contact"
                />
              </FormField>

              <FormField label="Email">
                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                  />

                  <input
                    type="email"
                    className="input pl-9"
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        email: e.target.value,
                      })
                    }
                    placeholder="student@example.com"
                  />
                </div>
              </FormField>

              <FormField label="Photo URL">
                <input
                  className="input"
                  placeholder="https://..."
                  value={createForm.photoUrl}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      photoUrl: e.target.value,
                    })
                  }
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Address">
                  <textarea
                    className="input min-h-[90px] resize-y"
                    rows={3}
                    value={createForm.address}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        address: e.target.value,
                      })
                    }
                    placeholder="Enter complete address"
                  />
                </FormField>
              </div>

            </div>
          </FormSection>

          <FormSection
            icon={<GraduationCap size={17} />}
            title="Academic Information"
            description="Course, batch and branch assignment"
          >

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {user?.role === 'admin' && (
                <FormField
                  label="Branch"
                  required
                >
                  <select
                    className="input"
                    required
                    value={createForm.branch}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
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
                </FormField>
              )}

              <FormField
                label="Course"
                required
              >
                <select
                  className="input"
                  required
                  value={createForm.course}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      course: e.target.value,
                    })
                  }
                >
                  <option value="">
                    Select course
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
              </FormField>

              <FormField label="Batch">
                <select
                  className="input"
                  value={createForm.batch}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      batch: e.target.value,
                    })
                  }
                >
                  <option value="">
                    Unassigned
                  </option>

                  {batches.map((batch) => (
                    <option
                      key={batch._id}
                      value={batch._id}
                    >
                      {batch.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Lead Source">
                <input
                  className="input"
                  placeholder="e.g. walk-in, referral, ad"
                  value={createForm.leadSource}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      leadSource: e.target.value,
                    })
                  }
                />
              </FormField>

              <FormField label="Admission Status">
                <select
                  className="input"
                  value={createForm.admissionStatus}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      admissionStatus: e.target.value,
                    })
                  }
                >
                  {statusOptions.map((status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
              </FormField>

            </div>
          </FormSection>

          <FormSection
            icon={<IndianRupee size={17} />}
            title="Fee Information"
            description="Set the student's fee structure"
          >

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <FormField label="Total Fee (₹)">
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={createForm.totalFee}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      totalFee:
                        parseFloat(
                          e.target.value
                        ) || 0,
                    })
                  }
                />
              </FormField>

              <FormField label="Discount (₹)">
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={createForm.discount}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      discount:
                        parseFloat(
                          e.target.value
                        ) || 0,
                    })
                  }
                />
              </FormField>

            </div>

            <div
              className="
                mt-4
                rounded-xl
                bg-ink-50
                border border-ink-100
                p-4
                flex items-center justify-between
              "
            >
              <span className="text-sm text-ink-600">
                Final Fee
              </span>

              <span className="text-xl font-bold text-ink-950">
                ₹
                {Math.max(
                  0,
                  Number(createForm.totalFee || 0) -
                    Number(createForm.discount || 0)
                ).toLocaleString('en-IN')}
              </span>
            </div>

          </FormSection>

          {/* Footer */}

          <div
            className="
              flex
              flex-col-reverse sm:flex-row
              gap-2
              sm:justify-end
              pt-2
              border-t border-ink-100
            "
          >
            <button
              type="button"
              className="btn-outline w-full sm:w-auto justify-center"
              onClick={() =>
                setCreateModalOpen(false)
              }
              disabled={creating}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="
                btn-primary
                w-full sm:w-auto
                justify-center
                min-w-[160px]
              "
              disabled={creating}
            >
              {creating ? (
                <>
                  <Spinner />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Create Admission
                </>
              )}
            </button>
          </div>

        </form>

      </ResponsiveModal>

      {/* ═══════════════════════════════════════
          STUDENT DETAIL DRAWER
      ═══════════════════════════════════════ */}

      <div
        className={`
          fixed inset-0 z-50
          transition-all duration-300
          ${
            detailDrawerOpen
              ? 'pointer-events-auto'
              : 'pointer-events-none'
          }
        `}
      >

        {/* Backdrop */}

        <div
          className={`
            absolute inset-0
            bg-ink-950/50
            backdrop-blur-sm
            transition-opacity
            duration-300
            ${
              detailDrawerOpen
                ? 'opacity-100'
                : 'opacity-0'
            }
          `}
          onClick={closeDetail}
        />

        {/* Drawer */}

        <div
          className={`
            absolute
            right-0
            top-0
            h-full
            w-full
            sm:max-w-3xl
            lg:max-w-5xl
            bg-white
            shadow-2xl
            transition-transform
            duration-300
            ease-out
            ${
              detailDrawerOpen
                ? 'translate-x-0'
                : 'translate-x-full'
            }
          `}
        >

          <div className="flex flex-col h-full">

            {/* Drawer Header */}

            <div
              className="
                shrink-0
                px-4 sm:px-6
                py-4
                border-b border-ink-100
                bg-white
                shadow-sm
                relative z-10
              "
            >

              <div className="flex items-start gap-3">

                <div
                  className="
                    w-10 h-10
                    sm:w-11 sm:h-11
                    rounded-xl
                    bg-ink-950
                    text-white
                    flex items-center justify-center
                    shrink-0
                  "
                >
                  <IdCard size={20} />
                </div>

                <div className="min-w-0 flex-1">

                  <div className="flex flex-wrap items-center gap-2">

                    <h2 className="text-base sm:text-lg font-bold text-ink-950">
                      {detailMode === 'view'
                        ? 'Student Profile'
                        : 'Edit Student'}
                    </h2>

                    {selectedStudent &&
                      renderStatusBadge(
                        selectedStudent.admissionStatus
                      )}

                  </div>

                  {selectedStudent && (
                    <p className="text-xs sm:text-sm text-ink-500 mt-1 truncate">
                      {selectedStudent.name} •{' '}
                      {selectedStudent.admissionId}
                    </p>
                  )}

                </div>

                <div className="flex items-center gap-1.5 shrink-0">

                  {detailMode === 'view' &&
                    ['admin', 'branch_manager'].includes(
                      user?.role
                    ) && (
                      <>
                        <button
                          className="
                            hidden sm:flex
                            btn-primary
                            text-sm
                            h-9
                          "
                          onClick={
                            handleEditToggle
                          }
                        >
                          <Pencil size={15} />
                          Edit
                        </button>

                        <button
                          className="
                            hidden sm:flex
                            btn-outline-danger
                            text-sm
                            h-9
                          "
                          onClick={() =>
                            confirmDelete(
                              selectedStudent
                            )
                          }
                        >
                          <Trash2 size={15} />
                          Delete
                        </button>

                        <button
                          className="
                            sm:hidden
                            p-2
                            rounded-lg
                            bg-ink-50
                            text-ink-700
                          "
                          onClick={
                            handleEditToggle
                          }
                        >
                          <Pencil size={17} />
                        </button>
                      </>
                    )}

                  {detailMode === 'edit' && (
                    <button
                      className="
                        hidden sm:flex
                        btn-primary
                        text-sm
                        h-9
                      "
                      onClick={handleUpdate}
                      disabled={updating}
                    >
                      {updating ? (
                        <Spinner />
                      ) : (
                        <Pencil size={15} />
                      )}
                      Save
                    </button>
                  )}

                  <button
                    className="
                      p-2
                      rounded-xl
                      text-ink-500
                      hover:text-ink-950
                      hover:bg-ink-100
                      transition
                    "
                    onClick={closeDetail}
                  >
                    <X size={20} />
                  </button>

                </div>

              </div>

              {/* Mobile actions */}

              <div className="flex sm:hidden gap-2 mt-3">

                {detailMode === 'view' &&
                  ['admin', 'branch_manager'].includes(
                    user?.role
                  ) && (
                    <>
                      <button
                        className="
                          flex-1
                          h-9
                          rounded-xl
                          bg-ink-950
                          text-white
                          text-sm
                          font-semibold
                          flex items-center justify-center gap-2
                        "
                        onClick={
                          handleEditToggle
                        }
                      >
                        <Pencil size={14} />
                        Edit
                      </button>

                      <button
                        className="
                          flex-1
                          h-9
                          rounded-xl
                          border border-red-200
                          text-red-600
                          text-sm
                          font-semibold
                          flex items-center justify-center gap-2
                        "
                        onClick={() =>
                          confirmDelete(
                            selectedStudent
                          )
                        }
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </>
                  )}

                {detailMode === 'edit' && (
                  <>
                    <button
                      className="
                        flex-1
                        h-9
                        rounded-xl
                        border border-ink-200
                        text-ink-700
                        text-sm
                        font-semibold
                      "
                      onClick={handleEditToggle}
                    >
                      Cancel
                    </button>

                    <button
                      className="
                        flex-1
                        h-9
                        rounded-xl
                        bg-ink-950
                        text-white
                        text-sm
                        font-semibold
                        flex items-center justify-center gap-2
                      "
                      onClick={handleUpdate}
                      disabled={updating}
                    >
                      {updating ? (
                        <Spinner />
                      ) : (
                        <Pencil size={14} />
                      )}
                      Save Changes
                    </button>
                  </>
                )}

              </div>

            </div>

            {/* Drawer Body */}

            <div className="flex-1 overflow-y-auto bg-ink-50/50">

              {selectedStudent && (
                <div className="p-4 sm:p-6">

                  {detailMode === 'view' ? (
                    <StudentView
                      student={selectedStudent}
                      renderStatusBadge={
                        renderStatusBadge
                      }
                      courseName={courseName}
                      batchName={batchName}
                      branchName={branchName}
                    />
                  ) : (
                    <StudentEditForm
                      editForm={editForm}
                      setEditForm={setEditForm}
                      courses={courses}
                      batches={batches}
                      branches={branches}
                      user={user}
                      selectedStudent={
                        selectedStudent
                      }
                      docName={docName}
                      setDocName={setDocName}
                      docUrl={docUrl}
                      setDocUrl={setDocUrl}
                      handleAddDocument={
                        handleAddDocument
                      }
                      handleRemoveDocument={
                        handleRemoveDocument
                      }
                      addingDocument={
                        addingDocument
                      }
                    />
                  )}

                </div>
              )}

            </div>

          </div>

        </div>

      </div>

      {/* ═══════════════════════════════════════
          DELETE MODAL
      ═══════════════════════════════════════ */}

      <ResponsiveModal
        open={confirmDeleteOpen}
        onClose={() => {
          setConfirmDeleteOpen(false);
          setStudentToDelete(null);
        }}
        title="Confirm Deactivation"
        subtitle="This action will deactivate the student record."
      >

        <div className="text-center sm:text-left">

          <div
            className="
              mx-auto sm:mx-0
              w-14 h-14
              rounded-2xl
              bg-red-50
              text-red-600
              flex items-center justify-center
              mb-4
            "
          >
            <Trash2 size={24} />
          </div>

          <p className="text-sm sm:text-base text-ink-700 leading-6">
            Are you sure you want to deactivate{' '}
            <strong className="text-ink-950">
              {studentToDelete?.name}
            </strong>
            ?
          </p>

          <p className="text-xs sm:text-sm text-ink-500 mt-2">
            The student record will remain in the
            system and can be restored later.
          </p>

        </div>

        <div
          className="
            flex
            flex-col-reverse sm:flex-row
            gap-2
            sm:justify-end
            mt-6
          "
        >

          <button
            className="btn-outline w-full sm:w-auto justify-center"
            onClick={() => {
              setConfirmDeleteOpen(false);
              setStudentToDelete(null);
            }}
            disabled={deleting}
          >
            Cancel
          </button>

          <button
            className="
              btn-danger
              w-full sm:w-auto
              justify-center
            "
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Spinner />
                Deactivating...
              </>
            ) : (
              <>
                <Trash2 size={15} />
                Deactivate
              </>
            )}
          </button>

        </div>

      </ResponsiveModal>
    </AppShell>
  );
}

/* ═══════════════════════════════════════════════
   MINI STAT
═══════════════════════════════════════════════ */

function MiniStat({
  icon,
  label,
  value,
  description,
}) {
  return (
    <div
      className="
        group
        relative
        overflow-hidden
        rounded-2xl
        border border-ink-100
        bg-white
        p-4
        shadow-[0_6px_25px_rgba(15,23,42,0.05)]
        hover:-translate-y-0.5
        hover:shadow-[0_12px_35px_rgba(15,23,42,0.08)]
        transition-all duration-300
      "
    >

      <div
        className="
          absolute
          -right-8
          -top-8
          w-24 h-24
          rounded-full
          bg-ink-50
          group-hover:scale-125
          transition-transform duration-500
        "
      />

      <div className="relative flex items-center gap-3">

        <div
          className="
            w-10 h-10
            rounded-xl
            bg-ink-950
            text-white
            flex items-center justify-center
            shadow-md
            shrink-0
          "
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium text-ink-500">
            {label}
          </p>

          <div className="flex items-end gap-2">
            <p className="text-xl font-bold text-ink-950">
              {value}
            </p>

            <p className="text-[10px] text-ink-400 mb-1 truncate">
              {description}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   FILTER SELECT
═══════════════════════════════════════════════ */

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  valueKey,
  labelKey,
}) {
  return (
    <select
      className="
        input
        w-full
        h-11
        rounded-xl
        border-ink-200
        appearance-none
      "
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>

      {options.map((option) => (
        <option
          key={option[valueKey]}
          value={option[valueKey]}
        >
          {option[labelKey]}
        </option>
      ))}
    </select>
  );
}

/* ═══════════════════════════════════════════════
   DESKTOP ROW
═══════════════════════════════════════════════ */

function DesktopStudentRow({
  student,
  selected,
  onSelect,
  onOpen,
  onDelete,
  user,
  renderStatusBadge,
  courseName,
  batchName,
}) {
  return (
    <tr
      className="
        group
        border-b border-ink-100
        last:border-0
        hover:bg-ink-50/70
        transition-colors
      "
    >

      <td className="px-5 py-4">
        <input
          type="checkbox"
          className="w-4 h-4 accent-black"
          checked={selected}
          onChange={onSelect}
        />
      </td>

      <td
        className="px-4 py-4 cursor-pointer"
        onClick={onOpen}
      >
        <div className="flex items-center gap-3">

          <StudentAvatar
            student={student}
            size="sm"
          />

          <div className="min-w-0">

            <p className="font-semibold text-ink-950 truncate max-w-[190px]">
              {student.name}
            </p>

            <p className="text-xs text-ink-500 mt-0.5">
              {student.gender
                ? student.gender
                    .charAt(0)
                    .toUpperCase() +
                  student.gender.slice(1)
                : 'Student'}
            </p>

          </div>

        </div>
      </td>

      <td
        className="px-4 py-4 cursor-pointer"
        onClick={onOpen}
      >
        <div
          className="
            inline-flex
            items-center
            gap-2
            rounded-lg
            bg-ink-50
            border border-ink-100
            px-2.5 py-1.5
          "
        >
          <IdCard size={13} className="text-ink-500" />

          <span className="font-mono text-xs font-semibold text-ink-700">
            {student.admissionId}
          </span>
        </div>
      </td>

      <td
        className="px-4 py-4 cursor-pointer"
        onClick={onOpen}
      >
        <div className="max-w-[180px]">

          <p className="font-medium text-ink-800 truncate">
            {courseName(student.course)}
          </p>

          <p className="text-xs text-ink-500 mt-1 truncate">
            {batchName(student.batch)}
          </p>

        </div>
      </td>

      <td
        className="px-4 py-4 cursor-pointer"
        onClick={onOpen}
      >
        <div className="flex items-center gap-2 text-ink-700">
          <Phone
            size={14}
            className="text-ink-400"
          />
          <span>{student.phone || '-'}</span>
        </div>

        {student.email && (
          <div className="flex items-center gap-2 text-xs text-ink-500 mt-1">
            <Mail
              size={12}
              className="text-ink-400"
            />
            <span className="truncate max-w-[180px]">
              {student.email}
            </span>
          </div>
        )}
      </td>

      <td className="px-4 py-4">
        {renderStatusBadge(
          student.admissionStatus
        )}
      </td>

      <td className="px-5 py-4">

        <div className="flex items-center justify-end gap-1">

          <button
            className="
              w-9 h-9
              rounded-lg
              border border-ink-200
              text-ink-600
              flex items-center justify-center
              hover:bg-ink-950
              hover:text-white
              hover:border-ink-950
              transition
            "
            onClick={onOpen}
            title="View student"
          >
            <Eye size={15} />
          </button>

          {['admin', 'branch_manager'].includes(
            user?.role
          ) && (
            <button
              className="
                w-9 h-9
                rounded-lg
                border border-red-100
                text-red-500
                flex items-center justify-center
                hover:bg-red-50
                transition
              "
              onClick={onDelete}
              title="Deactivate student"
            >
              <Trash2 size={15} />
            </button>
          )}

        </div>

      </td>

    </tr>
  );
}

/* ═══════════════════════════════════════════════
   MOBILE CARD
═══════════════════════════════════════════════ */

function MobileStudentCard({
  student,
  selected,
  onSelect,
  onOpen,
  onDelete,
  user,
  renderStatusBadge,
  courseName,
  batchName,
}) {
  return (
    <div
      className={`
        rounded-2xl
        border
        bg-white
        overflow-hidden
        transition-all
        ${
          selected
            ? 'border-ink-950 ring-2 ring-ink-100'
            : 'border-ink-100'
        }
        shadow-[0_5px_20px_rgba(15,23,42,0.05)]
      `}
    >

      <div className="p-4">

        <div className="flex items-start gap-3">

          <input
            type="checkbox"
            className="w-4 h-4 mt-2 accent-black shrink-0"
            checked={selected}
            onChange={onSelect}
            onClick={(e) => e.stopPropagation()}
          />

          <button
            className="flex items-center gap-3 text-left min-w-0 flex-1"
            onClick={onOpen}
          >

            <StudentAvatar
              student={student}
              size="md"
            />

            <div className="min-w-0 flex-1">

              <div className="flex items-center gap-2 flex-wrap">

                <p className="font-bold text-ink-950 truncate">
                  {student.name}
                </p>

                {renderStatusBadge(
                  student.admissionStatus
                )}

              </div>

              <div className="flex items-center gap-2 mt-1.5">

                <span className="font-mono text-[11px] text-ink-500">
                  {student.admissionId}
                </span>

              </div>

            </div>

          </button>

          <button
            className="
              p-1.5
              rounded-lg
              text-ink-400
              hover:bg-ink-50
              shrink-0
            "
            onClick={onOpen}
          >
            <MoreVertical size={17} />
          </button>

        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">

          <InfoChip
            icon={<BookOpen size={14} />}
            label="Course"
            value={courseName(
              student.course
            )}
          />

          <InfoChip
            icon={<Layers size={14} />}
            label="Batch"
            value={batchName(
              student.batch
            )}
          />

          <InfoChip
            icon={<Phone size={14} />}
            label="Phone"
            value={student.phone || '-'}
          />

          <InfoChip
            icon={<Calendar size={14} />}
            label="DOB"
            value={
              student.dob
                ? new Date(
                    student.dob
                  ).toLocaleDateString(
                    'en-IN'
                  )
                : '-'
            }
          />

        </div>

      </div>

      <div
        className="
          border-t border-ink-100
          px-4 py-2.5
          flex items-center justify-between
          bg-ink-50/50
        "
      >

        <button
          className="
            text-xs
            font-semibold
            text-ink-700
            hover:text-ink-950
            flex items-center gap-1.5
          "
          onClick={onOpen}
        >
          <Eye size={14} />
          View Profile
        </button>

        {['admin', 'branch_manager'].includes(
          user?.role
        ) && (
          <button
            className="
              text-xs
              font-semibold
              text-red-500
              hover:text-red-700
              flex items-center gap-1.5
            "
            onClick={onDelete}
          >
            <Trash2 size={14} />
            Deactivate
          </button>
        )}

      </div>

    </div>
  );
}

/* ═══════════════════════════════════════════════
   INFO CHIP
═══════════════════════════════════════════════ */

function InfoChip({ icon, label, value }) {
  return (
    <div
      className="
        rounded-xl
        bg-ink-50/80
        border border-ink-100
        px-3 py-2
        min-w-0
      "
    >

      <div className="flex items-center gap-2">

        <span className="text-ink-400">
          {icon}
        </span>

        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-wider font-bold text-ink-400">
            {label}
          </p>

          <p className="text-xs font-semibold text-ink-800 truncate mt-0.5">
            {value}
          </p>
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   STUDENT AVATAR
═══════════════════════════════════════════════ */

function StudentAvatar({ student, size = 'md' }) {
  const sizes = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-24 h-24 sm:w-28 sm:h-28 text-3xl',
  };

  return student?.photoUrl ? (
    <img
      src={student.photoUrl}
      alt={student.name || 'Student'}
      className={`
        ${sizes[size]}
        rounded-2xl
        object-cover
        border-2 border-white
        shadow-md
        shrink-0
      `}
    />
  ) : (
    <div
      className={`
        ${sizes[size]}
        rounded-2xl
        bg-gradient-to-br
        from-ink-900
        to-ink-700
        text-white
        flex items-center justify-center
        font-bold
        shadow-md
        shrink-0
      `}
    >
      {student?.name?.charAt(0)?.toUpperCase() || (
        <User size={size === 'lg' ? 38 : 18} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   STUDENT VIEW
═══════════════════════════════════════════════ */

function StudentView({
  student,
  renderStatusBadge,
  courseName,
  batchName,
  branchName,
}) {
  return (
    <div className="space-y-4 sm:space-y-5">

      {/* Profile Hero */}

      <div
        className="
          relative
          overflow-hidden
          rounded-3xl
          bg-ink-950
          text-white
          p-5 sm:p-7
          shadow-xl
        "
      >

        <div
          className="
            absolute
            -right-20
            -top-20
            w-56 h-56
            rounded-full
            bg-white/5
          "
        />

        <div
          className="
            absolute
            -left-16
            -bottom-24
            w-48 h-48
            rounded-full
            bg-white/5
          "
        />

        <div
          className="
            relative
            flex
            flex-col
            sm:flex-row
            gap-5
            sm:items-center
          "
        >

          <StudentAvatar
            student={student}
            size="lg"
          />

          <div className="min-w-0 flex-1">

            <div className="flex flex-wrap items-center gap-2 mb-2">
              {renderStatusBadge(
                student.admissionStatus
              )}

              {student.documents?.length > 0 && (
                <span
                  className="
                    inline-flex
                    items-center
                    gap-1
                    px-2.5 py-1
                    rounded-full
                    bg-white/10
                    border border-white/10
                    text-[11px]
                    font-medium
                  "
                >
                  <FileText size={11} />
                  {student.documents.length}{' '}
                  Documents
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold truncate">
              {student.name}
            </h1>

            <p className="text-sm text-white/60 mt-1">
              Admission ID
            </p>

            <p className="font-mono text-sm sm:text-base font-semibold mt-0.5">
              {student.admissionId}
            </p>

            <div className="flex flex-wrap gap-2 mt-4">

              <HeroPill
                icon={<BookOpen size={13} />}
                text={courseName(
                  student.course
                )}
              />

              <HeroPill
                icon={<Layers size={13} />}
                text={batchName(
                  student.batch
                )}
              />

            </div>

          </div>

        </div>

      </div>

      {/* Personal */}

      <ProfileSection
        icon={<UserRound size={17} />}
        title="Personal Information"
      >

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          <InfoCard
            label="Student Name"
            value={student.name}
            icon={<User size={15} />}
          />

          <InfoCard
            label="Father's Name"
            value={
              student.fatherName || '-'
            }
            icon={<User size={15} />}
          />

          <InfoCard
            label="Date of Birth"
            value={
              student.dob
                ? new Date(
                    student.dob
                  ).toLocaleDateString(
                    'en-IN'
                  )
                : '-'
            }
            icon={<Calendar size={15} />}
          />

          <InfoCard
            label="Gender"
            value={
              student.gender
                ? student.gender
                    .charAt(0)
                    .toUpperCase() +
                  student.gender.slice(1)
                : '-'
            }
            icon={<User size={15} />}
          />

        </div>

      </ProfileSection>

      {/* Contact */}

      <ProfileSection
        icon={<Phone size={17} />}
        title="Contact Information"
      >

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          <InfoCard
            label="Phone"
            value={student.phone || '-'}
            icon={<Phone size={15} />}
          />

          <InfoCard
            label="Alternate Phone"
            value={
              student.altPhone || '-'
            }
            icon={<Phone size={15} />}
          />

          <InfoCard
            label="Email"
            value={student.email || '-'}
            icon={<Mail size={15} />}
          />

          <InfoCard
            label="Address"
            value={student.address || '-'}
            icon={<MapPin size={15} />}
          />

        </div>

      </ProfileSection>

      {/* Academic */}

      <ProfileSection
        icon={<GraduationCap size={17} />}
        title="Academic Information"
      >

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          <InfoCard
            label="Course"
            value={courseName(
              student.course
            )}
            icon={<BookOpen size={15} />}
          />

          <InfoCard
            label="Batch"
            value={batchName(
              student.batch
            )}
            icon={<Layers size={15} />}
          />

          <InfoCard
            label="Branch"
            value={branchName(
              student.branch
            )}
            icon={<Building2 size={15} />}
          />

          <InfoCard
            label="Lead Source"
            value={
              student.leadSource?.name ||
              student.leadSource ||
              '-'
            }
            icon={<Tag size={15} />}
          />

        </div>

      </ProfileSection>

      {/* Fees */}

      <ProfileSection
        icon={<IndianRupee size={17} />}
        title="Fee Information"
      >

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          <FeeCard
            label="Total Fee"
            value={student.totalFee}
          />

          <FeeCard
            label="Discount"
            value={student.discount}
          />

          <FeeCard
            label="Final Fee"
            value={Math.max(
              0,
              Number(student.totalFee || 0) -
                Number(student.discount || 0)
            )}
          />

        </div>

      </ProfileSection>

      {/* Documents */}

      <ProfileSection
        icon={<FileText size={17} />}
        title="Documents"
        count={
          student.documents?.length || 0
        }
      >

        {student.documents?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {student.documents.map((doc) => (
              <a
                key={doc._id}
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="
                  group
                  rounded-2xl
                  border border-ink-100
                  bg-white
                  p-4
                  flex items-center gap-3
                  hover:border-ink-300
                  hover:shadow-md
                  transition
                "
              >

                <div
                  className="
                    w-10 h-10
                    rounded-xl
                    bg-ink-950
                    text-white
                    flex items-center justify-center
                    shrink-0
                  "
                >
                  <FileText size={17} />
                </div>

                <div className="min-w-0 flex-1">

                  <p className="text-sm font-semibold text-ink-900 truncate">
                    {doc.name}
                  </p>

                  <p className="text-xs text-ink-500 mt-0.5">
                    Open document
                  </p>

                </div>

                <ExternalLink
                  size={15}
                  className="
                    text-ink-400
                    group-hover:text-ink-900
                  "
                />

              </a>
            ))}

          </div>
        ) : (
          <div
            className="
              rounded-2xl
              border border-dashed
              border-ink-200
              bg-white
              p-6
              text-center
            "
          >
            <FileText
              size={28}
              className="mx-auto text-ink-300"
            />

            <p className="text-sm font-medium text-ink-700 mt-2">
              No documents uploaded
            </p>

            <p className="text-xs text-ink-500 mt-1">
              Documents can be added while editing
              the student.
            </p>
          </div>
        )}

      </ProfileSection>

      {/* ID Card */}

      <div
        className="
          rounded-2xl
          border border-ink-100
          bg-white
          p-4
          flex items-center gap-3
          shadow-sm
        "
      >

        <div
          className="
            w-10 h-10
            rounded-xl
            bg-ink-50
            text-ink-700
            flex items-center justify-center
          "
        >
          <ShieldCheck size={18} />
        </div>

        <div className="min-w-0">

          <p className="text-xs text-ink-500">
            ID Card Expiry
          </p>

          <p className="text-sm font-semibold text-ink-900">
            {student.idCardExpiry
              ? new Date(
                  student.idCardExpiry
                ).toLocaleDateString('en-IN')
              : 'Not available'}
          </p>

        </div>

      </div>

    </div>
  );
}

/* ═══════════════════════════════════════════════
   EDIT FORM
═══════════════════════════════════════════════ */

function StudentEditForm({
  editForm,
  setEditForm,
  courses,
  batches,
  branches,
  user,
  selectedStudent,
  docName,
  setDocName,
  docUrl,
  setDocUrl,
  handleAddDocument,
  handleRemoveDocument,
  addingDocument,
}) {
  return (
    <div className="space-y-5">

      <ProfileSection
        icon={<UserRound size={17} />}
        title="Personal Information"
      >

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <FormField
            label="Student Name"
            required
          >
            <input
              className="input"
              required
              value={editForm.name || ''}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  name: e.target.value,
                })
              }
            />
          </FormField>

          <FormField label="Father's Name">
            <input
              className="input"
              value={
                editForm.fatherName || ''
              }
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  fatherName: e.target.value,
                })
              }
            />
          </FormField>

          <FormField label="Date of Birth">
            <input
              type="date"
              className="input"
              value={
                editForm.dob
                  ? editForm.dob.split('T')[0]
                  : ''
              }
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  dob: e.target.value,
                })
              }
            />
          </FormField>

          <FormField label="Gender">
            <select
              className="input"
              value={
                editForm.gender || 'male'
              }
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  gender: e.target.value,
                })
              }
            >
              <option value="male">
                Male
              </option>
              <option value="female">
                Female
              </option>
              <option value="other">
                Other
              </option>
            </select>
          </FormField>

        </div>

      </ProfileSection>

      <ProfileSection
        icon={<Phone size={17} />}
        title="Contact Information"
      >

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <FormField label="Phone">
            <input
              className="input"
              value={editForm.phone || ''}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  phone: e.target.value,
                })
              }
            />
          </FormField>

          <FormField label="Alternate Phone">
            <input
              className="input"
              value={
                editForm.altPhone || ''
              }
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  altPhone: e.target.value,
                })
              }
            />
          </FormField>

          <FormField label="Email">
            <input
              type="email"
              className="input"
              value={editForm.email || ''}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  email: e.target.value,
                })
              }
            />
          </FormField>

          <FormField label="Photo URL">
            <input
              className="input"
              placeholder="https://..."
              value={
                editForm.photoUrl || ''
              }
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  photoUrl: e.target.value,
                })
              }
            />
          </FormField>

          <div className="sm:col-span-2">
            <FormField label="Address">
              <textarea
                className="input min-h-[90px] resize-y"
                rows={3}
                value={
                  editForm.address || ''
                }
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    address: e.target.value,
                  })
                }
              />
            </FormField>
          </div>

        </div>

      </ProfileSection>

      <ProfileSection
        icon={<GraduationCap size={17} />}
        title="Academic Information"
      >

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {user?.role === 'admin' && (
            <FormField label="Branch">
              <select
                className="input"
                value={
                  editForm.branch?._id ||
                  editForm.branch ||
                  ''
                }
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
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
            </FormField>
          )}

          <FormField label="Course">
            <select
              className="input"
              value={
                editForm.course?._id ||
                editForm.course ||
                ''
              }
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  course: e.target.value,
                })
              }
            >
              <option value="">
                Select course
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
          </FormField>

          <FormField label="Batch">
            <select
              className="input"
              value={
                editForm.batch?._id ||
                editForm.batch ||
                ''
              }
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  batch: e.target.value,
                })
              }
            >
              <option value="">
                Unassigned
              </option>

              {batches.map((batch) => (
                <option
                  key={batch._id}
                  value={batch._id}
                >
                  {batch.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Admission Status">
            <select
              className="input"
              value={
                editForm.admissionStatus ||
                'confirmed'
              }
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  admissionStatus:
                    e.target.value,
                })
              }
            >
              {statusOptions.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status
                      .split('_')
                      .map(
                        (word) =>
                          word
                            .charAt(0)
                            .toUpperCase() +
                          word.slice(1)
                      )
                      .join(' ')}
                  </option>
                )
              )}
            </select>
          </FormField>

          <FormField label="Lead Source">
            <input
              className="input"
              placeholder="e.g. walk-in, referral"
              value={
                editForm.leadSource?.name ||
                editForm.leadSource ||
                ''
              }
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  leadSource: e.target.value,
                })
              }
            />
          </FormField>

        </div>

      </ProfileSection>

      <ProfileSection
        icon={<IndianRupee size={17} />}
        title="Fee Information"
      >

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <FormField label="Total Fee (₹)">
            <input
              type="number"
              min="0"
              className="input"
              value={editForm.totalFee || 0}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  totalFee:
                    parseFloat(
                      e.target.value
                    ) || 0,
                })
              }
            />
          </FormField>

          <FormField label="Discount (₹)">
            <input
              type="number"
              min="0"
              className="input"
              value={editForm.discount || 0}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  discount:
                    parseFloat(
                      e.target.value
                    ) || 0,
                })
              }
            />
          </FormField>

        </div>

        <div
          className="
            mt-4
            rounded-xl
            bg-ink-950
            text-white
            px-4 py-3
            flex items-center
            justify-between
          "
        >
          <span className="text-sm text-white/60">
            Final Fee
          </span>

          <span className="text-lg font-bold">
            ₹
            {Math.max(
              0,
              Number(editForm.totalFee || 0) -
                Number(editForm.discount || 0)
            ).toLocaleString('en-IN')}
          </span>
        </div>

      </ProfileSection>

      {/* Documents */}

      <ProfileSection
        icon={<FileText size={17} />}
        title="Documents"
        count={
          selectedStudent.documents?.length || 0
        }
      >

        {selectedStudent.documents?.length ? (
          <div className="space-y-2">

            {selectedStudent.documents.map(
              (doc) => (
                <div
                  key={doc._id}
                  className="
                    rounded-xl
                    border border-ink-100
                    bg-white
                    p-3
                    flex items-center gap-3
                  "
                >

                  <div
                    className="
                      w-9 h-9
                      rounded-lg
                      bg-ink-50
                      text-ink-700
                      flex items-center justify-center
                      shrink-0
                    "
                  >
                    <FileText size={16} />
                  </div>

                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="
                      min-w-0
                      flex-1
                      group
                    "
                  >
                    <p className="text-sm font-semibold text-ink-900 truncate group-hover:underline">
                      {doc.name}
                    </p>

                    <p className="text-xs text-ink-500 truncate">
                      {doc.url}
                    </p>
                  </a>

                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="
                      p-2
                      rounded-lg
                      text-ink-500
                      hover:bg-ink-50
                    "
                  >
                    <Eye size={15} />
                  </a>

                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveDocument(
                        doc._id
                      )
                    }
                    className="
                      p-2
                      rounded-lg
                      text-red-500
                      hover:bg-red-50
                    "
                  >
                    <X size={15} />
                  </button>

                </div>
              )
            )}

          </div>
        ) : (
          <p className="text-sm text-ink-500">
            No documents uploaded yet.
          </p>
        )}

        {/* Add document */}

        <div
          className="
            mt-4
            rounded-2xl
            border border-dashed
            border-ink-200
            bg-ink-50/60
            p-4
          "
        >

          <p className="text-sm font-semibold text-ink-900 mb-3">
            Add Document
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_auto] gap-2">

            <input
              className="input"
              value={docName}
              onChange={(e) =>
                setDocName(e.target.value)
              }
              placeholder="Document name"
            />

            <input
              className="input"
              value={docUrl}
              onChange={(e) =>
                setDocUrl(e.target.value)
              }
              placeholder="https://document-url..."
            />

            <button
              type="button"
              className="
                btn-primary
                justify-center
                min-h-[42px]
              "
              onClick={handleAddDocument}
              disabled={addingDocument}
            >
              {addingDocument ? (
                <Spinner />
              ) : (
                <Upload size={15} />
              )}

              <span>
                {addingDocument
                  ? 'Adding...'
                  : 'Add'}
              </span>
            </button>

          </div>

        </div>

      </ProfileSection>

    </div>
  );
}

/* ═══════════════════════════════════════════════
   PROFILE SECTION
═══════════════════════════════════════════════ */

function ProfileSection({
  icon,
  title,
  count,
  children,
}) {
  return (
    <section
      className="
        rounded-2xl
        border border-ink-100
        bg-white
        shadow-[0_5px_20px_rgba(15,23,42,0.04)]
        overflow-hidden
      "
    >

      <div
        className="
          px-4 sm:px-5
          py-3.5
          border-b border-ink-100
          flex items-center justify-between
          bg-gradient-to-r
          from-ink-50/70
          to-white
        "
      >

        <div className="flex items-center gap-2.5">

          <div
            className="
              w-8 h-8
              rounded-lg
              bg-ink-950
              text-white
              flex items-center justify-center
            "
          >
            {icon}
          </div>

          <h3 className="text-sm sm:text-base font-bold text-ink-950">
            {title}
          </h3>

        </div>

        {typeof count === 'number' && (
          <span
            className="
              min-w-7 h-7
              px-2
              rounded-full
              bg-ink-100
              text-ink-700
              text-xs
              font-bold
              flex items-center justify-center
            "
          >
            {count}
          </span>
        )}

      </div>

      <div className="p-4 sm:p-5">
        {children}
      </div>

    </section>
  );
}

/* ═══════════════════════════════════════════════
   INFO CARD
═══════════════════════════════════════════════ */

function InfoCard({
  label,
  value,
  icon,
}) {
  return (
    <div
      className="
        rounded-xl
        border border-ink-100
        bg-ink-50/50
        p-3
        flex gap-3
        min-w-0
      "
    >

      <div
        className="
          w-8 h-8
          rounded-lg
          bg-white
          border border-ink-100
          text-ink-500
          flex items-center justify-center
          shrink-0
        "
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider font-bold text-ink-400">
          {label}
        </p>

        <p className="text-sm font-semibold text-ink-900 break-words mt-0.5">
          {value || '-'}
        </p>
      </div>

    </div>
  );
}

/* ═══════════════════════════════════════════════
   FEE CARD
═══════════════════════════════════════════════ */

function FeeCard({ label, value }) {
  return (
    <div
      className="
        rounded-xl
        border border-ink-100
        bg-ink-50/50
        p-4
      "
    >

      <p className="text-[10px] uppercase tracking-wider font-bold text-ink-400">
        {label}
      </p>

      <p className="text-lg sm:text-xl font-bold text-ink-950 mt-1">
        ₹{Number(value || 0).toLocaleString('en-IN')}
      </p>

    </div>
  );
}

/* ═══════════════════════════════════════════════
   HERO PILL
═══════════════════════════════════════════════ */

function HeroPill({ icon, text }) {
  return (
    <span
      className="
        inline-flex
        items-center
        gap-1.5
        max-w-full
        px-3 py-1.5
        rounded-full
        bg-white/10
        border border-white/10
        text-xs
        text-white/80
        truncate
      "
    >
      {icon}
      <span className="truncate">
        {text}
      </span>
    </span>
  );
}

/* ═══════════════════════════════════════════════
   FORM SECTION
═══════════════════════════════════════════════ */

function FormSection({
  icon,
  title,
  description,
  children,
}) {
  return (
    <section
      className="
        rounded-2xl
        border border-ink-100
        bg-white
        overflow-hidden
        shadow-sm
      "
    >

      <div
        className="
          px-4 sm:px-5
          py-4
          border-b border-ink-100
          bg-gradient-to-r
          from-ink-50
          to-white
        "
      >

        <div className="flex items-center gap-3">

          <div
            className="
              w-9 h-9
              rounded-xl
              bg-ink-950
              text-white
              flex items-center justify-center
              shrink-0
            "
          >
            {icon}
          </div>

          <div>
            <h3 className="text-sm sm:text-base font-bold text-ink-950">
              {title}
            </h3>

            <p className="text-xs text-ink-500 mt-0.5">
              {description}
            </p>
          </div>

        </div>

      </div>

      <div className="p-4 sm:p-5">
        {children}
      </div>

    </section>
  );
}

/* ═══════════════════════════════════════════════
   FORM FIELD
═══════════════════════════════════════════════ */

function FormField({
  label,
  required = false,
  children,
}) {
  return (
    <div className="min-w-0">

      <label className="label">
        {label}
        {required && (
          <span className="text-red-500 ml-0.5">
            *
          </span>
        )}
      </label>

      {children}

    </div>
  );
}

/* ═══════════════════════════════════════════════
   RESPONSIVE MODAL
═══════════════════════════════════════════════ */

function ResponsiveModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  wide = false,
}) {
  if (!open) return null;

  return (
    <div
      className="
        fixed inset-0 z-[60]
        flex items-end sm:items-center
        justify-center
        bg-ink-950/50
        backdrop-blur-sm
        p-0 sm:p-4
      "
    >

      <div
        className={`
          bg-white
          w-full
          ${
            wide
              ? 'sm:max-w-4xl lg:max-w-5xl'
              : 'sm:max-w-md'
          }
          max-h-[94vh] sm:max-h-[92vh]
          rounded-t-3xl sm:rounded-3xl
          shadow-2xl
          overflow-hidden
          flex flex-col
          animate-[modalIn_.25s_ease-out]
        `}
      >

        {/* Header */}

        <div
          className="
            shrink-0
            px-4 sm:px-6
            py-4
            border-b border-ink-100
            flex items-start gap-3
          "
        >

          <div className="flex-1 min-w-0">

            <h3 className="text-base sm:text-lg font-bold text-ink-950">
              {title}
            </h3>

            {subtitle && (
              <p className="text-xs sm:text-sm text-ink-500 mt-1">
                {subtitle}
              </p>
            )}

          </div>

          <button
            onClick={onClose}
            className="
              p-2
              rounded-xl
              text-ink-500
              hover:text-ink-950
              hover:bg-ink-100
              transition
              shrink-0
            "
          >
            <X size={19} />
          </button>

        </div>

        {/* Content */}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </div>

      </div>

    </div>
  );
}

/* ═══════════════════════════════════════════════
   SKELETONS
═══════════════════════════════════════════════ */

function DesktopSkeleton() {
  return (
    <tr className="border-b border-ink-100">
      <td className="px-5 py-5">
        <div className="skeleton w-4 h-4 rounded" />
      </td>

      <td className="px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="skeleton w-10 h-10 rounded-xl" />

          <div className="space-y-2">
            <div className="skeleton w-32 h-3 rounded" />
            <div className="skeleton w-20 h-2 rounded" />
          </div>
        </div>
      </td>

      <td className="px-4 py-5">
        <div className="skeleton w-28 h-7 rounded-lg" />
      </td>

      <td className="px-4 py-5">
        <div className="skeleton w-32 h-3 rounded" />
      </td>

      <td className="px-4 py-5">
        <div className="space-y-2">
          <div className="skeleton w-24 h-3 rounded" />
          <div className="skeleton w-32 h-2 rounded" />
        </div>
      </td>

      <td className="px-4 py-5">
        <div className="skeleton w-20 h-7 rounded-full" />
      </td>

      <td className="px-5 py-5">
        <div className="flex justify-end">
          <div className="skeleton w-20 h-9 rounded-lg" />
        </div>
      </td>
    </tr>
  );
}

function MobileSkeleton() {
  return (
    <div
      className="
        rounded-2xl
        border border-ink-100
        bg-white
        p-4
      "
    >
      <div className="flex gap-3">

        <div className="skeleton w-4 h-4 rounded mt-2" />

        <div className="skeleton w-12 h-12 rounded-2xl" />

        <div className="flex-1 space-y-2">
          <div className="skeleton w-36 h-4 rounded" />
          <div className="skeleton w-24 h-2.5 rounded" />
        </div>

      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        <div className="skeleton h-12 rounded-xl" />
        <div className="skeleton h-12 rounded-xl" />
        <div className="skeleton h-12 rounded-xl" />
        <div className="skeleton h-12 rounded-xl" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SPINNER
═══════════════════════════════════════════════ */

function Spinner() {
  return (
    <span
      className="
        inline-block
        w-4 h-4
        rounded-full
        border-2
        border-current
        border-r-transparent
        animate-spin
      "
    />
  );
}