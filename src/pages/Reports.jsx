import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  FileSpreadsheet,
  Download,
  FileText,
  ChevronDown,
  BarChart3,
  IndianRupee,
  Users,
  ClipboardCheck,
  UserPlus,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from 'lucide-react';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import AppShell from '../components/AppShell';
import { PageHeader } from '../components/ui';
import api from '../api/axios';

const reports = [
  {
    key: 'fees',
    label: 'Fee Collection Report',
    description:
      'Every payment received, with receipt numbers, students and payment modes.',
    icon: IndianRupee,
    gradient: 'from-emerald-500 to-green-600',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
  },
  {
    key: 'fee-defaulters',
    label: 'Fee Defaulters Report',
    description:
      'Students with pending fee balances and outstanding amounts.',
    icon: AlertCircle,
    gradient: 'from-red-500 to-rose-600',
    bg: 'bg-red-50',
    text: 'text-red-600',
  },
  {
    key: 'attendance',
    label: 'Attendance Report',
    description:
      'Daily attendance records across batches and students.',
    icon: ClipboardCheck,
    gradient: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
  },
  {
    key: 'leads',
    label: 'Lead Report',
    description:
      'All leads with stage, source, priority and ownership.',
    icon: UserPlus,
    gradient: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    text: 'text-violet-600',
  },
  {
    key: 'expenses',
    label: 'Expense Report',
    description:
      'All recorded expenses with categories, amounts and dates.',
    icon: Wallet,
    gradient: 'from-orange-500 to-amber-600',
    bg: 'bg-orange-50',
    text: 'text-orange-600',
  },
];

const reportColumns = {
  fees: {
    title: 'Fee Collection Report',
    columns: [
      'Date',
      'Receipt No.',
      'Student',
      'Admission ID',
      'Amount',
      'Mode',
    ],
    mapRow: (item) => [
      formatDate(item.paymentDate || item.date),
      item.receiptNumber || '-',
      item.student?.name || item.studentName || '-',
      item.student?.admissionId ||
        item.admissionId ||
        '-',
      formatCurrency(item.amountPaid || item.amount),
      formatValue(item.paymentMode),
    ],
  },

  'fee-defaulters': {
    title: 'Fee Defaulters Report',
    columns: [
      'Student',
      'Admission ID',
      'Course',
      'Total Fee',
      'Paid',
      'Pending',
    ],
    mapRow: (item) => [
      item.student?.name || item.studentName || '-',
      item.student?.admissionId ||
        item.admissionId ||
        '-',
      item.course?.name || item.courseName || '-',
      formatCurrency(
        item.totalFee ||
          item.totalAmount ||
          item.feeAmount
      ),
      formatCurrency(
        item.paid ||
          item.totalPaid ||
          item.amountPaid
      ),
      formatCurrency(
        item.pending ||
          item.pendingAmount ||
          item.balance
      ),
    ],
  },

  attendance: {
    title: 'Attendance Report',
    columns: [
      'Date',
      'Student',
      'Admission ID',
      'Batch',
      'Status',
    ],
    mapRow: (item) => [
      formatDate(item.date || item.attendanceDate),
      item.student?.name || item.studentName || '-',
      item.student?.admissionId ||
        item.admissionId ||
        '-',
      item.batch?.name || item.batchName || '-',
      formatValue(item.status),
    ],
  },

  leads: {
    title: 'Lead Report',
    columns: [
      'Name',
      'Phone',
      'Course',
      'Source',
      'Priority',
      'Stage',
      'Owner',
    ],
    mapRow: (item) => [
      item.fullName || item.name || '-',
      item.phone || '-',
      item.interestedCourse?.name ||
        item.course?.name ||
        '-',
      formatValue(item.source),
      formatValue(item.priority),
      formatValue(item.stage),
      item.assignedTo?.name ||
        item.leadOwner?.name ||
        '-',
    ],
  },

  expenses: {
    title: 'Expense Report',
    columns: [
      'Date',
      'Title',
      'Category',
      'Amount',
      'Recorded By',
    ],
    mapRow: (item) => [
      formatDate(item.date),
      item.title || '-',
      formatValue(item.category),
      formatCurrency(item.amount),
      item.recordedBy?.name || '-',
    ],
  },
};

function formatCurrency(value) {
  const amount = Number(value || 0);

  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatDate(value) {
  if (!value) return '-';

  try {
    return new Date(value).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );
  } catch {
    return '-';
  }
}

function formatValue(value) {
  if (!value) return '-';

  return String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

function extractRows(data, key) {
  /*
   * Supports common API response shapes.
   * If your backend returns:
   * { payments: [...] }
   * { expenses: [...] }
   * etc., it will pick those automatically.
   */

  const possibleKeys = {
    fees: ['payments', 'fees', 'data'],
    'fee-defaulters': [
      'defaulters',
      'students',
      'data',
    ],
    attendance: [
      'attendance',
      'records',
      'data',
    ],
    leads: ['leads', 'data'],
    expenses: ['expenses', 'data'],
  };

  const keys = possibleKeys[key] || ['data'];

  for (const responseKey of keys) {
    if (Array.isArray(data?.[responseKey])) {
      return data[responseKey];
    }
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
}

function getFileName(key) {
  return `${key}-report`;
}

function addPdfHeader(doc, title) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header background
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Logo box
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(
    14,
    9,
    24,
    24,
    5,
    5,
    'F'
  );

  doc.setTextColor(79, 70, 229);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('S', 26, 26, {
    align: 'center',
  });

  // Institute name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('SUCCESS POINT', 46, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(
    'Education & Training Institute',
    46,
    27
  );

  // Report title
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(title, 14, 56);

  // Generated date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);

  doc.text(
    `Generated on ${new Date().toLocaleString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    )}`,
    14,
    63
  );
}

function addPdfFooter(doc) {
  const pageCount =
    doc.internal.getNumberOfPages();

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);

    const pageWidth =
      doc.internal.pageSize.getWidth();

    const pageHeight =
      doc.internal.pageSize.getHeight();

    doc.setDrawColor(226, 232, 240);

    doc.line(
      14,
      pageHeight - 17,
      pageWidth - 14,
      pageHeight - 17
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);

    doc.text(
      'Success Point CRM',
      14,
      pageHeight - 10
    );

    doc.text(
      `Page ${page} of ${pageCount}`,
      pageWidth - 14,
      pageHeight - 10,
      {
        align: 'right',
      }
    );
  }
}

function generatePdf(key, rows) {
  const config = reportColumns[key];

  if (!config) {
    throw new Error(
      'PDF configuration not found'
    );
  }

  const doc = new jsPDF({
    orientation:
      config.columns.length > 6
        ? 'landscape'
        : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  addPdfHeader(doc, config.title);

  autoTable(doc, {
    startY: 72,

    head: [config.columns],

    body: rows.map((item) =>
      config.mapRow(item)
    ),

    theme: 'grid',

    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 3,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      valign: 'middle',
    },

    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },

    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },

    margin: {
      left: 14,
      right: 14,
      top: 72,
      bottom: 22,
    },

    didDrawPage: () => {
      addPdfHeader(doc, config.title);
    },
  });

  addPdfFooter(doc);

  doc.save(`${getFileName(key)}.pdf`);
}

function ReportCard({
  report,
  downloading,
  onDownloadExcel,
  onDownloadPdf,
}) {
  const Icon = report.icon;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-ink-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-ink-200 hover:shadow-xl">
      {/* Decorative circle */}
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-ink-50 opacity-60 transition-transform duration-500 group-hover:scale-150" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${report.bg} ${report.text}`}
          >
            <Icon size={21} />
          </div>

          <div className="rounded-full bg-ink-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-ink-500">
            Report
          </div>
        </div>

        {/* Content */}
        <div className="mt-5">
          <h3 className="text-sm font-bold text-ink-950">
            {report.label}
          </h3>

          <p className="mt-1.5 min-h-[38px] text-xs leading-relaxed text-ink-500">
            {report.description}
          </p>
        </div>

        {/* Bottom */}
        <div className="mt-5 flex flex-col gap-2 border-t border-ink-100 pt-4 sm:flex-row">
          <button
            type="button"
            disabled={!!downloading}
            onClick={onDownloadExcel}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloading === 'excel' ? (
              <Loader2
                size={15}
                className="animate-spin"
              />
            ) : (
              <FileSpreadsheet size={15} />
            )}

            Excel
          </button>

          <button
            type="button"
            disabled={!!downloading}
            onClick={onDownloadPdf}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloading === 'pdf' ? (
              <Loader2
                size={15}
                className="animate-spin"
              />
            ) : (
              <FileText size={15} />
            )}

            PDF
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Reports() {
  const [downloading, setDownloading] =
    useState(null);

  const downloadExcel = async (key) => {
    try {
      setDownloading(`${key}-excel`);

      const res = await api.get(
        `/reports/${key}`,
        {
          responseType: 'blob',
        }
      );

      const blob = new Blob([res.data], {
        type:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const url =
        window.URL.createObjectURL(blob);

      const a =
        document.createElement('a');

      a.href = url;
      a.download = `${getFileName(
        key
      )}.xlsx`;

      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);

      toast.success(
        'Excel report downloaded'
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Could not download Excel report'
      );
    } finally {
      setDownloading(null);
    }
  };

  const downloadPdf = async (key) => {
    try {
      setDownloading(`${key}-pdf`);

      /*
       * Fetch the same report data from backend.
       *
       * If your backend currently returns Excel from
       * /reports/:key only, this code first tries to
       * use the JSON response endpoint pattern.
       */

      let data;

      try {
        const response = await api.get(
          `/reports/${key}/data`
        );

        data = response.data;
      } catch {
        /*
         * Fallback:
         * Try the normal endpoint without blob.
         *
         * This works if your backend endpoint can
         * return JSON based on Accept header.
         */

        const response = await api.get(
          `/reports/${key}`,
          {
            headers: {
              Accept: 'application/json',
            },
          }
        );

        data = response.data;
      }

      const rows = extractRows(data, key);

      if (!rows.length) {
        toast.error(
          'No data available for this report'
        );
        return;
      }

      generatePdf(key, rows);

      toast.success(
        'PDF report downloaded'
      );
    } catch (err) {
      console.error(
        'PDF report error:',
        err
      );

      toast.error(
        err.response?.data?.message ||
          'Could not generate PDF report'
      );
    } finally {
      setDownloading(null);
    }
  };

  return (
    <AppShell title="Reports">
      <div className="space-y-6">
        {/* =====================================================
            HEADER
        ====================================================== */}
        <PageHeader
          title="Reports"
          description="Generate professional Excel and PDF reports from your Success Point CRM data."
        />

        {/* =====================================================
            REPORT SUMMARY BANNER
        ====================================================== */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink-950 via-indigo-950 to-violet-950 p-5 text-white shadow-xl">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/20 blur-2xl" />

          <div className="absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-violet-500/20 blur-2xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur">
                <BarChart3 size={24} />
              </div>

              <div>
                <h2 className="text-lg font-bold">
                  Business Reports
                </h2>

                <p className="mt-1 max-w-xl text-xs leading-relaxed text-white/60">
                  Download your institute's financial,
                  attendance, lead and expense data in
                  Excel or professionally formatted PDF.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur">
                <p className="text-[9px] uppercase tracking-wider text-white/50">
                  Available
                </p>

                <p className="mt-0.5 text-sm font-bold">
                  {reports.length} Reports
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            REPORT CARDS
        ====================================================== */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink-950">
                Available Reports
              </h3>

              <p className="mt-0.5 text-xs text-ink-500">
                Choose Excel for data analysis or PDF for
                printing and sharing.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {reports.map((report) => (
              <ReportCard
                key={report.key}
                report={report}
                downloading={
                  downloading?.startsWith(
                    report.key
                  )
                    ? downloading.split('-').pop()
                    : null
                }
                onDownloadExcel={() =>
                  downloadExcel(report.key)
                }
                onDownloadPdf={() =>
                  downloadPdf(report.key)
                }
              />
            ))}
          </div>
        </div>

        {/* =====================================================
            INFORMATION
        ====================================================== */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <FileSpreadsheet size={18} />
              </div>

              <div>
                <p className="text-xs font-bold text-ink-950">
                  Excel Export
                </p>

                <p className="mt-0.5 text-[10px] text-ink-500">
                  Ideal for filtering and analysis
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <FileText size={18} />
              </div>

              <div>
                <p className="text-xs font-bold text-ink-950">
                  PDF Export
                </p>

                <p className="mt-0.5 text-[10px] text-ink-500">
                  Professional A4 printable format
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <CheckCircle2 size={18} />
              </div>

              <div>
                <p className="text-xs font-bold text-ink-950">
                  No Paid Service
                </p>

                <p className="mt-0.5 text-[10px] text-ink-500">
                  Reports generated directly in your CRM
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}