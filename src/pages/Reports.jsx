import React, { useState } from 'react';
import toast from 'react-hot-toast';

import {
  Download,
  FileText,
  BarChart3,
  IndianRupee,
  ClipboardCheck,
  UserPlus,
  Wallet,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import AppShell from '../components/AppShell';
import { PageHeader } from '../components/ui';
import api from '../api/axios';

/* =========================================================
   REPORT CONFIGURATION
========================================================= */

const reports = [
  {
    key: 'fees',
    label: 'Fee Collection Report',
    description:
      'Complete payment collection details with receipt number, student, amount and payment mode.',
    icon: IndianRupee,
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    gradient: 'from-emerald-500 to-green-600',
  },

  {
    key: 'fee-defaulters',
    label: 'Fee Defaulters Report',
    description:
      'Students with outstanding fee balances, total payable, paid amount and pending amount.',
    icon: AlertCircle,
    bg: 'bg-red-50',
    text: 'text-red-600',
    gradient: 'from-red-500 to-rose-600',
  },

  {
    key: 'attendance',
    label: 'Attendance Report',
    description:
      'Attendance records with date, student, admission ID, batch and attendance status.',
    icon: ClipboardCheck,
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    gradient: 'from-blue-500 to-indigo-600',
  },

  {
    key: 'leads',
    label: 'Lead Report',
    description:
      'Complete lead information including source, priority, stage, course and owner.',
    icon: UserPlus,
    bg: 'bg-violet-50',
    text: 'text-violet-600',
    gradient: 'from-violet-500 to-purple-600',
  },

  {
    key: 'expenses',
    label: 'Expense Report',
    description:
      'All recorded expenses with date, category, title, amount and recorded by.',
    icon: Wallet,
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    gradient: 'from-orange-500 to-amber-600',
  },
];

/* =========================================================
   PDF TABLE CONFIGURATION
========================================================= */

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
      item.student?.name || item.studentName || item.student || '-',
      item.student?.admissionId || item.admissionId || '-',
      formatCurrency(item.amountPaid ?? item.amount),
      formatValue(item.paymentMode || item.mode),
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
      item.student?.name || item.studentName || item.name || '-',
      item.student?.admissionId ||
        item.admissionId ||
        '-',
      item.course?.name || item.courseName || item.course || '-',
      formatCurrency(
        item.totalFee ??
          item.totalAmount ??
          item.feeAmount ??
          item.payable
      ),
      formatCurrency(
        item.paid ??
          item.totalPaid ??
          item.amountPaid
      ),
      formatCurrency(
        item.pending ??
          item.pendingAmount ??
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
      item.student?.name || item.studentName || item.student || '-',
      item.student?.admissionId ||
        item.admissionId ||
        '-',
      item.batch?.name || item.batchName || item.batch || '-',
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
        item.courseName ||
        '-',
      formatValue(item.source),
      formatValue(item.priority),
      formatValue(item.stage),
      item.assignedTo?.name ||
        item.leadOwner?.name ||
        item.owner?.name ||
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
      item.recordedBy?.name ||
        item.recordedByName ||
        '-',
    ],
  },
};

/* =========================================================
   FORMAT HELPERS
========================================================= */

function formatCurrency(value) {
  const amount = Number(value || 0);

  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatDate(value) {
  if (!value) return '-';

  try {
    return new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/* =========================================================
   EXTRACT ROWS FROM API RESPONSE
========================================================= */

function extractRows(data, key) {
  const possibleKeys = {
    fees: ['rows', 'payments', 'fees', 'data'],

    'fee-defaulters': [
      'rows',
      'defaulters',
      'students',
      'data',
    ],

    attendance: [
      'rows',
      'attendance',
      'records',
      'data',
    ],

    leads: ['rows', 'leads', 'data'],

    expenses: ['rows', 'expenses', 'data'],
  };

  const keys = possibleKeys[key] || ['rows', 'data'];

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

/* =========================================================
   PDF HEADER
========================================================= */

function addPdfHeader(doc, title, count = 0) {
  const pageWidth = doc.internal.pageSize.getWidth();

  /* ---------- Header Background ---------- */

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 43, 'F');

  /* ---------- Decorative Accent ---------- */

  doc.setFillColor(99, 102, 241);
  doc.rect(0, 40, pageWidth, 3, 'F');

  /* ---------- Logo ---------- */

  doc.setFillColor(255, 255, 255);

  doc.roundedRect(
    14,
    8,
    26,
    26,
    6,
    6,
    'F'
  );

  doc.setTextColor(79, 70, 229);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);

  doc.text('S', 27, 26, {
    align: 'center',
  });

  /* ---------- Institute Name ---------- */

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);

  doc.text('SUCCESS POINT', 47, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);

  doc.text(
    'Education & Training Institute',
    47,
    27
  );

  /* ---------- Report Title ---------- */

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);

  doc.text(title, 14, 57);

  /* ---------- Generated Date ---------- */

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);

  doc.text(
    `Generated on ${new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`,
    14,
    64
  );

  /* ---------- Record Count ---------- */

  if (count >= 0) {
    doc.setFillColor(238, 242, 255);

    doc.roundedRect(
      pageWidth - 55,
      50,
      41,
      16,
      4,
      4,
      'F'
    );

    doc.setTextColor(79, 70, 229);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);

    doc.text(
      `${count} Records`,
      pageWidth - 34.5,
      60,
      {
        align: 'center',
      }
    );
  }
}

/* =========================================================
   PDF FOOTER
========================================================= */

function addPdfFooter(doc) {
  const pageCount =
    doc.internal.getNumberOfPages();

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);

    const pageWidth =
      doc.internal.pageSize.getWidth();

    const pageHeight =
      doc.internal.pageSize.getHeight();

    /* ---------- Footer Line ---------- */

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);

    doc.line(
      14,
      pageHeight - 17,
      pageWidth - 14,
      pageHeight - 17
    );

    /* ---------- Footer Left ---------- */

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);

    doc.text(
      'Success Point CRM',
      14,
      pageHeight - 10
    );

    /* ---------- Footer Center ---------- */

    doc.text(
      'Generated from CRM',
      pageWidth / 2,
      pageHeight - 10,
      {
        align: 'center',
      }
    );

    /* ---------- Page Number ---------- */

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

/* =========================================================
   GENERATE PDF
========================================================= */

function generatePdf(key, rows) {
  const config = reportColumns[key];

  if (!config) {
    throw new Error(
      'PDF configuration not found'
    );
  }

  /* ---------- Orientation ---------- */

  const orientation =
    config.columns.length > 6
      ? 'landscape'
      : 'portrait';

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth =
    doc.internal.pageSize.getWidth();

  /* ---------- Header ---------- */

  addPdfHeader(
    doc,
    config.title,
    rows.length
  );

  /* ---------- Table ---------- */

  autoTable(doc, {
    startY: 73,

    head: [config.columns],

    body: rows.map((item) =>
      config.mapRow(item)
    ),

    theme: 'grid',

    margin: {
      top: 73,
      left: 14,
      right: 14,
      bottom: 23,
    },

    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 3,

      textColor: [30, 41, 59],

      lineColor: [226, 232, 240],
      lineWidth: 0.2,

      valign: 'middle',

      overflow: 'linebreak',
    },

    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],

      fontStyle: 'bold',
      fontSize: 7.5,

      halign: 'left',
      valign: 'middle',

      cellPadding: 3.2,
    },

    bodyStyles: {
      minCellHeight: 8,
    },

    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },

    /* ---------- Column Alignment ---------- */

    columnStyles: {
      0: {
        cellWidth:
          config.columns.length <= 5
            ? 30
            : 25,
      },
    },

    /* ---------- Page Header ---------- */

    didDrawPage: () => {
      addPdfHeader(
        doc,
        config.title,
        rows.length
      );
    },

    /* ---------- Footer Space ---------- */

    didParseCell: (data) => {
      if (
        data.section === 'body' &&
        data.column.index ===
          config.columns.length - 1
      ) {
        data.cell.styles.fontStyle =
          'normal';
      }
    },
  });

  /* ---------- Footer ---------- */

  addPdfFooter(doc);

  /* ---------- Save ---------- */

  const fileName = `${key}-report-${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;

  doc.save(fileName);
}

/* =========================================================
   REPORT CARD
========================================================= */

function ReportCard({
  report,
  downloading,
  onDownloadPdf,
}) {
  const Icon = report.icon;

  return (
    <div
      className="
        group relative overflow-hidden
        rounded-2xl border border-ink-100
        bg-white p-5
        shadow-sm
        transition-all duration-300
        hover:-translate-y-1
        hover:border-indigo-200
        hover:shadow-xl
      "
    >
      {/* Decorative Background */}

      <div
        className="
          absolute -right-14 -top-14
          h-36 w-36 rounded-full
          bg-indigo-50
          opacity-70
          transition-transform duration-500
          group-hover:scale-150
        "
      />

      <div className="relative">
        {/* ---------- Top ---------- */}

        <div className="flex items-start justify-between gap-3">
          <div
            className={`
              flex h-12 w-12 items-center
              justify-center rounded-2xl
              ${report.bg} ${report.text}
              shadow-sm
            `}
          >
            <Icon size={21} />
          </div>

          <div
            className="
              rounded-full
              bg-indigo-50
              px-2.5 py-1
              text-[9px]
              font-bold
              uppercase
              tracking-wider
              text-indigo-600
            "
          >
            PDF
          </div>
        </div>

        {/* ---------- Content ---------- */}

        <div className="mt-5">
          <h3
            className="
              text-sm
              font-bold
              text-ink-950
            "
          >
            {report.label}
          </h3>

          <p
            className="
              mt-1.5
              min-h-[52px]
              text-xs
              leading-relaxed
              text-ink-500
            "
          >
            {report.description}
          </p>
        </div>

        {/* ---------- Button ---------- */}

        <div
          className="
            mt-5
            border-t border-ink-100
            pt-4
          "
        >
          <button
            type="button"
            disabled={!!downloading}
            onClick={onDownloadPdf}
            className={`
              relative
              flex w-full
              items-center justify-center
              gap-2
              overflow-hidden
              rounded-xl
              bg-gradient-to-r
              ${report.gradient}
              px-4 py-3
              text-xs
              font-bold
              text-white
              shadow-md
              transition-all
              duration-300
              hover:-translate-y-0.5
              hover:shadow-lg
              active:translate-y-0
              disabled:cursor-not-allowed
              disabled:opacity-60
            `}
          >
            {downloading === 'pdf' ? (
              <>
                <Loader2
                  size={16}
                  className="animate-spin"
                />

                Generating PDF...
              </>
            ) : (
              <>
                <Download size={16} />

                Download PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Reports() {
  const [downloading, setDownloading] =
    useState(null);

  /* =======================================================
     DOWNLOAD PDF
  ======================================================= */

  const downloadPdf = async (key) => {
    try {
      setDownloading(`${key}-pdf`);

      /* -----------------------------------------------
         Backend only returns JSON data.
         PDF is generated completely in frontend.
      ------------------------------------------------ */

      const response = await api.get(
        `/reports/${key}`
      );

      const rows = extractRows(
        response.data,
        key
      );

      if (!rows.length) {
        toast.error(
          'No data available for this report'
        );

        return;
      }

      /* ---------- Generate PDF ---------- */

      generatePdf(key, rows);

      toast.success(
        'PDF report downloaded successfully'
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

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppShell title="Reports">
      <div className="space-y-6">

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <PageHeader
          title="Reports"
          description="
            Generate professional PDF reports directly
            from your Success Point CRM data.
          "
        />

        {/* =================================================
            PREMIUM SUMMARY BANNER
        ================================================= */}

        <div
          className="
            relative
            overflow-hidden
            rounded-2xl
            bg-gradient-to-br
            from-ink-950
            via-indigo-950
            to-violet-950
            p-5
            text-white
            shadow-xl
          "
        >
          {/* Background Glow */}

          <div
            className="
              absolute
              -right-16
              -top-16
              h-48
              w-48
              rounded-full
              bg-indigo-500/20
              blur-2xl
            "
          />

          <div
            className="
              absolute
              -bottom-20
              left-1/3
              h-40
              w-40
              rounded-full
              bg-violet-500/20
              blur-2xl
            "
          />

          <div
            className="
              relative
              flex
              flex-col
              gap-5
              md:flex-row
              md:items-center
              md:justify-between
            "
          >
            {/* ---------- Left ---------- */}

            <div className="flex items-center gap-4">
              <div
                className="
                  flex
                  h-14
                  w-14
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/10
                  shadow-lg
                  backdrop-blur
                "
              >
                <BarChart3 size={25} />
              </div>

              <div>
                <h2
                  className="
                    text-lg
                    font-bold
                  "
                >
                  Business Reports
                </h2>

                <p
                  className="
                    mt-1
                    max-w-xl
                    text-xs
                    leading-relaxed
                    text-white/60
                  "
                >
                  Generate clean, professional and
                  print-ready PDF reports for fees,
                  attendance, leads and expenses.
                </p>
              </div>
            </div>

            {/* ---------- Right ---------- */}

            <div
              className="
                flex
                shrink-0
                items-center
                gap-2
              "
            >
              <div
                className="
                  rounded-xl
                  border
                  border-white/10
                  bg-white/10
                  px-4 py-2.5
                  backdrop-blur
                "
              >
                <p
                  className="
                    text-[9px]
                    uppercase
                    tracking-wider
                    text-white/50
                  "
                >
                  Available
                </p>

                <p
                  className="
                    mt-0.5
                    text-sm
                    font-bold
                  "
                >
                  {reports.length} PDF Reports
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            REPORT CARDS
        ================================================= */}

        <div>
          <div
            className="
              mb-4
              flex
              items-center
              justify-between
            "
          >
            <div>
              <h3
                className="
                  text-sm
                  font-bold
                  text-ink-950
                "
              >
                Available Reports
              </h3>

              <p
                className="
                  mt-0.5
                  text-xs
                  text-ink-500
                "
              >
                Select any report to generate a
                professional A4 PDF.
              </p>
            </div>
          </div>

          <div
            className="
              grid
              grid-cols-1
              gap-4
              md:grid-cols-2
              xl:grid-cols-3
            "
          >
            {reports.map((report) => (
              <ReportCard
                key={report.key}
                report={report}
                downloading={
                  downloading?.startsWith(
                    report.key
                  )
                    ? 'pdf'
                    : null
                }
                onDownloadPdf={() =>
                  downloadPdf(report.key)
                }
              />
            ))}
          </div>
        </div>

        {/* =================================================
            INFORMATION CARDS
        ================================================= */}

        <div
          className="
            grid
            grid-cols-1
            gap-4
            md:grid-cols-3
          "
        >
          {/* PDF Format */}

          <div
            className="
              rounded-2xl
              border border-ink-100
              bg-white
              p-4
              shadow-sm
              transition
              hover:-translate-y-0.5
              hover:shadow-md
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  flex h-10 w-10
                  items-center justify-center
                  rounded-xl
                  bg-violet-50
                  text-violet-600
                "
              >
                <FileText size={18} />
              </div>

              <div>
                <p
                  className="
                    text-xs
                    font-bold
                    text-ink-950
                  "
                >
                  PDF Format
                </p>

                <p
                  className="
                    mt-0.5
                    text-[10px]
                    text-ink-500
                  "
                >
                  Professional A4 printable format
                </p>
              </div>
            </div>
          </div>

          {/* Frontend Generation */}

          <div
            className="
              rounded-2xl
              border border-ink-100
              bg-white
              p-4
              shadow-sm
              transition
              hover:-translate-y-0.5
              hover:shadow-md
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  flex h-10 w-10
                  items-center justify-center
                  rounded-xl
                  bg-indigo-50
                  text-indigo-600
                "
              >
                <BarChart3 size={18} />
              </div>

              <div>
                <p
                  className="
                    text-xs
                    font-bold
                    text-ink-950
                  "
                >
                  Instant Generation
                </p>

                <p
                  className="
                    mt-0.5
                    text-[10px]
                    text-ink-500
                  "
                >
                  PDF created directly in browser
                </p>
              </div>
            </div>
          </div>

          {/* No Paid Service */}

          <div
            className="
              rounded-2xl
              border border-ink-100
              bg-white
              p-4
              shadow-sm
              transition
              hover:-translate-y-0.5
              hover:shadow-md
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  flex h-10 w-10
                  items-center justify-center
                  rounded-xl
                  bg-emerald-50
                  text-emerald-600
                "
              >
                <CheckCircle2 size={18} />
              </div>

              <div>
                <p
                  className="
                    text-xs
                    font-bold
                    text-ink-950
                  "
                >
                  No Paid Service
                </p>

                <p
                  className="
                    mt-0.5
                    text-[10px]
                    text-ink-500
                  "
                >
                  Generated using jsPDF
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
