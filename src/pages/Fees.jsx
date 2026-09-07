import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  IndianRupee,
  WalletCards,
  TrendingUp,
  RefreshCw,
  Download,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Layers,
  ShieldCheck,
} from 'lucide-react';

import AppShell from '../components/AppShell';
import { PageHeader, Modal, Badge, EmptyState } from '../components/ui';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

/* =========================================================
   CONSTANTS
========================================================= */

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

const modeLabel = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  upi: 'UPI',
};

const initialPayForm = {
  studentId: '',
  amountPaid: '',
  paymentMode: 'cash',
  transactionRef: '',
  remarks: '',
  installmentLabel: '',
};

const initialStructForm = {
  name: '',
  course: '',
  branch: '',
  paymentFrequency: 'one_time',
  feeItems: [{ label: 'Tuition Fee', amount: '' }],
};

/* =========================================================
   MAIN
========================================================= */

export default function Fees() {
  const { user } = useAuth();

  const [tab, setTab] = useState('pending');

  /* Data */
  const [pending, setPending] = useState([]);
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [branches, setBranches] = useState([]);

  /* UI */
  const [loading, setLoading] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] =
    useState(false);

  /* Receipt */
  const [generatingReceipt, setGeneratingReceipt] =
    useState(null);

  /* Filters */
  const [filters, setFilters] = useState({
    branch: '',
    course: '',
    paymentMode: '',
    dateFrom: '',
    dateTo: '',
    search: '',
  });

  /* Modals */
  const [payModal, setPayModal] = useState({
    open: false,
    mode: 'create',
    data: null,
  });

  const [detailModal, setDetailModal] = useState({
    open: false,
    data: null,
    type: '',
  });

  const [structModal, setStructModal] = useState({
    open: false,
    mode: 'create',
    data: null,
  });

  /* Forms */
  const [payForm, setPayForm] =
    useState(initialPayForm);

  const [structForm, setStructForm] =
    useState(initialStructForm);

  const [savingPayment, setSavingPayment] =
    useState(false);

  /* =========================================================
     LOAD
  ========================================================= */

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
        api.get('/students', {
          params: { limit: 500 },
        }),
        api.get('/academics/courses'),
        api.get('/branches'),
      ]);

      setPending(
        pendingRes.data.pendingFees || []
      );

      setPayments(
        paymentsRes.data.payments || []
      );

      setStudents(
        studentsRes.data.students || []
      );

      setCourses(
        coursesRes.data.courses || []
      );

      setBranches(
        branchesRes.data.branches || []
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Failed to load fee data'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* =========================================================
     HELPERS
  ========================================================= */

  const formatMoney = (amount) =>
    `₹${Number(amount || 0).toLocaleString(
      'en-IN'
    )}`;

  const formatDate = (date) => {
    if (!date) return '—';

    return new Date(date).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );
  };

  const formatDateTime = (date) => {
    if (!date) return '—';

    return new Date(date).toLocaleString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  };

  const formatMode = (mode) =>
    modeLabel[mode] ||
    String(mode || '')
      .replace('_', ' ')
      .replace(/\b\w/g, (c) =>
        c.toUpperCase()
      );

  const getCourseName = (course) => {
    if (!course) return '—';

    if (typeof course === 'object') {
      return course.name || '—';
    }

    return (
      courses.find(
        (item) => item._id === course
      )?.name || '—'
    );
  };

  const getBranchName = (branch) => {
    if (!branch) return '—';

    if (typeof branch === 'object') {
      return branch.name || '—';
    }

    return (
      branches.find(
        (item) => item._id === branch
      )?.name || '—'
    );
  };

  const getBatchName = (batch) => {
    if (!batch) return 'Unassigned';

    if (typeof batch === 'object') {
      return batch.name || 'Unassigned';
    }

    return 'Unassigned';
  };

  /* =========================================================
     FILTERING
  ========================================================= */

  const filterPending = useMemo(() => {
    return pending.filter((p) => {
      const studentName =
        p.student?.name?.toLowerCase() || '';

      const admissionId =
        p.student?.admissionId?.toLowerCase() ||
        '';

      const search =
        filters.search.toLowerCase();

      const matchSearch =
        studentName.includes(search) ||
        admissionId.includes(search);

      const matchBranch = filters.branch
        ? p.student?.branch?._id ===
          filters.branch
        : true;

      const matchCourse = filters.course
        ? p.student?.course?._id ===
          filters.course
        : true;

      return (
        matchSearch &&
        matchBranch &&
        matchCourse
      );
    });
  }, [pending, filters]);

  const filterPayments = useMemo(() => {
    return payments.filter((p) => {
      const studentName =
        p.student?.name?.toLowerCase() || '';

      const admissionId =
        p.student?.admissionId?.toLowerCase() ||
        '';

      const search =
        filters.search.toLowerCase();

      const matchSearch =
        studentName.includes(search) ||
        admissionId.includes(search);

      const matchBranch = filters.branch
        ? p.branch?._id === filters.branch
        : true;

      const matchCourse = filters.course
        ? p.student?.course?._id ===
          filters.course
        : true;

      const matchMode = filters.paymentMode
        ? p.paymentMode ===
          filters.paymentMode
        : true;

      const paymentDate = new Date(
        p.paymentDate
      );

      const matchDateFrom = filters.dateFrom
        ? paymentDate >=
          new Date(filters.dateFrom)
        : true;

      const matchDateTo = filters.dateTo
        ? paymentDate <=
          new Date(
            `${filters.dateTo}T23:59:59`
          )
        : true;

      return (
        matchSearch &&
        matchBranch &&
        matchCourse &&
        matchMode &&
        matchDateFrom &&
        matchDateTo
      );
    });
  }, [payments, filters]);

  /* =========================================================
     SUMMARY
  ========================================================= */

  const paymentSummary = useMemo(() => {
    const total = filterPayments.reduce(
      (sum, payment) =>
        sum + Number(payment.amountPaid || 0),
      0
    );

    const cash = filterPayments
      .filter((p) => p.paymentMode === 'cash')
      .reduce(
        (sum, p) =>
          sum + Number(p.amountPaid || 0),
        0
      );

    const upi = filterPayments
      .filter((p) => p.paymentMode === 'upi')
      .reduce(
        (sum, p) =>
          sum + Number(p.amountPaid || 0),
        0
      );

    const bank = filterPayments
      .filter(
        (p) => p.paymentMode === 'bank_transfer'
      )
      .reduce(
        (sum, p) =>
          sum + Number(p.amountPaid || 0),
        0
      );

    return {
      total,
      cash,
      upi,
      bank,
      count: filterPayments.length,
    };
  }, [filterPayments]);

  /* =========================================================
     RESET
  ========================================================= */

  const resetPayForm = () => {
    setPayForm({
      ...initialPayForm,
    });
  };

  const resetStructForm = () => {
    setStructForm({
      ...initialStructForm,
      feeItems: [
        {
          label: 'Tuition Fee',
          amount: '',
        },
      ],
    });
  };

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

  /* =========================================================
     PAYMENT CRUD
  ========================================================= */

  const submitPayment = async (e) => {
    e.preventDefault();

    setSavingPayment(true);

    try {
      const payload = {
        ...payForm,
      };

      if (payModal.mode === 'create') {
        const res = await api.post(
          '/fees/payments',
          payload
        );

        toast.success(
          'Payment recorded successfully'
        );

        /*
          Automatically download receipt
          after successful payment creation.
        */
        if (res.data?.payment) {
          setTimeout(() => {
            generateReceiptPDF(
              res.data.payment,
              'both'
            );
          }, 150);
        }
      } else {
        const updateData = {
          remarks: payForm.remarks,
          transactionRef:
            payForm.transactionRef,
          installmentLabel:
            payForm.installmentLabel,
        };

        if (user.role === 'admin') {
          updateData.amountPaid =
            payForm.amountPaid;

          updateData.paymentMode =
            payForm.paymentMode;
        }

        await api.patch(
          `/fees/payments/${payModal.data._id}`,
          updateData
        );

        toast.success('Payment updated');
      }

      setPayModal({
        open: false,
        mode: 'create',
        data: null,
      });

      load();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Could not save payment'
      );
    } finally {
      setSavingPayment(false);
    }
  };

  const deletePayment = async (id) => {
    if (
      !window.confirm(
        'Delete this payment permanently?'
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/fees/payments/${id}`
      );

      toast.success('Payment deleted');

      load();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Could not delete payment'
      );
    }
  };

  /* =========================================================
     MODALS
  ========================================================= */

  const openPayModal = (
    mode,
    data = null
  ) => {
    if (mode === 'create') {
      resetPayForm();

      setPayModal({
        open: true,
        mode: 'create',
        data: null,
      });

      return;
    }

    setPayForm({
      studentId:
        data.student?._id ||
        data.student ||
        '',
      amountPaid:
        data.amountPaid || '',
      paymentMode:
        data.paymentMode || 'cash',
      transactionRef:
        data.transactionRef || '',
      remarks:
        data.remarks || '',
      installmentLabel:
        data.installmentLabel || '',
    });

    setPayModal({
      open: true,
      mode: 'edit',
      data,
    });
  };

  const openDetailModal = (
    type,
    data
  ) => {
    setDetailModal({
      open: true,
      data,
      type,
    });
  };

  const closeDetailModal = () => {
    setDetailModal({
      open: false,
      data: null,
      type: '',
    });
  };

  /* =========================================================
     PERMISSIONS
  ========================================================= */

  const canManagePayments = [
    'admin',
    'branch_manager',
    'staff',
  ].includes(user.role);

  const canDeletePayments =
    user.role === 'admin';

  /* =========================================================
     PDF RECEIPT
  ========================================================= */

  const generateReceiptPDF = (
    payment,
    copy = 'both'
  ) => {
    if (!payment) {
      toast.error(
        'Payment information not available'
      );
      return;
    }

    try {
      setGeneratingReceipt(
        payment._id
      );

      const student =
        payment.student || {};

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const receiptNumber =
        payment.receiptNumber ||
        `SP-${payment._id?.slice(-8) || 'RECEIPT'}`;

      const studentName =
        student.name || 'Student';

      const admissionId =
        student.admissionId || '—';

      const branchName =
        payment.branch?.name ||
        getBranchName(student.branch);

      const courseName =
        student.course?.name ||
        getCourseName(student.course);

      const batchName =
        student.batch?.name ||
        getBatchName(student.batch);

      const phone =
        student.phone || '—';

      const paymentMode =
        formatMode(payment.paymentMode);

      const amount =
        Number(payment.amountPaid || 0);

      const paymentDate =
        formatDate(payment.paymentDate);

      const installment =
        payment.installmentLabel ||
        '—';

      const transactionRef =
        payment.transactionRef ||
        '—';

      const remarks =
        payment.remarks || '—';

      const collector =
        payment.collectedBy?.name ||
        'Success Point';

      const copies =
        copy === 'both'
          ? ['student', 'institute']
          : [copy];

      copies.forEach(
        (copyType, index) => {
          if (index > 0) {
            doc.addPage();
          }

          drawReceiptPage({
            doc,
            copyType,
            receiptNumber,
            studentName,
            admissionId,
            branchName,
            courseName,
            batchName,
            phone,
            paymentMode,
            amount,
            paymentDate,
            installment,
            transactionRef,
            remarks,
            collector,
          });
        }
      );

      const safeName =
        studentName
          .replace(/[^a-z0-9]/gi, '_')
          .replace(/_+/g, '_');

      doc.save(
        `SuccessPoint_Receipt_${receiptNumber}_${safeName}.pdf`
      );

      toast.success(
        'Receipt downloaded successfully'
      );
    } catch (err) {
      console.error(err);

      toast.error(
        'Could not generate receipt PDF'
      );
    } finally {
      setGeneratingReceipt(null);
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <AppShell title="Fee Management">

      <div className="space-y-5 pb-8">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <PageHeader
          title="Fee Management"
          description="Track pending fees, record payments and manage payment history."
          action={
            canManagePayments && (
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
                onClick={() =>
                  openPayModal('create')
                }
              >
                <Plus size={17} />
                Record Payment
              </button>
            )
          }
        />

        {/* =====================================================
            SUMMARY CARDS
        ===================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">

          <FeeSummaryCard
            icon={<Banknote size={19} />}
            title={
              tab === 'payments'
                ? 'Collected'
                : 'Pending Fees'
            }
            value={
              tab === 'payments'
                ? formatMoney(
                    paymentSummary.total
                  )
                : formatMoney(
                    filterPending.reduce(
                      (sum, item) =>
                        sum +
                        Number(
                          item.pending || 0
                        ),
                      0
                    )
                  )
            }
            subtitle={
              tab === 'payments'
                ? `${paymentSummary.count} transactions`
                : `${filterPending.length} students`
            }
          />

          <FeeSummaryCard
            icon={<WalletCards size={19} />}
            title="Cash"
            value={
              tab === 'payments'
                ? formatMoney(
                    paymentSummary.cash
                  )
                : formatMoney(0)
            }
            subtitle="Cash collections"
          />

          <FeeSummaryCard
            icon={<CreditCard size={19} />}
            title="UPI"
            value={
              tab === 'payments'
                ? formatMoney(
                    paymentSummary.upi
                  )
                : formatMoney(0)
            }
            subtitle="Digital collections"
          />

          <FeeSummaryCard
            icon={<TrendingUp size={19} />}
            title="Bank Transfer"
            value={
              tab === 'payments'
                ? formatMoney(
                    paymentSummary.bank
                  )
                : formatMoney(0)
            }
            subtitle="Bank collections"
          />

        </div>

        {/* =====================================================
            TABS
        ===================================================== */}

        <div
          className="
            flex
            flex-col sm:flex-row
            gap-3
            sm:items-center
            sm:justify-between
          "
        >

          <div
            className="
              p-1
              rounded-2xl
              bg-ink-100/80
              flex
              w-full sm:w-auto
            "
          >

            <button
              onClick={() =>
                setTab('pending')
              }
              className={`
                flex-1 sm:flex-none
                px-4 sm:px-5
                py-2.5
                rounded-xl
                text-sm
                font-semibold
                transition-all
                ${
                  tab === 'pending'
                    ? 'bg-white text-ink-950 shadow-sm'
                    : 'text-ink-500 hover:text-ink-900'
                }
              `}
            >
              Pending Fees
              {filterPending.length > 0 && (
                <span
                  className="
                    ml-2
                    px-1.5 py-0.5
                    rounded-full
                    bg-ink-100
                    text-[10px]
                  "
                >
                  {filterPending.length}
                </span>
              )}
            </button>

            <button
              onClick={() =>
                setTab('payments')
              }
              className={`
                flex-1 sm:flex-none
                px-4 sm:px-5
                py-2.5
                rounded-xl
                text-sm
                font-semibold
                transition-all
                ${
                  tab === 'payments'
                    ? 'bg-white text-ink-950 shadow-sm'
                    : 'text-ink-500 hover:text-ink-900'
                }
              `}
            >
              Payment History
              {filterPayments.length > 0 && (
                <span
                  className="
                    ml-2
                    px-1.5 py-0.5
                    rounded-full
                    bg-ink-100
                    text-[10px]
                  "
                >
                  {filterPayments.length}
                </span>
              )}
            </button>

          </div>

          <button
            className="
              hidden sm:flex
              items-center
              justify-center
              gap-2
              h-10
              px-4
              rounded-xl
              border border-ink-200
              bg-white
              text-sm
              font-medium
              text-ink-700
              hover:bg-ink-50
              transition
            "
            onClick={load}
          >
            <RefreshCw
              size={15}
              className={
                loading
                  ? 'animate-spin'
                  : ''
              }
            />
            Refresh
          </button>

        </div>

        {/* =====================================================
            FILTERS
        ===================================================== */}

        <div
          className="
            rounded-2xl
            border border-ink-100
            bg-white
            shadow-[0_8px_30px_rgba(15,23,42,0.05)]
            overflow-hidden
          "
        >

          <div
            className="
              px-4 sm:px-5
              py-3.5
              flex items-center
              justify-between
              border-b border-ink-100
              bg-ink-50/60
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
                <Filter size={15} />
              </div>

              <div>
                <p className="text-sm font-bold text-ink-950">
                  Search & Filters
                </p>

                <p className="hidden sm:block text-[11px] text-ink-500">
                  Narrow down payment records
                </p>
              </div>

            </div>

            <div className="flex items-center gap-2">

              <button
                className="
                  sm:hidden
                  p-2
                  rounded-lg
                  border border-ink-200
                  text-ink-600
                "
                onClick={() =>
                  setMobileFiltersOpen(
                    (prev) => !prev
                  )
                }
              >
                <Filter size={15} />
              </button>

              <button
                className="
                  p-2
                  rounded-lg
                  border border-ink-200
                  text-ink-500
                  hover:bg-white
                "
                onClick={resetFilters}
                title="Clear filters"
              >
                <X size={15} />
              </button>

            </div>

          </div>

          <div
            className={`
              p-4
              ${
                mobileFiltersOpen
                  ? 'block'
                  : 'hidden sm:block'
              }
            `}
          >

            <div
              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                lg:grid-cols-3
                xl:grid-cols-6
                gap-3
              "
            >

              {/* Search */}

              <div className="relative xl:col-span-2">

                <label className="label text-xs">
                  Search
                </label>

                <input
                  className="
                    input
                    w-full
                    pl-9
                    h-11
                    rounded-xl
                  "
                  placeholder="Student name or admission ID..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      search:
                        e.target.value,
                    })
                  }
                />

              </div>

              {/* Branch */}

              <FilterField label="Branch">

                <select
                  className="input w-full h-11 rounded-xl"
                  value={filters.branch}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      branch:
                        e.target.value,
                    })
                  }
                >
                  <option value="">
                    All Branches
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

              </FilterField>

              {/* Course */}

              <FilterField label="Course">

                <select
                  className="input w-full h-11 rounded-xl"
                  value={filters.course}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      course:
                        e.target.value,
                    })
                  }
                >
                  <option value="">
                    All Courses
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

              </FilterField>

              {tab === 'payments' && (
                <>
                  {/* Payment Mode */}

                  <FilterField label="Payment Mode">

                    <select
                      className="input w-full h-11 rounded-xl"
                      value={
                        filters.paymentMode
                      }
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          paymentMode:
                            e.target.value,
                        })
                      }
                    >
                      <option value="">
                        All Modes
                      </option>

                      <option value="cash">
                        Cash
                      </option>

                      <option value="bank_transfer">
                        Bank Transfer
                      </option>

                      <option value="upi">
                        UPI
                      </option>
                    </select>

                  </FilterField>

                  {/* From */}

                  <FilterField label="From Date">

                    <input
                      type="date"
                      className="input w-full h-11 rounded-xl"
                      value={
                        filters.dateFrom
                      }
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          dateFrom:
                            e.target.value,
                        })
                      }
                    />

                  </FilterField>

                  {/* To */}

                  <FilterField label="To Date">

                    <input
                      type="date"
                      className="input w-full h-11 rounded-xl"
                      value={
                        filters.dateTo
                      }
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          dateTo:
                            e.target.value,
                        })
                      }
                    />

                  </FilterField>
                </>
              )}

            </div>

          </div>
        </div>

        {/* =====================================================
            PENDING
        ===================================================== */}

        {tab === 'pending' && (
          <PendingSection
            loading={loading}
            data={filterPending}
            openDetail={openDetailModal}
            formatMoney={formatMoney}
          />
        )}

        {/* =====================================================
            PAYMENT HISTORY
        ===================================================== */}

        {tab === 'payments' && (
          <PaymentHistorySection
            loading={loading}
            data={filterPayments}
            openDetail={openDetailModal}
            generateReceiptPDF={
              generateReceiptPDF
            }
            generatingReceipt={
              generatingReceipt
            }
            deletePayment={
              deletePayment
            }
            canDeletePayments={
              canDeletePayments
            }
            formatMoney={formatMoney}
            formatDate={formatDate}
            formatMode={formatMode}
          />
        )}

      </div>

      {/* =====================================================
          PAYMENT MODAL
      ===================================================== */}

      <Modal
        open={payModal.open}
        onClose={() =>
          setPayModal({
            open: false,
            mode: 'create',
            data: null,
          })
        }
        title={
          payModal.mode === 'create'
            ? 'Record Payment'
            : 'Edit Payment'
        }
        wide
      >

        <form
          onSubmit={submitPayment}
          className="space-y-5"
        >

          <div
            className="
              rounded-2xl
              bg-ink-50
              border border-ink-100
              p-4
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
                "
              >
                <Receipt size={18} />
              </div>

              <div>
                <p className="text-sm font-bold text-ink-950">
                  {payModal.mode ===
                  'create'
                    ? 'New Payment Entry'
                    : 'Update Payment'}
                </p>

                <p className="text-xs text-ink-500 mt-0.5">
                  Record payment information
                  accurately for the receipt.
                </p>
              </div>

            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <FormField
              label="Student"
              required
            >
              <select
                className="input"
                required
                value={payForm.studentId}
                onChange={(e) =>
                  setPayForm({
                    ...payForm,
                    studentId:
                      e.target.value,
                  })
                }
                disabled={
                  payModal.mode ===
                    'edit' &&
                  !canManagePayments
                }
              >
                <option value="">
                  Select student
                </option>

                {students.map((student) => (
                  <option
                    key={student._id}
                    value={student._id}
                  >
                    {student.name} (
                    {student.admissionId})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Amount Paid (₹)"
              required
            >
              <div className="relative">

                <IndianRupee
                  size={15}
                  className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-ink-400
                  "
                />

                <input
                  type="number"
                  min="1"
                  className="input pl-9"
                  required
                  value={
                    payForm.amountPaid
                  }
                  onChange={(e) =>
                    setPayForm({
                      ...payForm,
                      amountPaid:
                        e.target.value,
                    })
                  }
                  disabled={
                    payModal.mode ===
                      'edit' &&
                    user.role !== 'admin'
                  }
                />

              </div>
            </FormField>

            <FormField label="Payment Mode">
              <select
                className="input"
                value={
                  payForm.paymentMode
                }
                onChange={(e) =>
                  setPayForm({
                    ...payForm,
                    paymentMode:
                      e.target.value,
                  })
                }
                disabled={
                  payModal.mode ===
                    'edit' &&
                  user.role !== 'admin'
                }
              >
                <option value="cash">
                  Cash
                </option>
                <option value="bank_transfer">
                  Bank Transfer
                </option>
                <option value="upi">
                  UPI
                </option>
              </select>
            </FormField>

            <FormField label="Transaction Reference">
              <input
                className="input"
                value={
                  payForm.transactionRef
                }
                onChange={(e) =>
                  setPayForm({
                    ...payForm,
                    transactionRef:
                      e.target.value,
                  })
                }
                placeholder="Optional transaction ID"
              />
            </FormField>

            <FormField label="Installment Label">
              <input
                className="input"
                value={
                  payForm.installmentLabel
                }
                onChange={(e) =>
                  setPayForm({
                    ...payForm,
                    installmentLabel:
                      e.target.value,
                  })
                }
                placeholder="e.g. Installment 2 of 4"
              />
            </FormField>

            <FormField label="Remarks">
              <input
                className="input"
                value={
                  payForm.remarks
                }
                onChange={(e) =>
                  setPayForm({
                    ...payForm,
                    remarks:
                      e.target.value,
                  })
                }
                placeholder="Optional remarks"
              />
            </FormField>

          </div>

          {payModal.mode === 'edit' &&
            user.role !== 'admin' && (
              <div
                className="
                  flex items-start gap-2
                  rounded-xl
                  bg-amber-50
                  border border-amber-100
                  p-3
                  text-xs text-amber-800
                "
              >
                <ShieldCheck
                  size={15}
                  className="mt-0.5 shrink-0"
                />

                <span>
                  Only admin can change
                  payment amount and payment
                  mode.
                </span>
              </div>
            )}

          <div
            className="
              flex
              flex-col-reverse sm:flex-row
              gap-2
              sm:justify-end
              border-t border-ink-100
              pt-4
            "
          >

            <button
              type="button"
              className="
                btn-outline
                w-full sm:w-auto
                justify-center
              "
              onClick={() =>
                setPayModal({
                  open: false,
                  mode: 'create',
                  data: null,
                })
              }
            >
              Cancel
            </button>

            <button
              className="
                btn-primary
                w-full sm:w-auto
                justify-center
                min-w-[160px]
              "
              disabled={savingPayment}
            >
              {savingPayment ? (
                <>
                  <Spinner />
                  Saving...
                </>
              ) : (
                <>
                  <Receipt size={16} />
                  {payModal.mode ===
                  'create'
                    ? 'Record Payment'
                    : 'Update Payment'}
                </>
              )}
            </button>

          </div>

        </form>

      </Modal>

      {/* =====================================================
          DETAIL MODAL
      ===================================================== */}

      <Modal
        open={detailModal.open}
        onClose={closeDetailModal}
        title={
          detailModal.type ===
          'pending'
            ? 'Fee Details'
            : 'Payment Details'
        }
        wide
      >

        {detailModal.data && (
          <div className="space-y-5">

            {detailModal.type ===
            'pending' ? (
              <PendingDetail
                data={
                  detailModal.data
                }
                formatMoney={
                  formatMoney
                }
              />
            ) : (
              <PaymentDetail
                data={
                  detailModal.data
                }
                formatMoney={
                  formatMoney
                }
                formatDateTime={
                  formatDateTime
                }
                formatMode={
                  formatMode
                }
                generateReceiptPDF={
                  generateReceiptPDF
                }
                generatingReceipt={
                  generatingReceipt
                }
              />
            )}

          </div>
        )}

      </Modal>

    </AppShell>
  );
}

/* =========================================================
   RECEIPT PAGE DESIGN
========================================================= */

function drawReceiptPage({
  doc,
  copyType,
  receiptNumber,
  studentName,
  admissionId,
  branchName,
  courseName,
  batchName,
  phone,
  paymentMode,
  amount,
  paymentDate,
  installment,
  transactionRef,
  remarks,
  collector,
}) {
  const pageWidth =
    doc.internal.pageSize.getWidth();

  const pageHeight =
    doc.internal.pageSize.getHeight();

  const margin = 14;

  /* Outer border */

  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.5);

  doc.roundedRect(
    margin,
    margin,
    pageWidth - margin * 2,
    pageHeight - margin * 2,
    4,
    4
  );

  /* Header */

  doc.setFillColor(15, 23, 42);

  doc.roundedRect(
    margin + 4,
    margin + 4,
    pageWidth - margin * 2 - 8,
    31,
    3,
    3,
    'F'
  );

  /* Logo box */

  doc.setFillColor(255, 255, 255);

  doc.roundedRect(
    margin + 10,
    margin + 10,
    19,
    19,
    3,
    3,
    'F'
  );

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);

  doc.text(
    'SP',
    margin + 19.5,
    margin + 23.5,
    {
      align: 'center',
    }
  );

  /* Institute */

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);

  doc.text(
    'SUCCESS POINT',
    margin + 36,
    margin + 16
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  doc.text(
    'EDUCATION & TRAINING',
    margin + 36,
    margin + 22
  );

  /* Copy */

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);

  doc.text(
    copyType === 'student'
      ? 'STUDENT COPY'
      : 'INSTITUTE COPY',
    pageWidth - margin - 12,
    margin + 16,
    {
      align: 'right',
    }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  doc.text(
    'OFFICIAL FEE RECEIPT',
    pageWidth - margin - 12,
    margin + 22,
    {
      align: 'right',
    }
  );

  /* Receipt meta */

  let y = 55;

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);

  doc.text(
    'FEE PAYMENT RECEIPT',
    margin + 6,
    y
  );

  doc.setFontSize(8);

  doc.setFont('helvetica', 'normal');

  doc.text(
    `Receipt No: ${receiptNumber}`,
    pageWidth - margin - 6,
    y,
    {
      align: 'right',
    }
  );

  y += 8;

  /* Student information */

  autoTable(doc, {
    startY: y,
    margin: {
      left: margin + 6,
      right: margin + 6,
    },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 3,
      lineColor: [226, 232, 240],
      lineWidth: 0.3,
      textColor: [15, 23, 42],
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: {
        cellWidth: 31,
        fontStyle: 'bold',
      },
      1: {
        cellWidth: 63,
      },
      2: {
        cellWidth: 31,
        fontStyle: 'bold',
      },
      3: {
        cellWidth: 'auto',
      },
    },
    body: [
      [
        'Student',
        studentName,
        'Admission ID',
        admissionId,
      ],
      [
        'Course',
        courseName,
        'Batch',
        batchName,
      ],
      [
        'Branch',
        branchName,
        'Phone',
        phone,
      ],
    ],
  });

  y =
    doc.lastAutoTable.finalY + 8;

  /* Payment details */

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);

  doc.text(
    'PAYMENT DETAILS',
    margin + 6,
    y
  );

  y += 3;

  autoTable(doc, {
    startY: y,
    margin: {
      left: margin + 6,
      right: margin + 6,
    },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 3.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.3,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: {
        cellWidth: 45,
        fontStyle: 'bold',
      },
      1: {
        cellWidth: 55,
      },
      2: {
        cellWidth: 45,
        fontStyle: 'bold',
      },
      3: {
        cellWidth: 'auto',
      },
    },
    body: [
      [
        'Payment Date',
        paymentDate,
        'Payment Mode',
        paymentMode,
      ],
      [
        'Installment',
        installment,
        'Transaction Ref',
        transactionRef,
      ],
      [
        'Collected By',
        collector,
        'Remarks',
        remarks,
      ],
    ],
  });

  y =
    doc.lastAutoTable.finalY + 10;

  /* Amount box */

  doc.setFillColor(248, 250, 252);

  doc.roundedRect(
    margin + 6,
    y,
    pageWidth - margin * 2 - 12,
    26,
    3,
    3,
    'F'
  );

  doc.setDrawColor(203, 213, 225);

  doc.roundedRect(
    margin + 6,
    y,
    pageWidth - margin * 2 - 12,
    26,
    3,
    3
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  doc.setTextColor(71, 85, 105);

  doc.text(
    'AMOUNT RECEIVED',
    margin + 13,
    y + 9
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);

  doc.setTextColor(15, 23, 42);

  doc.text(
    `₹${amount.toLocaleString('en-IN')}`,
    pageWidth - margin - 13,
    y + 16,
    {
      align: 'right',
    }
  );

  y += 37;

  /* Amount in words */

  const amountWords =
    numberToWordsIndian(amount);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  doc.setTextColor(71, 85, 105);

  doc.text(
    'Amount in Words',
    margin + 6,
    y
  );

  doc.setFont('helvetica', 'bold');

  doc.setTextColor(15, 23, 42);

  doc.text(
    `${amountWords} Rupees Only`,
    margin + 6,
    y + 5
  );

  y += 18;

  /* Thank you */

  doc.setFillColor(15, 23, 42);

  doc.roundedRect(
    margin + 6,
    y,
    pageWidth - margin * 2 - 12,
    18,
    3,
    3,
    'F'
  );

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);

  doc.text(
    'Thank you for choosing Success Point.',
    pageWidth / 2,
    y + 8,
    {
      align: 'center',
    }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  doc.text(
    'Please retain this receipt for your records.',
    pageWidth / 2,
    y + 13,
    {
      align: 'center',
    }
  );

  /* Signatures */

  const signY =
    pageHeight - 45;

  doc.setDrawColor(100, 116, 139);

  doc.line(
    margin + 14,
    signY,
    margin + 65,
    signY
  );

  doc.line(
    pageWidth - margin - 65,
    signY,
    pageWidth - margin - 14,
    signY
  );

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7.5);

  doc.text(
    'Student / Parent Signature',
    margin + 39.5,
    signY + 5,
    {
      align: 'center',
    }
  );

  doc.text(
    'Authorized Signature',
    pageWidth - margin - 39.5,
    signY + 5,
    {
      align: 'center',
    }
  );

  /* Footer */

  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);

  doc.text(
    'This is a computer-generated fee receipt.',
    pageWidth / 2,
    pageHeight - 20,
    {
      align: 'center',
    }
  );

  doc.text(
    `Success Point • ${copyType === 'student' ? 'Student Copy' : 'Institute Copy'}`,
    pageWidth / 2,
    pageHeight - 16,
    {
      align: 'center',
    }
  );
}

/* =========================================================
   NUMBER TO WORDS
========================================================= */

function numberToWordsIndian(num) {
  const number = Math.floor(
    Number(num || 0)
  );

  if (number === 0) return 'Zero';

  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];

  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  const twoDigits = (n) => {
    if (n < 20) return ones[n];

    return (
      tens[Math.floor(n / 10)] +
      (n % 10
        ? ` ${ones[n % 10]}`
        : '')
    );
  };

  const threeDigits = (n) => {
    if (n < 100) return twoDigits(n);

    return `${ones[Math.floor(n / 100)]} Hundred${
      n % 100
        ? ` ${twoDigits(n % 100)}`
        : ''
    }`;
  };

  let result = '';

  const crore = Math.floor(
    number / 10000000
  );

  const lakh = Math.floor(
    (number % 10000000) / 100000
  );

  const thousand = Math.floor(
    (number % 100000) / 1000
  );

  const hundred = number % 1000;

  if (crore) {
    result += `${threeDigits(crore)} Crore `;
  }

  if (lakh) {
    result += `${threeDigits(lakh)} Lakh `;
  }

  if (thousand) {
    result += `${threeDigits(thousand)} Thousand `;
  }

  if (hundred) {
    result += threeDigits(hundred);
  }

  return result.trim();
}

/* =========================================================
   PENDING SECTION
========================================================= */

function PendingSection({
  loading,
  data,
  openDetail,
  formatMoney,
}) {
  if (loading) {
    return <LoadingBox />;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title="No pending fees"
        description="All active students are fully paid up."
      />
    );
  }

  return (
    <div
      className="
        rounded-2xl
        border border-ink-100
        bg-white
        shadow-[0_8px_30px_rgba(15,23,42,0.05)]
        overflow-hidden
      "
    >

      {/* Desktop */}

      <div className="hidden lg:block overflow-x-auto">

        <table className="w-full text-sm">

          <thead>
            <tr className="bg-ink-50/70 border-b border-ink-100">
              <TableHead>
                Student
              </TableHead>
              <TableHead>
                Course
              </TableHead>
              <TableHead>
                Branch
              </TableHead>
              <TableHead>
                Total Fee
              </TableHead>
              <TableHead>
                Paid
              </TableHead>
              <TableHead>
                Pending
              </TableHead>
              <TableHead align="right">
                Action
              </TableHead>
            </tr>
          </thead>

          <tbody>
            {data.map((item) => (
              <tr
                key={item.student._id}
                className="
                  border-b
                  border-ink-100
                  last:border-0
                  hover:bg-ink-50/60
                  transition
                  cursor-pointer
                "
                onClick={() =>
                  openDetail(
                    'pending',
                    item
                  )
                }
              >

                <td className="px-5 py-4">
                  <StudentCell
                    student={
                      item.student
                    }
                  />
                </td>

                <td className="px-4 py-4 text-ink-700">
                  {item.course}
                </td>

                <td className="px-4 py-4 text-ink-700">
                  {item.branch}
                </td>

                <td className="px-4 py-4 font-medium">
                  {formatMoney(
                    item.totalFee
                  )}
                </td>

                <td className="px-4 py-4 text-emerald-600 font-semibold">
                  {formatMoney(
                    item.paid
                  )}
                </td>

                <td className="px-4 py-4">

                  <span
                    className="
                      inline-flex
                      px-2.5 py-1
                      rounded-lg
                      bg-red-50
                      text-red-600
                      font-bold
                    "
                  >
                    {formatMoney(
                      item.pending
                    )}
                  </span>

                </td>

                <td className="px-5 py-4 text-right">

                  <button
                    className="
                      w-9 h-9
                      rounded-lg
                      border border-ink-200
                      text-ink-600
                      hover:bg-ink-950
                      hover:text-white
                      transition
                    "
                    onClick={(e) => {
                      e.stopPropagation();

                      openDetail(
                        'pending',
                        item
                      );
                    }}
                  >
                    <Eye
                      size={15}
                      className="mx-auto"
                    />
                  </button>

                </td>

              </tr>
            ))}
          </tbody>

        </table>

      </div>

      {/* Mobile */}

      <div className="lg:hidden p-3 sm:p-4 space-y-3">

        {data.map((item) => (
          <div
            key={item.student._id}
            className="
              rounded-2xl
              border border-ink-100
              bg-white
              p-4
              shadow-sm
              hover:shadow-md
              transition
            "
            onClick={() =>
              openDetail(
                'pending',
                item
              )
            }
          >

            <div className="flex items-center justify-between gap-3">

              <StudentCell
                student={
                  item.student
                }
              />

              <ChevronRight
                size={17}
                className="text-ink-300 shrink-0"
              />

            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">

              <AmountMini
                label="Total"
                value={formatMoney(
                  item.totalFee
                )}
              />

              <AmountMini
                label="Paid"
                value={formatMoney(
                  item.paid
                )}
                positive
              />

              <AmountMini
                label="Pending"
                value={formatMoney(
                  item.pending
                )}
                danger
              />

              <AmountMini
                label="Course"
                value={item.course}
              />

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}

/* =========================================================
   PAYMENT HISTORY
========================================================= */

function PaymentHistorySection({
  loading,
  data,
  openDetail,
  generateReceiptPDF,
  generatingReceipt,
  deletePayment,
  canDeletePayments,
  formatMoney,
  formatDate,
  formatMode,
}) {
  if (loading) {
    return <LoadingBox />;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title="No payments found"
        description="No payment records match the current filters."
      />
    );
  }

  return (
    <div
      className="
        rounded-2xl
        border border-ink-100
        bg-white
        shadow-[0_8px_30px_rgba(15,23,42,0.05)]
        overflow-hidden
      "
    >

      {/* Desktop */}

      <div className="hidden xl:block overflow-x-auto">

        <table className="w-full text-sm">

          <thead>
            <tr className="bg-ink-50/70 border-b border-ink-100">

              <TableHead>
                Receipt
              </TableHead>

              <TableHead>
                Student
              </TableHead>

              <TableHead>
                Amount
              </TableHead>

              <TableHead>
                Mode
              </TableHead>

              <TableHead>
                Branch
              </TableHead>

              <TableHead>
                Collected By
              </TableHead>

              <TableHead>
                Date
              </TableHead>

              <TableHead align="right">
                Actions
              </TableHead>

            </tr>
          </thead>

          <tbody>

            {data.map((payment) => (
              <PaymentRow
                key={payment._id}
                payment={payment}
                openDetail={openDetail}
                generateReceiptPDF={
                  generateReceiptPDF
                }
                generatingReceipt={
                  generatingReceipt
                }
                deletePayment={
                  deletePayment
                }
                canDeletePayments={
                  canDeletePayments
                }
                formatMoney={
                  formatMoney
                }
                formatDate={
                  formatDate
                }
                formatMode={
                  formatMode
                }
              />
            ))}

          </tbody>

        </table>

      </div>

      {/* Tablet */}

      <div className="hidden lg:block xl:hidden p-4 space-y-3">

        {data.map((payment) => (
          <PaymentCard
            key={payment._id}
            payment={payment}
            openDetail={openDetail}
            generateReceiptPDF={
              generateReceiptPDF
            }
            generatingReceipt={
              generatingReceipt
            }
            deletePayment={
              deletePayment
            }
            canDeletePayments={
              canDeletePayments
            }
            formatMoney={
              formatMoney
            }
            formatDate={
              formatDate
            }
            formatMode={
              formatMode
            }
          />
        ))}

      </div>

      {/* Mobile */}

      <div className="lg:hidden p-3 sm:p-4 space-y-3">

        {data.map((payment) => (
          <PaymentCard
            key={payment._id}
            payment={payment}
            openDetail={openDetail}
            generateReceiptPDF={
              generateReceiptPDF
            }
            generatingReceipt={
              generatingReceipt
            }
            deletePayment={
              deletePayment
            }
            canDeletePayments={
              canDeletePayments
            }
            formatMoney={
              formatMoney
            }
            formatDate={
              formatDate
            }
            formatMode={
              formatMode
            }
          />
        ))}

      </div>

    </div>
  );
}

/* =========================================================
   PAYMENT ROW
========================================================= */

function PaymentRow({
  payment,
  openDetail,
  generateReceiptPDF,
  generatingReceipt,
  deletePayment,
  canDeletePayments,
  formatMoney,
  formatDate,
  formatMode,
}) {
  return (
    <tr
      className="
        border-b
        border-ink-100
        last:border-0
        hover:bg-ink-50/60
        transition
      "
    >

      <td className="px-5 py-4">

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

          <Receipt
            size={13}
            className="text-ink-500"
          />

          <span className="font-mono text-xs font-semibold">
            {payment.receiptNumber}
          </span>

        </div>

      </td>

      <td
        className="px-4 py-4 cursor-pointer"
        onClick={() =>
          openDetail(
            'payment',
            payment
          )
        }
      >
        <StudentCell
          student={payment.student}
        />
      </td>

      <td className="px-4 py-4">

        <span className="text-base font-bold text-ink-950">
          {formatMoney(
            payment.amountPaid
          )}
        </span>

      </td>

      <td className="px-4 py-4">
        <Badge
          tone={
            modeTone[
              payment.paymentMode
            ] || 'ink'
          }
        >
          {formatMode(
            payment.paymentMode
          )}
        </Badge>
      </td>

      <td className="px-4 py-4 text-ink-700">
        {payment.branch?.name ||
          '—'}
      </td>

      <td className="px-4 py-4 text-ink-700">
        {payment.collectedBy?.name ||
          '—'}
      </td>

      <td className="px-4 py-4 text-ink-700">
        {formatDate(
          payment.paymentDate
        )}
      </td>

      <td className="px-5 py-4">

        <div className="flex items-center justify-end gap-1.5">

          <ReceiptButton
            payment={payment}
            generateReceiptPDF={
              generateReceiptPDF
            }
            generatingReceipt={
              generatingReceipt
            }
          />

          <button
            className="
              w-9 h-9
              rounded-lg
              border border-ink-200
              text-ink-600
              flex items-center justify-center
              hover:bg-ink-950
              hover:text-white
              transition
            "
            onClick={() =>
              openDetail(
                'payment',
                payment
              )
            }
            title="View details"
          >
            <Eye size={15} />
          </button>

          {canDeletePayments && (
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
              onClick={() =>
                deletePayment(
                  payment._id
                )
              }
              title="Delete payment"
            >
              <Trash2 size={15} />
            </button>
          )}

        </div>

      </td>

    </tr>
  );
}

/* =========================================================
   PAYMENT CARD
========================================================= */

function PaymentCard({
  payment,
  openDetail,
  generateReceiptPDF,
  generatingReceipt,
  deletePayment,
  canDeletePayments,
  formatMoney,
  formatDate,
  formatMode,
}) {
  return (
    <div
      className="
        rounded-2xl
        border border-ink-100
        bg-white
        p-4
        shadow-sm
        hover:shadow-md
        transition
      "
    >

      <div className="flex items-start gap-3">

        <div
          className="
            w-11 h-11
            rounded-xl
            bg-ink-950
            text-white
            flex items-center justify-center
            shrink-0
          "
        >
          <Receipt size={18} />
        </div>

        <div className="min-w-0 flex-1">

          <div className="flex flex-wrap items-center gap-2">

            <p className="font-mono text-xs font-bold text-ink-800">
              {payment.receiptNumber}
            </p>

            <Badge
              tone={
                modeTone[
                  payment.paymentMode
                ] || 'ink'
              }
            >
              {formatMode(
                payment.paymentMode
              )}
            </Badge>

          </div>

          <p className="text-base font-bold text-ink-950 mt-1">
            {payment.student?.name}
          </p>

          <p className="text-xs text-ink-500 mt-0.5">
            {payment.student?.admissionId}
          </p>

        </div>

        <div className="text-right">

          <p className="text-lg font-bold text-ink-950">
            {formatMoney(
              payment.amountPaid
            )}
          </p>

          <p className="text-[11px] text-ink-500">
            {formatDate(
              payment.paymentDate
            )}
          </p>

        </div>

      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">

        <InfoMini
          icon={<Building2 size={13} />}
          label="Branch"
          value={
            payment.branch?.name ||
            '—'
          }
        />

        <InfoMini
          icon={<User size={13} />}
          label="Collected By"
          value={
            payment.collectedBy?.name ||
            '—'
          }
        />

        <InfoMini
          icon={<CreditCard size={13} />}
          label="Transaction"
          value={
            payment.transactionRef ||
            '—'
          }
        />

      </div>

      <div
        className="
          flex
          flex-col sm:flex-row
          gap-2
          mt-4
          pt-3
          border-t border-ink-100
        "
      >

        <ReceiptButton
          payment={payment}
          generateReceiptPDF={
            generateReceiptPDF
          }
          generatingReceipt={
            generatingReceipt
          }
          full
        />

        <button
          className="
            flex-1
            h-10
            rounded-xl
            border border-ink-200
            text-ink-700
            text-sm
            font-semibold
            flex items-center
            justify-center
            gap-2
            hover:bg-ink-50
            transition
          "
          onClick={() =>
            openDetail(
              'payment',
              payment
            )
          }
        >
          <Eye size={15} />
          View Details
        </button>

        {canDeletePayments && (
          <button
            className="
              h-10
              w-full sm:w-10
              rounded-xl
              border border-red-100
              text-red-500
              flex items-center
              justify-center
              hover:bg-red-50
            "
            onClick={() =>
              deletePayment(
                payment._id
              )
            }
          >
            <Trash2 size={15} />
          </button>
        )}

      </div>

    </div>
  );
}

/* =========================================================
   RECEIPT BUTTON
========================================================= */

function ReceiptButton({
  payment,
  generateReceiptPDF,
  generatingReceipt,
  full = false,
}) {
  const loading =
    generatingReceipt ===
    payment._id;

  return (
    <button
      className={`
        ${
          full
            ? 'flex-1 h-10 justify-center'
            : 'w-9 h-9 justify-center'
        }
        rounded-xl
        bg-ink-950
        text-white
        flex items-center
        gap-2
        text-sm
        font-semibold
        hover:bg-ink-800
        active:scale-[0.98]
        transition
      `}
      onClick={(e) => {
        e.stopPropagation();

        generateReceiptPDF(
          payment,
          'both'
        );
      }}
      disabled={loading}
      title="Download receipt"
    >
      {loading ? (
        <Spinner />
      ) : (
        <Download size={15} />
      )}

      {full && (
        <span>
          {loading
            ? 'Generating...'
            : 'Download Receipt'}
        </span>
      )}
    </button>
  );
}

/* =========================================================
   PAYMENT DETAIL
========================================================= */

function PaymentDetail({
  data,
  formatMoney,
  formatDateTime,
  formatMode,
  generateReceiptPDF,
  generatingReceipt,
}) {
  return (
    <div className="space-y-5">

      <div
        className="
          rounded-2xl
          bg-ink-950
          text-white
          p-5
          flex
          flex-col sm:flex-row
          gap-4
          sm:items-center
          sm:justify-between
        "
      >

        <div className="flex items-center gap-3">

          <div
            className="
              w-12 h-12
              rounded-xl
              bg-white/10
              flex items-center justify-center
            "
          >
            <Receipt size={21} />
          </div>

          <div>

            <p className="text-xs text-white/50">
              Receipt Number
            </p>

            <p className="font-mono font-bold text-lg">
              {data.receiptNumber}
            </p>

          </div>

        </div>

        <div className="sm:text-right">

          <p className="text-xs text-white/50">
            Amount Received
          </p>

          <p className="text-2xl font-bold">
            {formatMoney(
              data.amountPaid
            )}
          </p>

        </div>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        <DetailCard
          label="Student"
          value={
            data.student?.name
          }
          icon={<User size={16} />}
        />

        <DetailCard
          label="Admission ID"
          value={
            data.student
              ?.admissionId
          }
          icon={
            <FileText size={16} />
          }
        />

        <DetailCard
          label="Payment Mode"
          value={formatMode(
            data.paymentMode
          )}
          icon={
            <CreditCard size={16} />
          }
        />

        <DetailCard
          label="Payment Date"
          value={formatDateTime(
            data.paymentDate
          )}
          icon={
            <Calendar size={16} />
          }
        />

        <DetailCard
          label="Branch"
          value={
            data.branch?.name
          }
          icon={
            <Building2 size={16} />
          }
        />

        <DetailCard
          label="Collected By"
          value={
            data.collectedBy?.name
          }
          icon={
            <User size={16} />
          }
        />

        <DetailCard
          label="Transaction Ref"
          value={
            data.transactionRef ||
            '—'
          }
          icon={
            <CreditCard size={16} />
          }
        />

        <DetailCard
          label="Installment"
          value={
            data.installmentLabel ||
            '—'
          }
          icon={
            <Clock size={16} />
          }
        />

        <DetailCard
          label="Remarks"
          value={
            data.remarks || '—'
          }
          icon={
            <FileText size={16} />
          }
        />

        <DetailCard
          label="Created At"
          value={formatDateTime(
            data.createdAt
          )}
          icon={
            <Clock size={16} />
          }
        />

      </div>

      <div
        className="
          flex
          flex-col sm:flex-row
          gap-2
          border-t border-ink-100
          pt-4
        "
      >

        <button
          className="
            flex-1
            h-11
            rounded-xl
            bg-ink-950
            text-white
            flex items-center
            justify-center
            gap-2
            text-sm
            font-semibold
            hover:bg-ink-800
          "
          onClick={() =>
            generateReceiptPDF(
              data,
              'both'
            )
          }
          disabled={
            generatingReceipt ===
            data._id
          }
        >
          {generatingReceipt ===
          data._id ? (
            <Spinner />
          ) : (
            <Download size={16} />
          )}

          {generatingReceipt ===
          data._id
            ? 'Generating Receipt...'
            : 'Download Student + Institute Copy'}
        </button>

      </div>

    </div>
  );
}

/* =========================================================
   PENDING DETAIL
========================================================= */

function PendingDetail({
  data,
  formatMoney,
}) {
  return (
    <div className="space-y-5">

      <div
        className="
          rounded-2xl
          bg-ink-950
          text-white
          p-5
          flex
          items-center
          justify-between
        "
      >

        <div>

          <p className="text-xs text-white/50">
            Student
          </p>

          <p className="text-xl font-bold mt-1">
            {data.student?.name}
          </p>

          <p className="text-xs text-white/50 font-mono mt-1">
            {data.student?.admissionId}
          </p>

        </div>

        <AlertCircle
          size={28}
          className="text-white/60"
        />

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        <DetailCard
          label="Course"
          value={data.course}
          icon={
            <BookOpen size={16} />
          }
        />

        <DetailCard
          label="Branch"
          value={data.branch}
          icon={
            <Building2 size={16} />
          }
        />

        <DetailCard
          label="Total Fee"
          value={formatMoney(
            data.totalFee
          )}
          icon={
            <Banknote size={16} />
          }
        />

        <DetailCard
          label="Discount"
          value={formatMoney(
            data.discount
          )}
          icon={
            <CreditCard size={16} />
          }
        />

        <DetailCard
          label="Paid Amount"
          value={formatMoney(
            data.paid
          )}
          icon={
            <CheckCircle2 size={16} />
          }
        />

        <DetailCard
          label="Pending Amount"
          value={formatMoney(
            data.pending
          )}
          icon={
            <AlertCircle size={16} />
          }
        />

      </div>

    </div>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function FeeSummaryCard({
  icon,
  title,
  value,
  subtitle,
}) {
  return (
    <div
      className="
        relative
        overflow-hidden
        rounded-2xl
        border border-ink-100
        bg-white
        p-4
        shadow-[0_6px_25px_rgba(15,23,42,0.05)]
        hover:-translate-y-0.5
        transition-all
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
            shrink-0
          "
        >
          {icon}
        </div>

        <div className="min-w-0">

          <p className="text-xs text-ink-500">
            {title}
          </p>

          <p className="text-xl font-bold text-ink-950 truncate">
            {value}
          </p>

          <p className="text-[10px] text-ink-400 truncate">
            {subtitle}
          </p>

        </div>

      </div>

    </div>
  );
}

function FilterField({
  label,
  children,
}) {
  return (
    <div>
      <label className="label text-xs">
        {label}
      </label>
      {children}
    </div>
  );
}

function FormField({
  label,
  required = false,
  children,
}) {
  return (
    <div>
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

function TableHead({
  children,
  align = 'left',
}) {
  return (
    <th
      className={`
        px-4 sm:px-5
        py-4
        text-[10px]
        font-bold
        uppercase
        tracking-wider
        text-ink-500
        text-${align}
      `}
    >
      {children}
    </th>
  );
}

function StudentCell({
  student,
}) {
  return (
    <div className="flex items-center gap-3">

      <div
        className="
          w-10 h-10
          rounded-xl
          bg-gradient-to-br
          from-ink-950
          to-ink-700
          text-white
          flex items-center justify-center
          font-bold
          text-sm
          shrink-0
        "
      >
        {student?.name
          ?.charAt(0)
          ?.toUpperCase() || (
          <User size={17} />
        )}
      </div>

      <div className="min-w-0">

        <p className="font-semibold text-ink-950 truncate max-w-[180px]">
          {student?.name || '—'}
        </p>

        <p className="text-[11px] text-ink-500 font-mono truncate">
          {student?.admissionId ||
            '—'}
        </p>

      </div>

    </div>
  );
}

function AmountMini({
  label,
  value,
  positive = false,
  danger = false,
}) {
  return (
    <div
      className="
        rounded-xl
        bg-ink-50/70
        border border-ink-100
        p-3
      "
    >

      <p className="text-[9px] uppercase tracking-wider font-bold text-ink-400">
        {label}
      </p>

      <p
        className={`
          text-sm
          font-bold
          mt-1
          ${
            positive
              ? 'text-emerald-600'
              : danger
              ? 'text-red-600'
              : 'text-ink-900'
          }
        `}
      >
        {value}
      </p>

    </div>
  );
}

function InfoMini({
  icon,
  label,
  value,
}) {
  return (
    <div
      className="
        rounded-xl
        bg-ink-50/70
        border border-ink-100
        p-2.5
        min-w-0
      "
    >

      <div className="flex items-center gap-1.5 text-ink-400">

        {icon}

        <span className="text-[9px] uppercase tracking-wider font-bold">
          {label}
        </span>

      </div>

      <p className="text-xs font-semibold text-ink-800 truncate mt-1">
        {value}
      </p>

    </div>
  );
}

function DetailCard({
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
          {value || '—'}
        </p>

      </div>

    </div>
  );
}

function LoadingBox() {
  return (
    <div
      className="
        rounded-2xl
        border border-ink-100
        bg-white
        p-8
        flex flex-col
        items-center
        justify-center
        min-h-[220px]
      "
    >
      <div
        className="
          w-10 h-10
          rounded-full
          border-4
          border-ink-200
          border-t-ink-950
          animate-spin
        "
      />

      <p className="text-sm text-ink-500 mt-4">
        Loading fee records...
      </p>
    </div>
  );
}

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