import React, { useEffect, useState } from 'react';
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

const statusOptions = ['enquiry', 'form_filled', 'documents_pending', 'confirmed', 'cancelled'];

export default function Students() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter & pagination
  const [filters, setFilters] = useState({
    search: '',
    branch: '',
    course: '',
    batch: '',
    status: '',
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailMode, setDetailMode] = useState('view'); // 'view' | 'edit'
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

  // Form states
  const [createForm, setCreateForm] = useState({
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
  });
  const [editForm, setEditForm] = useState({});

  // Document upload
  const [docName, setDocName] = useState('');
  const [docUrl, setDocUrl] = useState('');

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // ─── Load students ──────────────────────────────────────────
  const loadStudents = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      const res = await api.get('/students', { params });
      setStudents(res.data.students);
      setPagination({ total: res.data.total, pages: res.data.pages });
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [filters]);

  // Load dropdowns once
  useEffect(() => {
    api.get('/branches').then(({ data }) => setBranches(data.branches));
    api.get('/academics/courses').then(({ data }) => setCourses(data.courses));
    api.get('/academics/batches').then(({ data }) => setBatches(data.batches));
  }, []);

  // ─── Create student ─────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...createForm };
      if (user.role !== 'admin') delete payload.branch;
      await api.post('/students', payload);
      toast.success('Admission created');
      setCreateModalOpen(false);
      setCreateForm({
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
      });
      loadStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create admission');
    }
  };

  // ─── Detail drawer ──────────────────────────────────────────
  const openDetail = (student) => {
    setSelectedStudent(student);
    setEditForm({ ...student });
    setDetailMode('view');
    setDetailDrawerOpen(true);
    setDocName('');
    setDocUrl('');
  };

  const closeDetail = () => {
    setDetailDrawerOpen(false);
    setSelectedStudent(null);
    setDetailMode('view');
  };

  const handleEditToggle = () => {
    if (detailMode === 'view') {
      setDetailMode('edit');
      setEditForm({ ...selectedStudent });
    } else {
      // cancel edit: revert to view
      setDetailMode('view');
      setEditForm({ ...selectedStudent });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...editForm };
      // Remove fields that shouldn't be sent
      delete payload._id;
      delete payload.admissionId;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.__v;
      if (user.role !== 'admin') delete payload.branch;

      const res = await api.patch(`/students/${selectedStudent._id}`, payload);
      toast.success('Student updated');
      setSelectedStudent(res.data.student);
      setEditForm(res.data.student);
      setDetailMode('view');
      loadStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  // ─── Delete with custom confirmation ──────────────────────
  const confirmDelete = (student) => {
    setStudentToDelete(student);
    setConfirmDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;
    try {
      await api.delete(`/students/${studentToDelete._id}`);
      toast.success('Student deactivated');
      setConfirmDeleteOpen(false);
      setStudentToDelete(null);
      if (detailDrawerOpen) closeDetail();
      loadStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // ─── Document management ──────────────────────────────────
  const handleAddDocument = async () => {
    if (!docName || !docUrl) {
      toast.error('Document name and URL are required');
      return;
    }
    try {
      await api.post(`/students/${selectedStudent._id}/documents`, { name: docName, url: docUrl });
      toast.success('Document added');
      const res = await api.get(`/students/${selectedStudent._id}`);
      setSelectedStudent(res.data.student);
      setEditForm(res.data.student);
      setDocName('');
      setDocUrl('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add document');
    }
  };

  const handleRemoveDocument = async (docId) => {
    if (!window.confirm('Remove this document?')) return;
    try {
      await api.delete(`/students/${selectedStudent._id}/documents/${docId}`);
      toast.success('Document removed');
      const res = await api.get(`/students/${selectedStudent._id}`);
      setSelectedStudent(res.data.student);
      setEditForm(res.data.student);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove document');
    }
  };

  // ─── Bulk status ──────────────────────────────────────────
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
      await api.patch('/students/bulk/status', { studentIds: selectedIds, admissionStatus: bulkStatus });
      toast.success(`Updated ${selectedIds.length} students`);
      setSelectedIds([]);
      setBulkStatus('');
      loadStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk update failed');
    }
  };

  // ─── Pagination ────────────────────────────────────────────
  const goToPage = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // ─── Helpers ──────────────────────────────────────────────
  const renderStatusBadge = (status) => (
    <Badge tone={statusTone[status] || 'ink'}>{status.replace('_', ' ')}</Badge>
  );

  // ─── Render ───────────────────────────────────────────────
  return (
    <AppShell title="Students">
      <PageHeader
        title="Student Admissions"
        description="Search, admit and manage student profiles."
        action={
          <button className="btn-accent" onClick={() => setCreateModalOpen(true)}>
            <Plus size={16} /> New Admission
          </button>
        }
      />

      {/* Filters & Bulk Actions */}
      <div className="mb-4">
        <div
          className={`grid gap-3 items-end ${
            user.role === 'admin'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5'
          }`}
        >
          <div className="relative w-full">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-600"
            />
            <input
              className="input w-full pl-9"
              placeholder="Search by name, phone, ID"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value, page: 1 })
              }
            />
          </div>

          {user.role === 'admin' && (
            <select
              className="input w-full"
              value={filters.branch}
              onChange={(e) =>
                setFilters({ ...filters, branch: e.target.value, page: 1 })
              }
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          <select
            className="input w-full"
            value={filters.course}
            onChange={(e) =>
              setFilters({ ...filters, course: e.target.value, page: 1 })
            }
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="input w-full"
            value={filters.batch}
            onChange={(e) =>
              setFilters({ ...filters, batch: e.target.value, page: 1 })
            }
          >
            <option value="">All Batches</option>
            {batches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            className="input w-full"
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value, page: 1 })
            }
          >
            <option value="">All Status</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>

          {selectedIds.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center lg:justify-end">
              <span className="text-sm text-ink-600 whitespace-nowrap">
                {selectedIds.length} selected
              </span>

              <select
                className="input flex-1 min-w-[170px]"
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
              >
                <option value="">Change status...</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>

              <button className="btn-primary" onClick={handleBulkStatus}>
                Apply
              </button>

              <button
                className="btn-outline"
                onClick={() => {
                  setSelectedIds([]);
                  setBulkStatus('');
                }}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8 text-ink-600">Loading...</div>
      ) : students.length === 0 ? (
        <EmptyState title="No students found" description="Try adjusting filters or add a new admission." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-ink-600 border-b border-ink-100">
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(students.map((s) => s._id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    checked={selectedIds.length === students.length && students.length > 0}
                  />
                </th>
                <th className="px-4 py-3">Admission ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr
                  key={s._id}
                  className="border-b border-ink-100 last:border-0 hover:bg-ink-50 cursor-pointer transition-colors duration-150"
                  onClick={() => openDetail(s)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(s._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds([...selectedIds, s._id]);
                        } else {
                          setSelectedIds(selectedIds.filter((id) => id !== s._id));
                        }
                      }}
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-700">{s.admissionId}</td>
                  <td className="px-4 py-3 font-medium text-ink-950">{s.name}</td>
                  <td className="px-4 py-3 text-ink-700">{s.course?.name}</td>
                  <td className="px-4 py-3 text-ink-700">{s.phone}</td>
                  <td className="px-4 py-3">{renderStatusBadge(s.admissionStatus)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-ink-600">
              Showing {students.length} of {pagination.total}
            </span>
            <div className="flex gap-1">
              <button
                className="btn-outline text-sm"
                disabled={filters.page <= 1}
                onClick={() => goToPage(filters.page - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 text-ink-700">
                Page {filters.page} of {pagination.pages || 1}
              </span>
              <button
                className="btn-outline text-sm"
                disabled={filters.page >= pagination.pages}
                onClick={() => goToPage(filters.page + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CREATE MODAL ────────────────────────────────────── */}
      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="New Admission" wide>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Student Name *</label>
            <input
              className="input"
              required
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Father's Name</label>
            <input
              className="input"
              value={createForm.fatherName}
              onChange={(e) => setCreateForm({ ...createForm, fatherName: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Date of Birth</label>
            <input
              type="date"
              className="input"
              value={createForm.dob}
              onChange={(e) => setCreateForm({ ...createForm, dob: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Gender</label>
            <select
              className="input"
              value={createForm.gender}
              onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Phone *</label>
            <input
              className="input"
              required
              value={createForm.phone}
              onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Alternate Phone</label>
            <input
              className="input"
              value={createForm.altPhone}
              onChange={(e) => setCreateForm({ ...createForm, altPhone: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Photo URL</label>
            <input
              className="input"
              placeholder="https://..."
              value={createForm.photoUrl}
              onChange={(e) => setCreateForm({ ...createForm, photoUrl: e.target.value })}
            />
          </div>
          {user.role === 'admin' && (
            <div>
              <label className="label">Branch *</label>
              <select
                className="input"
                required
                value={createForm.branch}
                onChange={(e) => setCreateForm({ ...createForm, branch: e.target.value })}
              >
                <option value="">Select branch</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Course *</label>
            <select
              className="input"
              required
              value={createForm.course}
              onChange={(e) => setCreateForm({ ...createForm, course: e.target.value })}
            >
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Batch</label>
            <select
              className="input"
              value={createForm.batch}
              onChange={(e) => setCreateForm({ ...createForm, batch: e.target.value })}
            >
              <option value="">Unassigned</option>
              {batches.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Total Fee (₹)</label>
            <input
              type="number"
              className="input"
              value={createForm.totalFee}
              onChange={(e) => setCreateForm({ ...createForm, totalFee: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="label">Discount (₹)</label>
            <input
              type="number"
              className="input"
              value={createForm.discount}
              onChange={(e) => setCreateForm({ ...createForm, discount: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="label">Admission Status</label>
            <select
              className="input"
              value={createForm.admissionStatus}
              onChange={(e) => setCreateForm({ ...createForm, admissionStatus: e.target.value })}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Lead Source</label>
            <input
              className="input"
              placeholder="e.g. walk-in, referral, ad"
              value={createForm.leadSource}
              onChange={(e) => setCreateForm({ ...createForm, leadSource: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Address</label>
            <textarea
              className="input"
              rows={2}
              value={createForm.address}
              onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
            />
          </div>
          <button className="btn-primary sm:col-span-2 mt-2">Create Admission</button>
        </form>
      </Modal>

      {/* ─── DETAIL DRAWER ──────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ease-in-out ${
          detailDrawerOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${
            detailDrawerOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeDetail}
        />

        {/* Drawer panel */}
        <div
          className={`absolute right-0 top-0 h-full w-full max-w-4xl bg-white shadow-2xl transform transition-all duration-300 ease-out ${
            detailDrawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 bg-ink-50/50">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-ink-950">
                  {detailMode === 'view' ? 'Student Profile' : 'Edit Student'}
                </h2>
                {selectedStudent && renderStatusBadge(selectedStudent.admissionStatus)}
              </div>
              <div className="flex items-center gap-2">
                {detailMode === 'view' && (
                  <>
                    {['admin', 'branch_manager'].includes(user.role) && (
                      <button
                        className="btn-primary text-sm w-auto"
                        onClick={handleEditToggle}
                      >
                        <Pencil size={16} /> Edit
                      </button>
                    )}
              
                    {['admin', 'branch_manager'].includes(user.role) && (
                      <button
                        className="btn-outline-danger w-auto text-sm"
                        onClick={() => confirmDelete(selectedStudent)}
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    )}
                  </>
                )}
                {detailMode === 'edit' && (
                  <>
                    <button className="btn-outline text-sm" onClick={handleEditToggle}>
                      Cancel
                    </button>
                    <button className="btn-primary text-sm" onClick={handleUpdate}>
                      <Pencil size={16} /> Save Changes
                    </button>
                  </>
                )}
                <button
                  className="p-2 text-ink-500 hover:text-ink-800 rounded-full hover:bg-ink-100 transition-colors"
                  onClick={closeDetail}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Body – conditional view / edit */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedStudent && (
                <form onSubmit={handleUpdate}>
                  {detailMode === 'view' ? (
                    // ── VIEW MODE ──
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Photo */}
                        <div className="flex flex-col items-center md:items-start">
                          {selectedStudent.photoUrl ? (
                            <img
                              src={selectedStudent.photoUrl}
                              alt={selectedStudent.name}
                              className="w-32 h-32 rounded-full object-cover border-2 border-ink-200"
                            />
                          ) : (
                            <div className="w-32 h-32 rounded-full bg-ink-100 flex items-center justify-center">
                              <User size={48} className="text-ink-400" />
                            </div>
                          )}
                          <div className="mt-2 text-center md:text-left">
                            <p className="text-sm text-ink-600">Admission ID: <span className="font-mono">{selectedStudent.admissionId}</span></p>
                            <p className="text-sm text-ink-600">ID Card Expiry: {selectedStudent.idCardExpiry ? new Date(selectedStudent.idCardExpiry).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <InfoItem label="Name" value={selectedStudent.name} icon={<User size={16} />} />
                          <InfoItem label="Father's Name" value={selectedStudent.fatherName} icon={<User size={16} />} />
                          <InfoItem label="Date of Birth" value={selectedStudent.dob ? new Date(selectedStudent.dob).toLocaleDateString() : '-'} icon={<Calendar size={16} />} />
                          <InfoItem label="Gender" value={selectedStudent.gender} icon={<User size={16} />} />
                          <InfoItem label="Phone" value={selectedStudent.phone} icon={<Phone size={16} />} />
                          <InfoItem label="Alternate Phone" value={selectedStudent.altPhone || '-'} icon={<Phone size={16} />} />
                          <InfoItem label="Email" value={selectedStudent.email || '-'} icon={<Mail size={16} />} />
                          <InfoItem label="Address" value={selectedStudent.address || '-'} icon={<MapPin size={16} />} />
                          <InfoItem label="Course" value={selectedStudent.course?.name} icon={<BookOpen size={16} />} />
                          <InfoItem label="Batch" value={selectedStudent.batch?.name || 'Unassigned'} icon={<Layers size={16} />} />
                          <InfoItem label="Total Fee" value={`₹${selectedStudent.totalFee}`} icon={<Tag size={16} />} />
                          <InfoItem label="Discount" value={`₹${selectedStudent.discount}`} icon={<Tag size={16} />} />
                          <InfoItem label="Lead Source" value={selectedStudent.leadSource?.name || '-'} icon={<Tag size={16} />} />
                        </div>
                      </div>

                      {/* Documents */}
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-ink-900 mb-3">Documents</h4>
                        {selectedStudent.documents?.length ? (
                          <ul className="space-y-1">
                            {selectedStudent.documents.map((doc) => (
                              <li key={doc._id} className="flex items-center justify-between text-sm">
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-marigold-600 hover:underline flex items-center gap-1"
                                >
                                  <Eye size={14} /> {doc.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-ink-500 text-sm">No documents uploaded</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    // ── EDIT MODE ──
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Editable fields */}
                        <div>
                          <label className="label">Student Name *</label>
                          <input
                            className="input"
                            required
                            value={editForm.name || ''}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="label">Father's Name</label>
                          <input
                            className="input"
                            value={editForm.fatherName || ''}
                            onChange={(e) => setEditForm({ ...editForm, fatherName: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="label">Date of Birth</label>
                          <input
                            type="date"
                            className="input"
                            value={editForm.dob ? editForm.dob.split('T')[0] : ''}
                            onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="label">Gender</label>
                          <select
                            className="input"
                            value={editForm.gender || 'male'}
                            onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="label">Phone</label>
                          <input
                            className="input"
                            value={editForm.phone || ''}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="label">Alternate Phone</label>
                          <input
                            className="input"
                            value={editForm.altPhone || ''}
                            onChange={(e) => setEditForm({ ...editForm, altPhone: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="label">Email</label>
                          <input
                            type="email"
                            className="input"
                            value={editForm.email || ''}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="label">Photo URL</label>
                          <input
                            className="input"
                            placeholder="https://..."
                            value={editForm.photoUrl || ''}
                            onChange={(e) => setEditForm({ ...editForm, photoUrl: e.target.value })}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="label">Address</label>
                          <textarea
                            className="input"
                            rows={2}
                            value={editForm.address || ''}
                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="label">Course</label>
                          <select
                            className="input"
                            value={editForm.course?._id || editForm.course || ''}
                            onChange={(e) => setEditForm({ ...editForm, course: e.target.value })}
                          >
                            <option value="">Select course</option>
                            {courses.map((c) => (
                              <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="label">Batch</label>
                          <select
                            className="input"
                            value={editForm.batch?._id || editForm.batch || ''}
                            onChange={(e) => setEditForm({ ...editForm, batch: e.target.value })}
                          >
                            <option value="">Unassigned</option>
                            {batches.map((b) => (
                              <option key={b._id} value={b._id}>{b.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="label">Total Fee (₹)</label>
                          <input
                            type="number"
                            className="input"
                            value={editForm.totalFee || 0}
                            onChange={(e) => setEditForm({ ...editForm, totalFee: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <label className="label">Discount (₹)</label>
                          <input
                            type="number"
                            className="input"
                            value={editForm.discount || 0}
                            onChange={(e) => setEditForm({ ...editForm, discount: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <label className="label">Admission Status</label>
                          <select
                            className="input"
                            value={editForm.admissionStatus || 'confirmed'}
                            onChange={(e) => setEditForm({ ...editForm, admissionStatus: e.target.value })}
                          >
                            {statusOptions.map((s) => (
                              <option key={s} value={s}>{s.replace('_', ' ')}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="label">Lead Source</label>
                          <input
                            className="input"
                            placeholder="e.g. walk-in, referral"
                            value={editForm.leadSource || ''}
                            onChange={(e) => setEditForm({ ...editForm, leadSource: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Documents section with add/remove */}
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-ink-900 mb-3">Documents</h4>
                        {selectedStudent.documents?.length ? (
                          <ul className="space-y-1">
                            {selectedStudent.documents.map((doc) => (
                              <li key={doc._id} className="flex items-center justify-between text-sm">
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-marigold-600 hover:underline flex items-center gap-1"
                                >
                                  <Eye size={14} /> {doc.name}
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDocument(doc._id)}
                                  className="text-clay-500 hover:text-red-600"
                                >
                                  <X size={14} />
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-ink-500 text-sm">No documents uploaded</p>
                        )}
                        <div className="flex flex-wrap items-end gap-2 mt-3">
                          <div className="flex-1 min-w-[120px]">
                            <label className="label text-xs">Name</label>
                            <input
                              className="input text-sm"
                              value={docName}
                              onChange={(e) => setDocName(e.target.value)}
                              placeholder="e.g. Aadhaar"
                            />
                          </div>
                          <div className="flex-1 min-w-[150px]">
                            <label className="label text-xs">URL</label>
                            <input
                              className="input text-sm"
                              value={docUrl}
                              onChange={(e) => setDocUrl(e.target.value)}
                              placeholder="https://..."
                            />
                          </div>
                          <button
                            type="button"
                            className="btn-primary text-sm"
                            onClick={handleAddDocument}
                          >
                            <Upload size={14} /> Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── CONFIRM DELETE MODAL ──────────────────────────── */}
      <Modal
        open={confirmDeleteOpen}
        onClose={() => {
          setConfirmDeleteOpen(false);
          setStudentToDelete(null);
        }}
        title="Confirm Deactivation"
      >
        <p className="text-ink-700">
          Are you sure you want to deactivate <strong>{studentToDelete?.name}</strong>? This action can be reversed later.
        </p>
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="btn-outline"
            onClick={() => {
              setConfirmDeleteOpen(false);
              setStudentToDelete(null);
            }}
          >
            Cancel
          </button>
          <button className="btn-danger" onClick={handleDelete}>
            Deactivate
          </button>
        </div>
      </Modal>
    </AppShell>
  );
}

// ─── Helper Component ───────────────────────────────────────
const InfoItem = ({ label, value, icon }) => (
  <div className="flex items-start gap-2">
    <div className="mt-1 text-ink-500">{icon}</div>
    <div>
      <p className="text-xs text-ink-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-ink-950 font-medium">{value || '-'}</p>
    </div>
  </div>
);

// ─── Modal Component (if not already imported) ─────────────
const Modal = ({ open, onClose, title, children, wide = false }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm transition-opacity">
      <div
        className={`bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto ${
          wide ? 'w-full max-w-4xl' : 'w-full max-w-md'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
          <h3 className="text-lg font-semibold text-ink-950">{title}</h3>
          <button onClick={onClose} className="p-1 text-ink-500 hover:text-ink-800">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};