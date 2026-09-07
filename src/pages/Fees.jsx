import React, { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Receipt,
  Pencil,
  Trash2,
  Eye,
  X,
  Search,
  Calendar,
  Filter,
  User,
  Banknote,
  Building2,
  BookOpen,
  CreditCard,
  Clock,
  FileText,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import { PageHeader, Modal, Badge, EmptyState } from '../components/ui';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const statusTone = {
  enquiry: 'ink',
  form_filled: 'marigold',
  documents_pending: 'clay',
  confirmed: 'sage',
  cancelled: 'clay',
};

const modeTone = {
  cash: 'sage',
  bank_transfer: 'ink',
  upi: 'marigold',
};

export default function Fees() {
  const { user } = useAuth();
  const [tab, setTab] = useState('pending');

  // ── Data states ──
  const [pending, setPending] = useState([]);
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [branches, setBranches] = useState([]);

  // ── UI states ──
  const [loading, setLoading] = useState(false);

  // ── Filter states ──
  const [filters, setFilters] = useState({
    branch: '',
    course: '',
    paymentMode: '',
    dateFrom: '',
    dateTo: '',
    search: '',
  });

  // ── Modals ──
  const [payModal, setPayModal] = useState({ open: false, mode: 'create', data: null });
  const [detailModal, setDetailModal] = useState({ open: false, data: null, type: '' }); // type: 'pending' | 'payment'
  const [structModal, setStructModal] = useState({ open: false, mode: 'create', data: null });

  // ── Form states ──
  const [payForm, setPayForm] = useState({
    studentId: '',
    amountPaid: '',
    paymentMode: 'cash',
    transactionRef: '',
    remarks: '',
    installmentLabel: '',
  });
  const [structForm, setStructForm] = useState({
    name: '',
    course: '',
    branch: '',
    paymentFrequency: 'one_time',
    feeItems: [{ label: 'Tuition Fee', amount: '' }],
  });

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // ── Load data ──
  const load = async () => {
    setLoading(true);
    try {
      const [
        pendingRes,
        paymentsRes,
        studentsRes,
        coursesRes,
        branchesRes,
      ] = await Promise.all([
        api.get('/fees/pending'),
        api.get('/fees/payments'),
        api.get('/students', { params: { limit: 500 } }),
        api.get('/academics/courses'),
        api.get('/branches'),
      ]);
      setPending(pendingRes.data.pendingFees);
      setPayments(paymentsRes.data.payments);
      setStudents(studentsRes.data.students);
      setCourses(coursesRes.data.courses);
      setBranches(branchesRes.data.branches);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ── Reset forms ──
  const resetPayForm = () =>
    setPayForm({
      studentId: '',
      amountPaid: '',
      paymentMode: 'cash',
      transactionRef: '',
      remarks: '',
      installmentLabel: '',
    });

  const resetStructForm = () =>
    setStructForm({
      name: '',
      course: '',
      branch: '',
      paymentFrequency: 'one_time',
      feeItems: [{ label: 'Tuition Fee', amount: '' }],
    });

  // ── Payment CRUD ──
  const submitPayment = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...payForm };
      if (payModal.mode === 'create') {
        await api.post('/fees/payments', payload);
        toast.success('Payment recorded');
      } else {
        // Update: only allowed fields
        const updateData = {
          remarks: payForm.remarks,
          transactionRef: payForm.transactionRef,
          installmentLabel: payForm.installmentLabel,
        };
        if (user.role === 'admin') {
          updateData.amountPaid = payForm.amountPaid;
          updateData.paymentMode = payForm.paymentMode;
        }
        await api.patch(`/fees/payments/${payModal.data._id}`, updateData);
        toast.success('Payment updated');
      }
      setPayModal({ open: false, mode: 'create', data: null });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save payment');
    }
  };

  const deletePayment = async (id) => {
    if (!window.confirm('Delete this payment permanently?')) return;
    try {
      await api.delete(`/fees/payments/${id}`);
      toast.success('Payment deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete payment');
    }
  };

  // ── Open modals ──
  const openPayModal = (mode, data = null) => {
    if (mode === 'create') {
      resetPayForm();
      setPayModal({ open: true, mode: 'create', data: null });
    } else {
      setPayForm({
        studentId: data.student?._id || data.student || '',
        amountPaid: data.amountPaid || '',
        paymentMode: data.paymentMode || 'cash',
        transactionRef: data.transactionRef || '',
        remarks: data.remarks || '',
        installmentLabel: data.installmentLabel || '',
      });
      setPayModal({ open: true, mode: 'edit', data });
    }
  };

  const openDetailModal = (type, data) => {
    setDetailModal({ open: true, data, type });
  };

  const closeDetailModal = () => setDetailModal({ open: false, data: null, type: '' });

  // ── Helpers ──
  const canManagePayments = ['admin', 'branch_manager', 'staff'].includes(user.role);
  const canDeletePayments = user.role === 'admin';

  // ── Client‑side filtering ──
  const filterPending = useMemo(() => {
    return pending.filter((p) => {
      const studentName = p.student?.name?.toLowerCase() || '';
      const admissionId = p.student?.admissionId?.toLowerCase() || '';
      const search = filters.search.toLowerCase();
      const matchSearch = studentName.includes(search) || admissionId.includes(search);
      const matchBranch = filters.branch ? p.student?.branch?._id === filters.branch : true;
      const matchCourse = filters.course ? p.student?.course?._id === filters.course : true;
      return matchSearch && matchBranch && matchCourse;
    });
  }, [pending, filters]);

  const filterPayments = useMemo(() => {
    return payments.filter((p) => {
      const studentName = p.student?.name?.toLowerCase() || '';
      const admissionId = p.student?.admissionId?.toLowerCase() || '';
      const search = filters.search.toLowerCase();
      const matchSearch = studentName.includes(search) || admissionId.includes(search);
      const matchBranch = filters.branch ? p.branch?._id === filters.branch : true;
      const matchCourse = filters.course ? p.student?.course?._id === filters.course : true;
      const matchMode = filters.paymentMode ? p.paymentMode === filters.paymentMode : true;
      const paymentDate = new Date(p.paymentDate);
      const matchDateFrom = filters.dateFrom ? paymentDate >= new Date(filters.dateFrom) : true;
      const matchDateTo = filters.dateTo ? paymentDate <= new Date(filters.dateTo) : true;
      return matchSearch && matchBranch && matchCourse && matchMode && matchDateFrom && matchDateTo;
    });
  }, [payments, filters]);

  // ── Reset filters ──
  const resetFilters = () => {
    setFilters({
      branch: '',
      course: '',
      paymentMode: '',
      dateFrom: '',
      dateTo: '',
      search: '',
    });
  };

  // ── Render ──
  return (
    <AppShell title="Fee Management">
      {/* Tabs & Add button */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['pending', 'payments'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`btn capitalize ${tab === t ? 'bg-ink-800 text-white' : 'bg-white border border-ink-100 text-ink-700'}`}
          >
            {t === 'pending' ? 'Pending Fees' : 'Payment History'}
          </button>
        ))}
        <div className="flex-1" />
        {canManagePayments && (
          <button className="btn-accent" onClick={() => openPayModal('create')}>
            <Plus size={16} /> Record Payment
          </button>
        )}
      </div>

      {/* ─── FILTER BAR ─── */}
      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
      
          <div>
            <label className="label text-xs">Branch</label>
            <select
              className="input w-full"
              value={filters.branch}
              onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label text-xs">Course</label>
            <select
              className="input w-full"
              value={filters.course}
              onChange={(e) => setFilters({ ...filters, course: e.target.value })}
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          {tab === 'payments' && (
            <>
              <div>
                <label className="label text-xs">Payment Mode</label>
                <select
                  className="input w-full"
                  value={filters.paymentMode}
                  onChange={(e) => setFilters({ ...filters, paymentMode: e.target.value })}
                >
                  <option value="">All Modes</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                </select>
              </div>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="label text-xs">From Date</label>
                  <input
                    type="date"
                    className="input w-full"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  />
                </div>
                <div className="flex-1">
                  <label className="label text-xs">To Date</label>
                  <input
                    type="date"
                    className="input w-full"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  />
                </div>
                <button className="btn-outline text-sm px-3 py-2" onClick={resetFilters}>
                  <X size={16} />
                </button>
              </div>
            </>
          )}
          {tab === 'pending' && (
            <div className="flex items-end">
              <button className="btn-outline text-sm px-3 py-2" onClick={resetFilters}>
                <X size={16} /> Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ──────────── PENDING FEES ──────────── */}
      {tab === 'pending' &&
        (loading ? (
          <div className="text-center py-8 text-ink-600">Loading...</div>
        ) : filterPending.length === 0 ? (
          <EmptyState title="No pending fees" description="All active students are fully paid up." />
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-ink-600 border-b border-ink-100">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Total Fee</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Pending</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filterPending.map((p) => (
                  <tr
                    key={p.student._id}
                    className="border-b border-ink-100 last:border-0 hover:bg-ink-50 cursor-pointer"
                    onClick={() => openDetailModal('pending', p)}
                  >
                    <td className="px-4 py-3 font-medium text-ink-950">
                      {p.student.name}{' '}
                      <span className="text-ink-600 font-mono text-xs">({p.student.admissionId})</span>
                    </td>
                    <td className="px-4 py-3 text-ink-700">{p.course}</td>
                    <td className="px-4 py-3 text-ink-700">{p.branch}</td>
                    <td className="px-4 py-3 text-ink-700">₹{p.totalFee.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-sage-600">₹{p.paid.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 font-semibold text-clay-600">₹{p.pending.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        className="text-marigold-600 hover:text-marigold-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetailModal('pending', p);
                        }}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {/* ──────────── PAYMENTS ──────────── */}
      {tab === 'payments' &&
        (loading ? (
          <div className="text-center py-8 text-ink-600">Loading...</div>
        ) : filterPayments.length === 0 ? (
          <EmptyState title="No payments match filters" />
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-ink-600 border-b border-ink-100">
                  <th className="px-4 py-3">Receipt</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Collected By</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filterPayments.map((p) => (
                  <tr
                    key={p._id}
                    className="border-b border-ink-100 last:border-0 hover:bg-ink-50 cursor-pointer"
                    onClick={() => openDetailModal('payment', p)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-ink-700">{p.receiptNumber}</td>
                    <td className="px-4 py-3 font-medium text-ink-950">{p.student?.name}</td>
                    <td className="px-4 py-3 text-ink-700">₹{p.amountPaid.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <Badge tone={modeTone[p.paymentMode]}>{p.paymentMode.replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-4 py-3 text-ink-700">{p.branch?.name}</td>
                    <td className="px-4 py-3 text-ink-700">{p.collectedBy?.name}</td>
                    <td className="px-4 py-3 text-ink-700">{new Date(p.paymentDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <a
                          href={`${apiBase}/fees/payments/${p._id}/receipt`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-ink-800 hover:text-marigold-600"
                          title="Receipt PDF"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Receipt size={16} />
                        </a>
                        {/* {canManagePayments && (
                          <button
                            className="text-ink-800 hover:text-marigold-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              openPayModal('edit', p);
                            }}
                            title="Edit payment"
                          >
                            <Pencil size={16} />
                          </button>
                        )} */}
                        {/* {canDeletePayments && (
                          <button
                            className="text-ink-800 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePayment(p._id);
                            }}
                            title="Delete payment"
                          >
                            <Trash2 size={16} />
                          </button>
                        )} */}
                        <button
                          className="text-marigold-600 hover:text-marigold-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetailModal('payment', p);
                          }}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {/* ──────────── PAYMENT MODAL (Create/Edit) ──────────── */}
      <Modal
        open={payModal.open}
        onClose={() => setPayModal({ open: false, mode: 'create', data: null })}
        title={payModal.mode === 'create' ? 'Record Payment' : 'Edit Payment'}
      >
        <form onSubmit={submitPayment} className="space-y-3">
          <div>
            <label className="label">Student</label>
            <select
              className="input"
              required
              value={payForm.studentId}
              onChange={(e) => setPayForm({ ...payForm, studentId: e.target.value })}
              disabled={payModal.mode === 'edit' && !canManagePayments}
            >
              <option value="">Select student</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.admissionId})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Amount Paid (₹)</label>
            <input
              type="number"
              className="input"
              required
              value={payForm.amountPaid}
              onChange={(e) => setPayForm({ ...payForm, amountPaid: e.target.value })}
              disabled={payModal.mode === 'edit' && user.role !== 'admin'}
            />
            {payModal.mode === 'edit' && user.role !== 'admin' && (
              <p className="text-xs text-ink-500 mt-1">Only admin can change the amount.</p>
            )}
          </div>
          <div>
            <label className="label">Payment Mode</label>
            <select
              className="input"
              value={payForm.paymentMode}
              onChange={(e) => setPayForm({ ...payForm, paymentMode: e.target.value })}
              disabled={payModal.mode === 'edit' && user.role !== 'admin'}
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
            </select>
          </div>
          <div>
            <label className="label">Transaction Ref (optional)</label>
            <input
              className="input"
              value={payForm.transactionRef}
              onChange={(e) => setPayForm({ ...payForm, transactionRef: e.target.value })}
              disabled={payModal.mode === 'edit' && !canManagePayments}
            />
          </div>
          <div>
            <label className="label">Installment Label</label>
            <input
              className="input"
              placeholder="e.g. Installment 2 of 4"
              value={payForm.installmentLabel}
              onChange={(e) => setPayForm({ ...payForm, installmentLabel: e.target.value })}
              disabled={payModal.mode === 'edit' && !canManagePayments}
            />
          </div>
          <div>
            <label className="label">Remarks</label>
            <input
              className="input"
              value={payForm.remarks}
              onChange={(e) => setPayForm({ ...payForm, remarks: e.target.value })}
              disabled={payModal.mode === 'edit' && !canManagePayments}
            />
          </div>
          <button className="btn-primary w-full mt-2">
            {payModal.mode === 'create' ? 'Record Payment' : 'Update Payment'}
          </button>
        </form>
      </Modal>

      {/* ──────────── DETAIL MODAL ──────────── */}
      <Modal
        open={detailModal.open}
        onClose={closeDetailModal}
        title={detailModal.type === 'pending' ? 'Fee Details' : 'Payment Details'}
        wide
      >
        {detailModal.data && (
          <div className="space-y-4">
            {detailModal.type === 'pending' ? (
              // ── Pending Fee Detail ──
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailItem label="Student Name" value={detailModal.data.student?.name} icon={<User size={16} />} />
                <DetailItem label="Admission ID" value={detailModal.data.student?.admissionId} icon={<FileText size={16} />} />
                <DetailItem label="Phone" value={detailModal.data.student?.phone} icon={<User size={16} />} />
                <DetailItem label="Course" value={detailModal.data.course} icon={<BookOpen size={16} />} />
                <DetailItem label="Branch" value={detailModal.data.branch} icon={<Building2 size={16} />} />
                <DetailItem label="Total Fee" value={`₹${detailModal.data.totalFee.toLocaleString('en-IN')}`} icon={<Banknote size={16} />} />
                <DetailItem label="Discount" value={`₹${detailModal.data.discount.toLocaleString('en-IN')}`} icon={<CreditCard size={16} />} />
                <DetailItem label="Paid Amount" value={`₹${detailModal.data.paid.toLocaleString('en-IN')}`} icon={<CreditCard size={16} />} />
                <DetailItem label="Pending Amount" value={`₹${detailModal.data.pending.toLocaleString('en-IN')}`} icon={<CreditCard size={16} />} />
              </div>
            ) : (
              // ── Payment Detail ──
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailItem label="Receipt Number" value={detailModal.data.receiptNumber} icon={<Receipt size={16} />} />
                <DetailItem label="Student" value={detailModal.data.student?.name} icon={<User size={16} />} />
                <DetailItem label="Admission ID" value={detailModal.data.student?.admissionId} icon={<FileText size={16} />} />
                <DetailItem label="Phone" value={detailModal.data.student?.phone} icon={<User size={16} />} />
                <DetailItem label="Amount Paid" value={`₹${detailModal.data.amountPaid.toLocaleString('en-IN')}`} icon={<Banknote size={16} />} />
                <DetailItem label="Payment Mode" value={detailModal.data.paymentMode.replace('_', ' ')} icon={<CreditCard size={16} />} />
                <DetailItem label="Transaction Ref" value={detailModal.data.transactionRef || '—'} icon={<FileText size={16} />} />
                <DetailItem label="Installment Label" value={detailModal.data.installmentLabel || '—'} icon={<Clock size={16} />} />
                <DetailItem label="Branch" value={detailModal.data.branch?.name} icon={<Building2 size={16} />} />
                <DetailItem label="Collected By" value={detailModal.data.collectedBy?.name} icon={<User size={16} />} />
                <DetailItem label="Payment Date" value={new Date(detailModal.data.paymentDate).toLocaleString()} icon={<Calendar size={16} />} />
                <DetailItem label="Remarks" value={detailModal.data.remarks || '—'} icon={<FileText size={16} />} />
                <DetailItem label="Created At" value={new Date(detailModal.data.createdAt).toLocaleString()} icon={<Clock size={16} />} />
              </div>
            )}
          </div>
        )}
      </Modal>
    </AppShell>
  );
}

// ─── Helper Components ───────────────────────────────────────
const DetailItem = ({ label, value, icon }) => (
  <div className="flex items-start gap-2">
    <div className="mt-1 text-ink-500">{icon}</div>
    <div>
      <p className="text-xs text-ink-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-ink-950 font-medium">{value || '—'}</p>
    </div>
  </div>
);