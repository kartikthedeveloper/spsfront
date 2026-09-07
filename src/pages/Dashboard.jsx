import React, { useEffect, useState } from 'react';
import {
  Users,
  Target,
  CalendarClock,
  Wallet,
  TrendingUp,
  CheckSquare,
  DollarSign,
  CalendarDays,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

import AppShell from '../components/AppShell';
import { StatCard } from '../components/ui';
import api from '../api/axios';

const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);

  /* =========================================================
     LOAD SUMMARY
  ========================================================= */

  useEffect(() => {
    api
      .get('/dashboard/summary')
      .then(({ data }) => setSummary(data))
      .catch((error) => {
        console.error('Dashboard summary error:', error);
      });
  }, []);

  /* =========================================================
     LOAD MONTHLY TREND
  ========================================================= */

  useEffect(() => {
    api
      .get('/dashboard/trend')
      .then(({ data }) => {
        const currentYear = new Date().getFullYear();

        const filled = Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          label: monthNames[i],
          year: currentYear,
          amount: 0,
        }));

        data.trend.forEach((item) => {
          if (item._id.year === currentYear) {
            const index = item._id.month - 1;

            if (index >= 0 && index < 12) {
              filled[index].amount = item.total;
            }
          }
        });

        setMonthlyData(filled);
      })
      .catch((error) => {
        console.error('Dashboard trend error:', error);
      });
  }, []);

  /* =========================================================
     HELPERS
  ========================================================= */

  const formatCurrency = (value) =>
    `₹${(value ?? 0).toLocaleString('en-IN')}`;

  const currentYear = new Date().getFullYear();

  /* =========================================================
     SMALL REUSABLE ROW
  ========================================================= */

  const SummaryRow = ({
    icon: Icon,
    label,
    value,
    tone = 'default',
  }) => {
    const toneClasses = {
      default: {
        icon: 'bg-slate-100 text-slate-500',
        value: 'text-slate-900',
      },
      danger: {
        icon: 'bg-rose-50 text-rose-500',
        value: 'text-rose-600',
      },
      success: {
        icon: 'bg-emerald-50 text-emerald-500',
        value: 'text-emerald-600',
      },
    };

    const selected = toneClasses[tone] || toneClasses.default;

    return (
      <div
        className="
          group
          flex items-center justify-between
          rounded-xl
          px-2 py-2.5
          transition-all duration-200
          hover:bg-slate-50
        "
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`
              h-8 w-8
              rounded-lg
              flex items-center justify-center
              ${selected.icon}
              shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]
              transition-all duration-200
              group-hover:scale-105
            `}
          >
            <Icon size={14} />
          </div>

          <span className="text-xs font-medium text-slate-500">
            {label}
          </span>
        </div>

        <span
          className={`
            text-sm
            font-bold
            ${selected.value}
          `}
        >
          {value}
        </span>
      </div>
    );
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <AppShell title="Dashboard">

      {/* =====================================================
          WELCOME / OVERVIEW BANNER
      ===================================================== */}

      <div
        className="
          relative
          overflow-hidden
          mb-6
          rounded-2xl
          px-6 py-5

          bg-gradient-to-r
          from-[#21115f]
          via-[#32177c]
          to-[#4c1d95]

          text-white

          border border-white/10

          shadow-[0_12px_35px_rgba(49,24,110,0.18)]
        "
      >
        {/* Background glow */}
        <div
          className="
            absolute
            -right-16 -top-20
            h-48 w-48
            rounded-full
            bg-purple-400/20
            blur-3xl
          "
        />

        <div
          className="
            absolute
            right-20 bottom-[-70px]
            h-40 w-40
            rounded-full
            bg-indigo-400/10
            blur-3xl
          "
        />

        <div className="relative flex items-center justify-between">
          <div>
            <p
              className="
                text-[9px]
                uppercase
                tracking-[0.2em]
                text-white/45
                font-bold
                mb-1
              "
            >
              Success Point CRM
            </p>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Dashboard Overview
            </h2>

            <p className="text-xs text-white/55 mt-1">
              Monitor students, leads, collections and daily operations.
            </p>
          </div>

          <div
            className="
              hidden sm:flex
              h-11 w-11
              rounded-xl
              items-center justify-center
              bg-white/10
              border border-white/10
              shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]
            "
          >
            <ArrowUpRight size={19} />
          </div>
        </div>
      </div>


      {/* =====================================================
          CORE METRICS
      ===================================================== */}

      <div className="mb-2">
        <p
          className="
            text-[10px]
            uppercase
            tracking-[0.16em]
            font-bold
            text-slate-400
          "
        >
          Overview
        </p>
      </div>

      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          xl:grid-cols-4
          gap-4
          mb-6
        "
      >
        <StatCard
          label="Total Students"
          value={summary?.totalStudents ?? '—'}
          icon={Users}
          tone="ink"
        />

        <StatCard
          label="Active Leads"
          value={summary?.activeLeads ?? '—'}
          icon={Target}
          tone="marigold"
        />

        <StatCard
          label="Upcoming Batches"
          value={summary?.upcomingBatches ?? '—'}
          icon={CalendarClock}
          tone="sage"
        />

        <StatCard
          label="Pending Tasks"
          value={summary?.pendingTasks ?? '—'}
          icon={CheckSquare}
          tone="clay"
        />
      </div>


      {/* =====================================================
          FINANCE METRICS
      ===================================================== */}

      <div className="mb-2">
        <p
          className="
            text-[10px]
            uppercase
            tracking-[0.16em]
            font-bold
            text-slate-400
          "
        >
          Financial Overview
        </p>
      </div>

      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          xl:grid-cols-4
          gap-4
          mb-7
        "
      >
        <StatCard
          label="Pending Fees"
          value={
            summary
              ? formatCurrency(summary.pendingFeesTotal)
              : '—'
          }
          icon={Wallet}
          tone="clay"
        />

        <StatCard
          label="Today's Collection"
          value={
            summary
              ? formatCurrency(summary.collections?.today)
              : '—'
          }
          icon={CalendarDays}
          tone="marigold"
        />

        <StatCard
          label="This Week's Collection"
          value={
            summary
              ? formatCurrency(summary.collections?.week)
              : '—'
          }
          icon={Clock}
          tone="sage"
        />

        <StatCard
          label="This Month's Collection"
          value={
            summary
              ? formatCurrency(summary.collections?.month)
              : '—'
          }
          icon={TrendingUp}
          tone="ink"
        />
      </div>


      {/* =====================================================
          CHART + SUMMARY
      ===================================================== */}

      <div
        className="
          grid
          grid-cols-1
          lg:grid-cols-3
          gap-5
        "
      >

        {/* ===================================================
            MONTHLY COLLECTION CHART
        =================================================== */}

        <div
          className="
            relative
            overflow-hidden

            rounded-2xl
            bg-white

            border border-slate-200/80

            p-5

            lg:col-span-2

            shadow-[0_6px_25px_rgba(30,20,80,0.055)]

            transition-all duration-300
            hover:shadow-[0_14px_35px_rgba(30,20,80,0.09)]
          "
        >
          {/* Header */}
          <div className="relative flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2">
                <div
                  className="
                    h-8 w-8
                    rounded-lg
                    bg-gradient-to-br
                    from-violet-500
                    to-indigo-600
                    text-white
                    flex items-center justify-center

                    shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),0_4px_8px_rgba(79,70,229,0.2)]
                  "
                >
                  <DollarSign size={15} />
                </div>

                <div>
                  <p
                    className="
                      font-display
                      text-sm
                      sm:text-base
                      font-bold
                      text-slate-900
                    "
                  >
                    Monthly Fee Collection
                  </p>

                  <p className="text-[10px] text-slate-400 mt-0.5">
                    January – December {currentYear}
                  </p>
                </div>
              </div>
            </div>

            {/* Year Badge */}
            <span
              className="
                hidden sm:inline-flex
                items-center
                rounded-full
                px-2.5 py-1

                bg-violet-50
                text-violet-600

                border border-violet-100

                text-[10px]
                font-bold
              "
            >
              {currentYear}
            </span>
          </div>

          {/* Chart */}
          <div
            style={{
              width: '100%',
              height: 290,
            }}
          >
            <ResponsiveContainer>
              <BarChart
                data={monthlyData}
                barSize={22}
                margin={{
                  top: 5,
                  right: 5,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="#EEF0F6"
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  tick={{
                    fontSize: 11,
                    fill: '#94A3B8',
                    fontWeight: 500,
                  }}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                />

                <YAxis
                  tick={{
                    fontSize: 10,
                    fill: '#94A3B8',
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1000
                      ? `₹${Math.round(v / 1000)}k`
                      : `₹${v}`
                  }
                />

                <Tooltip
                  cursor={{
                    fill: '#F5F3FF',
                  }}
                  formatter={(value) =>
                    formatCurrency(value)
                  }
                  labelStyle={{
                    color: '#334155',
                    fontWeight: '700',
                    fontSize: 12,
                  }}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #E2E8F0',
                    boxShadow:
                      '0 10px 30px rgba(30,20,80,0.12)',
                    padding: '9px 12px',
                  }}
                />

                <Bar
                  dataKey="amount"
                  fill="#7C3AED"
                  radius={[7, 7, 2, 2]}
                  activeBar={{
                    fill: '#6D28D9',
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>


        {/* ===================================================
            QUICK SUMMARY
        =================================================== */}

        <div
          className="
            relative
            overflow-hidden

            rounded-2xl
            bg-white

            border border-slate-200/80

            p-5

            shadow-[0_6px_25px_rgba(30,20,80,0.055)]

            transition-all duration-300
            hover:shadow-[0_14px_35px_rgba(30,20,80,0.09)]
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p
                className="
                  font-display
                  text-base
                  font-bold
                  text-slate-900
                "
              >
                Quick Summary
              </p>

              <p className="text-[10px] text-slate-400 mt-0.5">
                Current institute status
              </p>
            </div>

            <div
              className="
                h-9 w-9
                rounded-xl

                bg-gradient-to-br
                from-violet-50
                to-indigo-50

                border border-violet-100

                flex items-center justify-center
                text-violet-500
              "
            >
              <TrendingUp size={16} />
            </div>
          </div>


          {/* Summary Rows */}
          <div className="space-y-1">

            <SummaryRow
              icon={Users}
              label="Total Students"
              value={summary?.totalStudents ?? 0}
            />

            <SummaryRow
              icon={Target}
              label="Active Leads"
              value={summary?.activeLeads ?? 0}
            />

            <SummaryRow
              icon={CalendarClock}
              label="Upcoming Batches"
              value={summary?.upcomingBatches ?? 0}
            />

            <div className="h-px bg-slate-100 my-2" />

            <SummaryRow
              icon={Wallet}
              label="Pending Fees"
              value={formatCurrency(
                summary?.pendingFeesTotal
              )}
              tone="danger"
            />

            <SummaryRow
              icon={ReceiptIcon}
              label="This Month's Expense"
              value={formatCurrency(
                summary?.monthExpense
              )}
              tone="danger"
            />
          </div>


          {/* Bottom Highlight */}
          <div
            className="
              mt-4
              rounded-xl
              p-3

              bg-gradient-to-r
              from-violet-50
              to-indigo-50

              border border-violet-100
            "
          >
            <p
              className="
                text-[9px]
                uppercase
                tracking-[0.12em]
                font-bold
                text-violet-400
              "
            >
              Monthly Collection
            </p>

            <p className="mt-1 text-lg font-bold text-violet-700">
              {formatCurrency(
                summary?.collections?.month
              )}
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}


/* =========================================================
   RECEIPT ICON
========================================================= */

function ReceiptIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 2v20l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2V2l-2 2-2-2-2 2-2-2-2 2-2-2-2 2-2-2Z" />
      <path d="M16 8h-6" />
      <path d="M16 12h-6" />
      <path d="M16 16h-4" />
    </svg>
  );
}
