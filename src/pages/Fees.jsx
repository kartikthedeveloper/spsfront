
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Plus, Pencil, Trash2, Eye, X, RefreshCw,
  University, Banknote, Wallet, AlertCircle, Download
} from 'lucide-react';
import AppShell from '../components/AppShell';
import { PageHeader, EmptyState } from '../components/ui';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const modes = {
  cash: 'Cash',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer'
};

const money = value =>
  `₹${Number(value || 0).toLocaleString('en-IN')}`;

const initialStudentPayment = {
  studentId: '',
  amountPaid: '',
  paymentMode: 'cash',
  transactionRef: '',
  remarks: '',
  installmentLabel: ''
};

const initialUniversityPayment = {
  studentId: '',
  amountPaid: '',
  paymentMode: 'bank_transfer',
  transactionRef: '',
  remarks: ''
};

/* =========================
   RECEIPT HELPERS
========================= */

const amountInWords = amount => {
  const n = Math.floor(Number(amount) || 0);

  if (n === 0) return 'Zero Rupees Only';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six',
    'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
    'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
    'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  const belowThousand = value => {
    let result = '';

    if (value >= 100) {
      result += ones[Math.floor(value / 100)] + ' Hundred ';
      value %= 100;
    }

    if (value >= 20) {
      result += tens[Math.floor(value / 10)] + ' ';
      value %= 10;
    }

    if (value > 0) result += ones[value] + ' ';

    return result;
  };

  let value = n;
  let result = '';

  if (value >= 10000000) {
    result += belowThousand(Math.floor(value / 10000000)) + 'Crore ';
    value %= 10000000;
  }

  if (value >= 100000) {
    result += belowThousand(Math.floor(value / 100000)) + 'Lakh ';
    value %= 100000;
  }

  if (value >= 1000) {
    result += belowThousand(Math.floor(value / 1000)) + 'Thousand ';
    value %= 1000;
  }

  result += belowThousand(value);

  return `${result.trim()} Rupees Only`;
};

const loadReceiptLogo = () =>
  new Promise(resolve => {
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);

        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };

    image.onerror = () => resolve(null);
    image.src = '/institute-logo.png';
  });

const receiptMoney = value =>
  Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

/* =========================
   MAIN FEES COMPONENT
========================= */

export default function Fees() {
  const { user } = useAuth();

  const [tab, setTab] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pending, setPending] = useState([]);
  const [payments, setPayments] = useState([]);
  const [universityPayments, setUniversityPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [feeDashboard, setFeeDashboard] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    branch: '',
    course: '',
    mode: '',
    from: '',
    to: ''
  });

  const [studentModal, setStudentModal] = useState({
    open: false,
    mode: 'create',
    data: null
  });

  const [universityModal, setUniversityModal] = useState({
    open: false,
    mode: 'create',
    data: null
  });

  const [detail, setDetail] = useState(null);
  const [summary, setSummary] = useState(null);

  const [studentForm, setStudentForm] = useState(initialStudentPayment);
  const [universityForm, setUniversityForm] = useState(initialUniversityPayment);

  const load = async () => {
    setLoading(true);

    try {
      const [p, u, pay, s, c, b, d] = await Promise.all([
        api.get('/fees/pending'),
        api.get('/fees/university-payments'),
        api.get('/fees/payments'),
        api.get('/students', { params: { limit: 100 } }),
        api.get('/academics/courses'),
        api.get('/branches'),
        api.get('/fees/dashboard')
      ]);

      setPending(p.data.pendingFees || []);
      setUniversityPayments(u.data.payments || []);
      setPayments(pay.data.payments || []);
      setStudents(s.data.students || []);
      setCourses(c.data.courses || []);
      setBranches(b.data.branches || []);
      setFeeDashboard(d.data.dashboard || null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load fee data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const courseName = course =>
    typeof course === 'object'
      ? course?.name || '—'
      : courses.find(item => item._id === course)?.name || '—';

  const branchName = branch =>
    typeof branch === 'object'
      ? branch?.name || '—'
      : branches.find(item => item._id === branch)?.name || '—';

  const matches = item => {
    const student = item.student || {};
    const name = (student.name || '').toLowerCase();
    const admission = (student.admissionId || '').toLowerCase();
    const query = filters.search.toLowerCase();

    const branch =
      item.branch?._id || student.branch?._id ||
      item.branch || student.branch;

    const course =
      item.course?._id || student.course?._id ||
      item.course || student.course;

    return (
      (!query || name.includes(query) || admission.includes(query)) &&
      (!filters.branch || branch === filters.branch) &&
      (!filters.course || course === filters.course) &&
      (!filters.mode || item.paymentMode === filters.mode) &&
      (!filters.from || (
        item.paymentDate &&
        new Date(item.paymentDate) >= new Date(filters.from)
      )) &&
      (!filters.to || (
        item.paymentDate &&
        new Date(item.paymentDate) <= new Date(`${filters.to}T23:59:59`)
      ))
    );
  };

  const filteredPending = useMemo(
    () => pending.filter(matches),
    [pending, filters]
  );

  const filteredPayments = useMemo(
    () => payments.filter(matches),
    [payments, filters]
  );

  const filteredUniversity = useMemo(
    () => universityPayments.filter(matches),
    [universityPayments, filters]
  );

  const studentTotal = filteredPayments.reduce(
    (sum, payment) => sum + Number(payment.amountPaid || 0),
    0
  );

  const universityTotal = filteredUniversity.reduce(
    (sum, payment) => sum + Number(payment.amountPaid || 0),
    0
  );

  const resetFilters = () =>
    setFilters({
      search: '',
      branch: '',
      course: '',
      mode: '',
      from: '',
      to: ''
    });

  /* =========================
     STUDENT PAYMENT CRUD
  ========================= */

  const openStudentPayment = (mode = 'create', data = null) => {
    setStudentForm(
      mode === 'create'
        ? { ...initialStudentPayment }
        : {
            studentId: data.student?._id || data.student || '',
            amountPaid: data.amountPaid || '',
            paymentMode: data.paymentMode || 'cash',
            transactionRef: data.transactionRef || '',
            remarks: data.remarks || '',
            installmentLabel: data.installmentLabel || ''
          }
    );

    setStudentModal({ open: true, mode, data });
  };

  const saveStudentPayment = async event => {
    event.preventDefault();
    setSaving(true);

    try {
      if (studentModal.mode === 'create') {
        const response = await api.post('/fees/payments', studentForm);

        toast.success('Student payment recorded');

        if (response.data?.payment) {
          await downloadReceipt(response.data.payment);
        }
      } else {
        const payload = {
          remarks: studentForm.remarks,
          transactionRef: studentForm.transactionRef,
          installmentLabel: studentForm.installmentLabel
        };

        if (user.role === 'admin') {
          payload.amountPaid = studentForm.amountPaid;
          payload.paymentMode = studentForm.paymentMode;
        }

        await api.patch(
          `/fees/payments/${studentModal.data._id}`,
          payload
        );

        toast.success('Student payment updated');
      }

      setStudentModal({ open: false, mode: 'create', data: null });
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save student payment');
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     UNIVERSITY PAYMENT CRUD
  ========================= */

  const openUniversityPayment = (mode = 'create', data = null) => {
    setUniversityForm(
      mode === 'create'
        ? { ...initialUniversityPayment }
        : {
            studentId: data.student?._id || data.student || '',
            amountPaid: data.amountPaid || '',
            paymentMode: data.paymentMode || 'bank_transfer',
            transactionRef: data.transactionRef || '',
            remarks: data.remarks || ''
          }
    );

    setUniversityModal({ open: true, mode, data });
  };

  const saveUniversityPayment = async event => {
    event.preventDefault();
    setSaving(true);

    try {
      if (universityModal.mode === 'create') {
        await api.post('/fees/university-payments', universityForm);
        toast.success('University payment recorded');
      } else {
        const payload = {
          transactionRef: universityForm.transactionRef,
          remarks: universityForm.remarks
        };

        if (user.role === 'admin') {
          payload.amountPaid = universityForm.amountPaid;
          payload.paymentMode = universityForm.paymentMode;
        }

        await api.patch(
          `/fees/university-payments/${universityModal.data._id}`,
          payload
        );

        toast.success('University payment updated');
      }

      setUniversityModal({ open: false, mode: 'create', data: null });
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save university payment');
    } finally {
      setSaving(false);
    }
  };

  const deleteUniversity = async id => {
    if (
      user.role !== 'admin' ||
      !window.confirm('Delete this university payment?')
    ) return;

    try {
      await api.delete(`/fees/university-payments/${id}`);
      toast.success('University payment deleted');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete payment');
    }
  };

  const deleteStudentPayment = async id => {
    if (
      user.role !== 'admin' ||
      !window.confirm('Delete this student payment?')
    ) return;

    try {
      await api.delete(`/fees/payments/${id}`);
      toast.success('Student payment deleted');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete payment');
    }
  };

  /* =========================
     REFERENCE-STYLE PDF RECEIPT
  ========================= */

  const downloadReceipt = async payment => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5'
      });

      const studentId =
        typeof payment.student === 'object'
          ? payment.student?._id
          : payment.student;

      const student =
        students.find(item => item._id === studentId) ||
        (typeof payment.student === 'object' ? payment.student : {});

      const studentPayments = payments.filter(item => {
        const id =
          typeof item.student === 'object'
            ? item.student?._id
            : item.student;

        return id === studentId;
      });

      // Avoid double-counting when the newly saved payment
      // is already in the current payments state.
      const paymentHistory = studentPayments.some(
        item => item._id === payment._id
      )
        ? studentPayments
        : [...studentPayments, payment];

      const paidIncludingCurrent = paymentHistory.reduce(
        (sum, item) => sum + Number(item.amountPaid || 0),
        0
      );

      const feeRecord = pending.find(
        item => item.student?._id === studentId
      );

      const totalFee = Number(
        feeRecord?.netFee ??
        student.netFee ??
        student.totalFee ??
        0
      );

      const currentBalance = Math.max(
        totalFee - paidIncludingCurrent,
        0
      );

      const previousBalance = currentBalance + Number(payment.amountPaid || 0);

      const selectedCourse =
        typeof student.course === 'object'
          ? student.course?.name
          : courses.find(item => item._id === student.course)?.name;

      const fatherName =
        student.fatherName ||
        student.father_name ||
        student.guardianName ||
        '—';

      const className =
        student.className ||
        student.class ||
        selectedCourse ||
        '—';

      const mobile =
        student.mobile ||
        student.phone ||
        student.mobileNumber ||
        '—';

      const date = payment.paymentDate
        ? new Date(payment.paymentDate)
        : new Date();

      const left = 7;
      const right = 141;
      const width = right - left;

      const drawLine = (x1, y1, x2, y2, weight = 0.35) => {
        doc.setDrawColor(35, 35, 35);
        doc.setLineWidth(weight);
        doc.line(x1, y1, x2, y2);
      };

      const drawText = (value, x, y, options = {}) => {
        doc.setTextColor(30, 30, 30);
        doc.text(String(value ?? '—'), x, y, options);
      };

      const drawField = (label, value, x, y, valueX) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        drawText(label, x, y);
        drawText(':', valueX - 3, y);

        doc.setFont('helvetica', 'bold');
        drawText(value || '—', valueX, y);
      };

      // Outer receipt border
      doc.setDrawColor(30, 30, 30);
      doc.setLineWidth(0.8);
      doc.rect(left, 7, width, 196);

      // Institute header
      const logo = await loadReceiptLogo();

      if (logo) {
        doc.addImage(logo, 'PNG', 11, 11, 20, 20);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      drawText('SUCCESS POINT SIKAR', 77, 16, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      drawText('Professional Training & Education', 77, 21, {
        align: 'center'
      });
      drawText('Sikar, Rajasthan', 77, 25, { align: 'center' });

      drawLine(10, 31, 138, 31, 0.7);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      drawText('FEE RECEIPT', 76, 37, { align: 'center' });

      // Receipt number and date
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      drawField(
        'S. No.',
        payment.receiptNumber || String(payment._id || '—'),
        11, 44, 30
      );

      drawField(
        'Date',
        date.toLocaleDateString('en-IN'),
        97, 44, 112
      );

      drawLine(10, 47, 138, 47, 0.5);

      // Student details
      drawField("Student's Name", student.name, 11, 54, 43);
      drawField("Father's Name", fatherName, 11, 61, 43);
      drawField('Class', className, 11, 68, 43);
      drawField('Mob.', mobile, 11, 75, 43);

      drawField(
        'Fee for the Month',
        payment.installmentLabel || '—',
        11, 82, 43
      );

      drawLine(10, 86, 138, 86, 0.7);

      // Four-column fee table
      const x0 = 10;
      const x1 = 69;
      const x2 = 91;
      const x3 = 120;
      const x4 = 138;

      const tableTop = 87;
      const headerBottom = 97;
      const rowHeight = 8;
      const totalY = headerBottom + rowHeight * 5;

      const leftItems = [
        ['Tuition Fee', Number(payment.amountPaid || 0)],
        ['Admission Fee', 0],
        ['Examination Fee', 0],
        ['Re-admission Fee', 0],
        ['Late Payment Fee', 0]
      ];

      const rightItems = [
        ['Development Fee', 0],
        ['Games Fee', 0],
        ['Conveyance Char.', 0],
        ['Diary', 0],
        ['Computer Fee', 0]
      ];

      drawLine(x0, tableTop, x4, tableTop, 0.6);
      drawLine(x0, headerBottom, x4, headerBottom, 0.6);

      [x0, x1, x2, x3, x4].forEach(x => {
        drawLine(x, tableTop, x, totalY + 8, 0.45);
      });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);

      drawText('Particulars', (x0 + x1) / 2, 93, { align: 'center' });
      drawText('Rs.', (x1 + x2) / 2, 93, { align: 'center' });
      drawText('Particulars', (x2 + x3) / 2, 93, { align: 'center' });
      drawText('Rs.', (x3 + x4) / 2, 93, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);

      for (let i = 0; i < 5; i++) {
        const y = headerBottom + 5.5 + i * rowHeight;

        drawText(leftItems[i][0], x0 + 2, y);

        if (leftItems[i][1]) {
          drawText(
            receiptMoney(leftItems[i][1]),
            x2 - 2,
            y,
            { align: 'right' }
          );
        }

        drawText(rightItems[i][0], x2 + 2, y);

        if (rightItems[i][1]) {
          drawText(
            receiptMoney(rightItems[i][1]),
            x4 - 2,
            y,
            { align: 'right' }
          );
        }

        drawLine(
          x0,
          headerBottom + (i + 1) * rowHeight,
          x4,
          headerBottom + (i + 1) * rowHeight,
          0.2
        );
      }

      // Total row
      drawLine(x0, totalY, x4, totalY, 0.6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);

      drawText('Total', (x0 + x1) / 2, totalY + 5.5, {
        align: 'center'
      });

      drawText(
        receiptMoney(payment.amountPaid),
        x2 - 2,
        totalY + 5.5,
        { align: 'right' }
      );

      drawText('Total', (x2 + x3) / 2, totalY + 5.5, {
        align: 'center'
      });

      drawLine(x0, totalY + 8, x4, totalY + 8, 0.7);

      // Balance summary
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

    
      drawText('Amount Paid', 11, 162);
      drawText(receiptMoney(payment.amountPaid), 137, 162, {
        align: 'right'
      });

      drawLine(10, 165, 138, 165, 0.5);

      doc.setFont('helvetica', 'bold');
      drawText('Balance Due', 11, 172);
      drawText(receiptMoney(currentBalance), 137, 172, {
        align: 'right'
      });

      drawLine(10, 176, 138, 176, 0.6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      drawText('Amount in Words:', 11, 183);

      const words = amountInWords(payment.amountPaid);
      const wrappedWords = doc.splitTextToSize(words, 115);
      doc.text(wrappedWords, 11, 188);

      // Signature lines
      drawLine(12, 197, 51, 197, 0.4);
      drawLine(96, 197, 135, 197, 0.4);

      doc.setFontSize(7);
      drawText('Student Signature', 31, 201, { align: 'center' });
      drawText('Sign. of Teacher', 115, 201, { align: 'center' });

      doc.save(
        `SuccessPoint_Receipt_${payment.receiptNumber || payment._id}.pdf`
      );
    } catch (error) {
      console.error('Receipt generation error:', error);
      toast.error('Could not generate receipt');
    }
  };

  /* =========================
     STUDENT DETAILS & SUMMARY
  ========================= */

  const viewStudent = async student => {
    try {
      const id = student?._id || student;
      const response = await api.get(`/fees/student/${id}`);
      setDetail(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load fee details');
    }
  };

  const selectedStudent = id =>
    typeof id === 'object'
      ? id
      : students.find(student => student._id === id);

  const selectedForUni = selectedStudent(universityForm.studentId);

  const selectedUniPending = selectedForUni
    ? Math.max(
        Number(selectedForUni.universityFee || 0) -
          universityPayments
            .filter(payment =>
              (payment.student?._id || payment.student) === selectedForUni._id
            )
            .reduce(
              (sum, payment) => sum + Number(payment.amountPaid || 0),
              0
            ),
        0
      )
    : null;

  const openSummary = type => {
    const data =
      type === 'studentCollection'
        ? filteredPayments
        : type === 'universityPaid'
          ? filteredUniversity
          : type === 'universityPending'
            ? filteredPending
            : filteredPending;

    setSummary({ type, data });
  };

  const dashboardValue = (key, fallback = 0) =>
    Number(feeDashboard?.[key] ?? fallback);

  return (
    <AppShell title="Fees">
      <div className="space-y-5">
        <PageHeader
          title="Fees & Payments"
          description="Manage student collections, university payments and fee balances."
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Metric
            label="Student Collection"
            value={money(dashboardValue('totalStudentCollected', studentTotal))}
            icon={Banknote}
            onClick={() => {
              setTab('payments');
              openSummary('studentCollection');
            }}
          />

          <Metric
            label="University Paid"
            value={money(dashboardValue('totalUniversityPaid', universityTotal))}
            icon={University}
            onClick={() => {
              setTab('university');
              openSummary('universityPaid');
            }}
          />

          <Metric
            label="Student Pending"
            value={money(dashboardValue('totalStudentPending'))}
            icon={Wallet}
            danger
            onClick={() => {
              setTab('pending');
              openSummary('studentPending');
            }}
          />

          <Metric
            label="University Pending"
            value={money(dashboardValue('totalUniversityPending'))}
            icon={AlertCircle}
            danger
            onClick={() => {
              setTab('pending');
              openSummary('universityPending');
            }}
          />
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-2 flex flex-wrap gap-1">
          {[
            ['pending', 'Pending Fees'],
            ['payments', 'Student Payments'],
            ['university', 'University Payments']
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${
                tab === key
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}

          <button
            onClick={load}
            className="ml-auto p-2.5 rounded-xl text-slate-500 hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="lg:col-span-2">
              <label className="text-xs font-semibold text-slate-500">
                Search
              </label>
              <input
                className="input mt-1 w-full"
                placeholder="Student / Admission ID"
                value={filters.search}
                onChange={event =>
                  setFilters({ ...filters, search: event.target.value })
                }
              />
            </div>

            <Select
              label="Branch"
              value={filters.branch}
              onChange={value => setFilters({ ...filters, branch: value })}
              options={branches}
            />

            <Select
              label="Course"
              value={filters.course}
              onChange={value => setFilters({ ...filters, course: value })}
              options={courses}
            />

            {(tab === 'payments' || tab === 'university') && (
              <Select
                label="Payment Mode"
                value={filters.mode}
                onChange={value => setFilters({ ...filters, mode: value })}
                options={Object.entries(modes).map(([value, name]) => ({
                  _id: value,
                  name
                }))}
              />
            )}

            <button
              onClick={resetFilters}
              className="h-10 self-end rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 flex items-center justify-center gap-2"
            >
              <X size={14} />
              Clear
            </button>
          </div>

          {(tab === 'payments' || tab === 'university') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <DateField
                label="From"
                value={filters.from}
                onChange={value => setFilters({ ...filters, from: value })}
              />

              <DateField
                label="To"
                value={filters.to}
                onChange={value => setFilters({ ...filters, to: value })}
              />
            </div>
          )}
        </div>

        {tab === 'pending' && (
          <PendingTable
            data={filteredPending}
            money={money}
            onView={viewStudent}
          />
        )}

        {tab === 'payments' && (
          <PaymentTable
            data={filteredPayments}
            total={studentTotal}
            money={money}
            onAdd={() => openStudentPayment()}
            onEdit={payment => openStudentPayment('edit', payment)}
            onDelete={deleteStudentPayment}
            onReceipt={downloadReceipt}
          />
        )}

        {tab === 'university' && (
          <UniversityTable
            data={filteredUniversity}
            total={universityTotal}
            money={money}
            canManage={['admin', 'branch_manager'].includes(user.role)}
            onAdd={() => openUniversityPayment()}
            onEdit={payment => openUniversityPayment('edit', payment)}
            onDelete={deleteUniversity}
          />
        )}
      </div>

      {studentModal.open && (
        <PaymentModal
          title={
            studentModal.mode === 'create'
              ? 'Record Student Payment'
              : 'Edit Student Payment'
          }
          form={studentForm}
          setForm={setStudentForm}
          students={students}
          saving={saving}
          onClose={() =>
            setStudentModal({ open: false, mode: 'create', data: null })
          }
          onSubmit={saveStudentPayment}
        />
      )}

      {universityModal.open && (
        <UniversityModal
          title={
            universityModal.mode === 'create'
              ? 'Record University Payment'
              : 'Edit University Payment'
          }
          form={universityForm}
          setForm={setUniversityForm}
          students={students}
          saving={saving}
          user={user}
          pending={selectedUniPending}
          onClose={() =>
            setUniversityModal({ open: false, mode: 'create', data: null })
          }
          onSubmit={saveUniversityPayment}
        />
      )}

      {detail && (
        <DetailModal
          data={detail}
          money={money}
          onClose={() => setDetail(null)}
        />
      )}

      {summary && (
        <SummaryModal
          summary={summary}
          money={money}
          onClose={() => setSummary(null)}
          onViewStudent={viewStudent}
        />
      )}
    </AppShell>
  );
}

/* =========================
   DASHBOARD METRIC
========================= */

function Metric({ label, value, icon: Icon, danger, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left w-full rounded-2xl bg-white border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-300"
    >
      <div
        className={`h-9 w-9 rounded-xl flex items-center justify-center ${
          danger
            ? 'bg-rose-50 text-rose-500'
            : 'bg-slate-100 text-slate-600'
        }`}
      >
        <Icon size={16} />
      </div>

      <p className="text-xs text-slate-500 mt-3">{label}</p>
      <p className={`text-lg font-bold mt-1 ${danger ? 'text-rose-600' : 'text-slate-900'}`}>
        {value}
      </p>
      <p className="text-[10px] text-slate-400 mt-2">Click for summary →</p>
    </button>
  );
}

/* =========================
   FILTER COMPONENTS
========================= */

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500">{label}</label>
      <select
        className="input mt-1 w-full"
        value={value}
        onChange={event => onChange(event.target.value)}
      >
        <option value="">All</option>
        {options.map(option => (
          <option key={option._id} value={option._id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function DateField({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500">{label}</label>
      <input
        type="date"
        className="input mt-1 w-full"
        value={value}
        onChange={event => onChange(event.target.value)}
      />
    </div>
  );
}

/* =========================
   PENDING TABLE
========================= */

function PendingTable({ data, money, onView }) {
  return (
    <TableShell
      title="Pending Fee & University Liability"
      count={data.length}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b">
              <th className="p-3">Student</th>
              <th className="p-3">Net Fee</th>
              <th className="p-3">Student Paid</th>
              <th className="p-3">Student Pending</th>
              <th className="p-3">University Fee</th>
              <th className="p-3">University Paid</th>
              <th className="p-3">University Pending</th>
              <th className="p-3"></th>
            </tr>
          </thead>

          <tbody>
            {data.map(item => (
              <tr
                key={item.student?._id}
                className="border-b last:border-0 hover:bg-slate-50"
              >
                <td className="p-3">
                  <p className="font-semibold">{item.student?.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {item.student?.admissionId}
                  </p>
                </td>

                <td className="p-3">{money(item.netFee)}</td>
                <td className="p-3">{money(item.studentPaid)}</td>
                <td className="p-3 text-rose-600 font-semibold">
                  {money(item.studentPending)}
                </td>
                <td className="p-3">{money(item.universityFee)}</td>
                <td className="p-3">{money(item.universityPaid)}</td>
                <td className="p-3 text-rose-600 font-semibold">
                  {money(item.universityPending)}
                </td>

                <td className="p-3">
                  <button
                    onClick={() => onView(item.student)}
                    className="p-2 rounded-lg hover:bg-slate-100"
                    title="View fee details"
                  >
                    <Eye size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!data.length && (
          <EmptyState
            title="No pending fees"
            description="All current fee balances are clear."
          />
        )}
      </div>
    </TableShell>
  );
}

/* =========================
   STUDENT PAYMENT TABLE
========================= */

function PaymentTable({
  data, total, money, onAdd, onEdit, onDelete, onReceipt
}) {
  return (
    <TableShell
      title="Student Payment History"
      count={`${data.length} • ${money(total)}`}
    >
      <div className="flex justify-end p-3 border-b">
        <button
          className="btn-primary flex items-center gap-2"
          onClick={onAdd}
        >
          <Plus size={15} />
          Record Payment
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b">
              <th className="p-3">Receipt</th>
              <th className="p-3">Student</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Mode</th>
              <th className="p-3">Date</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {data.map(payment => (
              <tr key={payment._id} className="border-b last:border-0">
                <td className="p-3 font-semibold">
                  {payment.receiptNumber || '—'}
                </td>

                <td className="p-3">
                  {payment.student?.name}
                  <div className="text-[11px] text-slate-400">
                    {payment.student?.admissionId}
                  </div>
                </td>

                <td className="p-3 font-bold">
                  {money(payment.amountPaid)}
                </td>

                <td className="p-3">
                  {modes[payment.paymentMode] || payment.paymentMode}
                </td>

                <td className="p-3">
                  {payment.paymentDate
                    ? new Date(payment.paymentDate).toLocaleDateString('en-IN')
                    : '—'}
                </td>

                <td className="p-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => onReceipt(payment)}
                      className="p-2 hover:bg-slate-100 rounded-lg"
                      title="Download receipt"
                    >
                      <Download size={14} />
                    </button>

                    <button
                      onClick={() => onEdit(payment)}
                      className="p-2 hover:bg-slate-100 rounded-lg"
                      title="Edit payment"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      onClick={() => onDelete(payment._id)}
                      className="p-2 hover:bg-rose-50 text-rose-500 rounded-lg"
                      title="Delete payment"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!data.length && (
          <EmptyState
            title="No payments found"
            description="Student collections will appear here."
          />
        )}
      </div>
    </TableShell>
  );
}

/* =========================
   UNIVERSITY TABLE
========================= */

function UniversityTable({
  data, total, money, canManage, onAdd, onEdit, onDelete
}) {
  return (
    <TableShell
      title="University Payments"
      count={`${data.length} • ${money(total)}`}
    >
      <div className="flex justify-end p-3 border-b">
        {canManage && (
          <button
            onClick={onAdd}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={15} />
            Pay University
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b">
              <th className="p-3">Payment No.</th>
              <th className="p-3">Student</th>
              <th className="p-3">Amount Paid</th>
              <th className="p-3">Mode</th>
              <th className="p-3">Date</th>
              <th className="p-3">Paid By</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {data.map(payment => (
              <tr key={payment._id} className="border-b last:border-0">
                <td className="p-3 font-semibold">
                  {payment.paymentNumber || '—'}
                </td>

                <td className="p-3">
                  {payment.student?.name}
                  <div className="text-[11px] text-slate-400">
                    {payment.student?.admissionId}
                  </div>
                </td>

                <td className="p-3 font-bold">
                  {money(payment.amountPaid)}
                </td>

                <td className="p-3">
                  {modes[payment.paymentMode] || payment.paymentMode}
                </td>

                <td className="p-3">
                  {payment.paymentDate
                    ? new Date(payment.paymentDate).toLocaleDateString('en-IN')
                    : '—'}
                </td>

                <td className="p-3">{payment.paidBy?.name || '—'}</td>

                <td className="p-3">
                  <div className="flex gap-1">
                    {canManage && (
                      <button
                        onClick={() => onEdit(payment)}
                        className="p-2 hover:bg-slate-100 rounded-lg"
                        title="Edit payment"
                      >
                        <Pencil size={14} />
                      </button>
                    )}

                    {canManage && (
                      <button
                        onClick={() => onDelete(payment._id)}
                        className="p-2 hover:bg-rose-50 text-rose-500 rounded-lg"
                        title="Delete payment"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!data.length && (
          <EmptyState
            title="No university payments"
            description="Payments made to university will appear here."
          />
        )}
      </div>
    </TableShell>
  );
}

function TableShell({ title, count, children }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900">{title}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">{count}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

/* =========================
   MODALS
========================= */

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-xl my-8"
        onMouseDown={event => event.stopPropagation()}
      >
        <div className="p-5 border-b flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function ModalButtons({ onClose, saving }) {
  return (
    <div className="flex justify-end gap-2 pt-3 border-t">
      <button type="button" onClick={onClose} className="btn-outline">
        Cancel
      </button>
      <button disabled={saving} className="btn-primary">
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

function PaymentModal({
  title, form, setForm, students, saving, onClose, onSubmit
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Student">
          <select
            required
            className="input w-full"
            value={form.studentId}
            onChange={event =>
              setForm({ ...form, studentId: event.target.value })
            }
          >
            <option value="">Select student</option>
            {students.map(student => (
              <option key={student._id} value={student._id}>
                {student.name} — {student.admissionId}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (₹)">
            <input
              required
              min="1"
              type="number"
              step="0.01"
              className="input w-full"
              value={form.amountPaid}
              onChange={event =>
                setForm({ ...form, amountPaid: event.target.value })
              }
            />
          </Field>

          <Field label="Payment Mode">
            <select
              className="input w-full"
              value={form.paymentMode}
              onChange={event =>
                setForm({ ...form, paymentMode: event.target.value })
              }
            >
              {Object.entries(modes).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Installment / Fee Month">
            <input
              className="input w-full"
              value={form.installmentLabel}
              onChange={event =>
                setForm({ ...form, installmentLabel: event.target.value })
              }
              placeholder="e.g. October 2026"
            />
          </Field>

          <Field label="Transaction Ref">
            <input
              className="input w-full"
              value={form.transactionRef}
              onChange={event =>
                setForm({ ...form, transactionRef: event.target.value })
              }
            />
          </Field>
        </div>

        <Field label="Remarks">
          <textarea
            className="input w-full min-h-20"
            value={form.remarks}
            onChange={event =>
              setForm({ ...form, remarks: event.target.value })
            }
          />
        </Field>

        <ModalButtons onClose={onClose} saving={saving} />
      </form>
    </Modal>
  );
}

function UniversityModal({
  title, form, setForm, students, saving,
  user, pending, onClose, onSubmit
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Student">
          <select
            required
            disabled={title.startsWith('Edit')}
            className="input w-full"
            value={form.studentId}
            onChange={event =>
              setForm({ ...form, studentId: event.target.value })
            }
          >
            <option value="">Select student</option>
            {students.map(student => (
              <option key={student._id} value={student._id}>
                {student.name} — {student.admissionId}
                {' '}(University: {money(student.universityFee)})
              </option>
            ))}
          </select>
        </Field>

        {pending !== null && (
          <div className="rounded-xl bg-violet-50 border border-violet-100 p-3 text-sm">
            University pending for selected student: <b>{money(pending)}</b>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (₹)">
            <input
              required
              min="1"
              type="number"
              step="0.01"
              max={pending || undefined}
              className="input w-full"
              value={form.amountPaid}
              onChange={event =>
                setForm({ ...form, amountPaid: event.target.value })
              }
            />
          </Field>

          <Field label="Payment Mode">
            <select
              className="input w-full"
              value={form.paymentMode}
              onChange={event =>
                setForm({ ...form, paymentMode: event.target.value })
              }
            >
              {Object.entries(modes).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Transaction Ref">
          <input
            className="input w-full"
            value={form.transactionRef}
            onChange={event =>
              setForm({ ...form, transactionRef: event.target.value })
            }
          />
        </Field>

        <Field label="Remarks">
          <textarea
            className="input w-full min-h-20"
            value={form.remarks}
            onChange={event =>
              setForm({ ...form, remarks: event.target.value })
            }
          />
        </Field>

        {user.role !== 'admin' && title.startsWith('Edit') && (
          <p className="text-xs text-slate-400">
            Only admin can change the amount or payment mode after recording.
          </p>
        )}

        <ModalButtons onClose={onClose} saving={saving} />
      </form>
    </Modal>
  );
}

/* =========================
   SUMMARY MODAL
========================= */

function SummaryModal({ summary, money, onClose, onViewStudent }) {
  const labels = {
    studentCollection: 'Student Collection Summary',
    universityPaid: 'University Payment Summary',
    studentPending: 'Student Pending Summary',
    universityPending: 'University Pending Summary'
  };

  const rows = summary.data || [];

  const total = rows.reduce((sum, item) => {
    if (summary.type === 'studentCollection' || summary.type === 'universityPaid') {
      return sum + Number(item.amountPaid || 0);
    }

    return sum + Number(
      summary.type === 'studentPending'
        ? item.studentPending || 0
        : item.universityPending || 0
    );
  }, 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-xl"
        onMouseDown={event => event.stopPropagation()}
      >
        <div className="p-5 border-b flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-900">
              {labels[summary.type]}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {rows.length} records • {money(total)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-auto max-h-[65vh]">
          {rows.length ? (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white border-b">
                <tr className="text-left text-xs text-slate-400">
                  <th className="p-3">Student</th>
                  <th className="p-3">Admission ID</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((item, index) => {
                  const student = item.student || {};

                  const amount =
                    summary.type === 'studentCollection' ||
                    summary.type === 'universityPaid'
                      ? item.amountPaid
                      : summary.type === 'studentPending'
                        ? item.studentPending
                        : item.universityPending;

                  return (
                    <tr
                      key={item._id || student._id || index}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >
                      <td className="p-3 font-semibold">
                        {student.name || '—'}
                      </td>
                      <td className="p-3 text-slate-500">
                        {student.admissionId || '—'}
                      </td>
                      <td className={`p-3 font-bold ${
                        summary.type === 'studentPending' ||
                        summary.type === 'universityPending'
                          ? 'text-rose-600'
                          : 'text-slate-900'
                      }`}>
                        {money(amount)}
                      </td>
                      <td className="p-3 text-slate-500">
                        {item.paymentDate
                          ? new Date(item.paymentDate).toLocaleDateString('en-IN')
                          : '—'}
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => onViewStudent(student)}
                          className="p-2 rounded-lg hover:bg-slate-100"
                          title="View student details"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-10">
              <EmptyState
                title="No records found"
                description="There are no records available for this summary."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================
   STUDENT FEE DETAIL MODAL
========================= */

function DetailModal({ data, money, onClose }) {
  const fee = data.fee || {};
  const studentPayment = data.studentPayment || {};
  const universityPayment = data.universityPayment || {};
  const institute = data.institute || {};

  const fields = [
    ['Total Fee', fee.totalFee],
    ['Discount', fee.discount],
    ['Net Fee', fee.netFee],
    ['University Fee', fee.universityFee],
    ['Student Paid', studentPayment.paid],
    ['Student Pending', studentPayment.pending],
    ['University Paid', universityPayment.paid],
    ['University Pending', universityPayment.pending],
    ['Institute Expected', institute.expected],
    ['Institute Received', institute.received]
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl p-5"
        onMouseDown={event => event.stopPropagation()}
      >
        <div className="flex justify-between">
          <div>
            <h3 className="font-bold text-lg">{data.student?.name}</h3>
            <p className="text-xs text-slate-400">
              {data.student?.admissionId}
            </p>
          </div>

          <button onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {fields.map(([label, value]) => (
            <div key={label} className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] text-slate-400">{label}</p>
              <p className="font-bold mt-1">{money(value)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
