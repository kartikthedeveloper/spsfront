import React, { useEffect, useState } from 'react';
import {
  Users,
  Target,
  CalendarClock,
  Wallet,
  TrendingUp,
  DollarSign,
  University,
  Receipt,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  CalendarDays,
  Banknote
} from 'lucide-react';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

import AppShell from '../components/AppShell';
import { StatCard } from '../components/ui';
import api from '../api/axios';

const months = [
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
  'Dec'
];

const money = (v) =>
  `₹${Number(v || 0).toLocaleString('en-IN')}`;

export default function Dashboard() {

  const now = new Date();

  // =====================================================
  // STATE
  // =====================================================

  const [year, setYear] = useState(
    now.getFullYear()
  );

  // null = All Months
  // 1-12 = Particular month
  const [month, setMonth] = useState(null);

  const [summary, setSummary] = useState(null);

  const [trend, setTrend] = useState([]);

  const [loading, setLoading] = useState(false);


  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  const load = async () => {

    setLoading(true);

    try {

      // -----------------------------------------------
      // API PARAMS
      // -----------------------------------------------

      const params = {
        year
      };

      // Only send month when a particular
      // month is selected.
      //
      // If month === null:
      // backend will return full year data.
      //
      if (month !== null) {
        params.month = month;
      }


      // -----------------------------------------------
      // API CALLS
      // -----------------------------------------------

      const [
        { data: summaryData },
        { data: trendData }
      ] = await Promise.all([

        api.get(
          '/dashboard/summary',
          { params }
        ),

        api.get(
          '/dashboard/trend',
          { params }
        )

      ]);


      // -----------------------------------------------
      // SUMMARY
      // -----------------------------------------------

      setSummary(summaryData);


      // -----------------------------------------------
      // TREND
      // -----------------------------------------------

      const items =
        trendData.trend || [];


      if (month !== null) {

        // ---------------------------------------------
        // PARTICULAR MONTH
        // Daily Collection
        // ---------------------------------------------

        setTrend(
          items.map((x) => ({
            label: `${x._id.day}`,
            amount: Number(
              x.total || 0
            )
          }))
        );

      } else {

        // ---------------------------------------------
        // FULL YEAR
        // Monthly Collection
        // ---------------------------------------------

        setTrend(
          items.map((x) => ({
            label:
              months[
                (x._id.month || 1) - 1
              ],

            amount: Number(
              x.total || 0
            )
          }))
        );

      }

    } catch (e) {

      console.error(
        'Dashboard load error',
        e
      );

    } finally {

      setLoading(false);

    }
  };


  // =====================================================
  // LOAD WHEN FILTER CHANGES
  // =====================================================

  useEffect(() => {

    load();

  }, [year, month]);


  // =====================================================
  // DATA
  // =====================================================

  const financial =
    summary?.financial || {};

  const collections =
    summary?.collections || {};


  // =====================================================
  // PERIOD LABEL
  // =====================================================

  const periodLabel =
    month === null
      ? `${year} — Full Year`
      : `${months[month - 1]} ${year}`;


  return (

    <AppShell title="Dashboard">

      <div className="space-y-6">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="rounded-2xl bg-gradient-to-r from-[#21115f] via-[#32177c] to-[#4c1d95] text-white p-5 sm:p-6">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">


            {/* TITLE */}

            <div>

              <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">
                Success Point CRM
              </p>

              <h2 className="text-2xl font-bold mt-1">
                Financial Dashboard
              </h2>

              <p className="text-xs text-white/60 mt-1">
                Track student collection, university payments,
                expenses and institute balance.
              </p>

            </div>


            {/* FILTERS */}

            <div className="flex flex-wrap items-center gap-2">


              {/* YEAR */}

              <select
                value={year}
                onChange={(e) =>
                  setYear(
                    Number(e.target.value)
                  )
                }
                className="h-10 rounded-xl bg-white/10 border border-white/20 px-3 text-sm text-white"
              >

                {Array.from(
                  { length: 7 },
                  (_, i) =>
                    now.getFullYear() - 3 + i
                ).map((y) => (

                  <option
                    className="text-slate-900"
                    key={y}
                    value={y}
                  >
                    {y}
                  </option>

                ))}

              </select>


              {/* MONTH */}

              <select
                value={
                  month === null
                    ? ''
                    : month
                }
                onChange={(e) => {

                  const value =
                    e.target.value;

                  setMonth(
                    value === ''
                      ? null
                      : Number(value)
                  );

                }}
                className="h-10 rounded-xl bg-white/10 border border-white/20 px-3 text-sm text-white"
              >

                {/* DEFAULT */}
                <option
                  value=""
                  className="text-slate-900"
                >
                  All Months
                </option>


                {/* MONTHS */}

                {months.map(
                  (m, index) => (

                    <option
                      className="text-slate-900"
                      key={m}
                      value={index + 1}
                    >
                      {m}
                    </option>

                  )
                )}

              </select>


              {/* REFRESH */}

              <button
                onClick={load}
                className="h-10 w-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center"
              >

                <RefreshCw
                  size={15}
                  className={
                    loading
                      ? 'animate-spin'
                      : ''
                  }
                />

              </button>

            </div>

          </div>


          {/* SELECTED PERIOD */}

          <div className="mt-4 text-xs text-white/55">

            Selected period:

            <span className="text-white font-semibold ml-1">

              {periodLabel}

            </span>

          </div>

        </div>


        {/* =================================================
            GENERAL SUMMARY
        ================================================= */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          <StatCard
            label="Total Students"
            value={
              summary?.totalStudents ?? '—'
            }
            icon={Users}
            tone="ink"
          />

          <StatCard
            label="Active Leads"
            value={
              summary?.activeLeads ?? '—'
            }
            icon={Target}
            tone="marigold"
          />

          <StatCard
            label="Upcoming Batches"
            value={
              summary?.upcomingBatches ?? '—'
            }
            icon={CalendarClock}
            tone="sage"
          />

          <StatCard
            label="Pending Fees"
            value={
              summary
                ? money(
                    summary.pendingFeesTotal
                  )
                : '—'
            }
            icon={Wallet}
            tone="clay"
          />

        </div>


        {/* =================================================
            FINANCIAL SUMMARY
        ================================================= */}

        <div>

          <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-slate-400 mb-2">

            {month === null
              ? 'Full Year Finance'
              : 'Selected Month Finance'}

          </p>


          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">


            {/* COLLECTION */}

            <StatCard
              label="Student Collection"
              value={money(
                financial.totalCollection
              )}
              icon={Banknote}
              tone="sage"
            />


            {/* UNIVERSITY */}

            <StatCard
              label="Paid to University"
              value={money(
                financial.totalUniversityPaid
              )}
              icon={University}
              tone="marigold"
            />


            {/* EXPENSE */}

            <StatCard
              label="Total Expenses"
              value={money(
                financial.totalExpense
              )}
              icon={Receipt}
              tone="clay"
            />


            {/* NET BALANCE */}

            <StatCard
              label="Net Institute Balance"
              value={money(
                financial.netBalance
              )}
              icon={TrendingUp}
              tone="ink"
            />

          </div>

        </div>


        {/* =================================================
            FINANCE BOXES
        ================================================= */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          <FinanceBox
            icon={ArrowDownRight}
            label="Total Outflow"
            value={money(
              financial.totalOutflow
            )}
          />


          <FinanceBox
            icon={ArrowUpRight}
            label="Balance After University"
            value={money(
              financial.balanceAfterUniversity
            )}
          />


          <FinanceBox
            icon={University}
            label="University Pending"
            value={money(
              summary?.universityPendingTotal
            )}
            danger
          />


          <FinanceBox
            icon={CalendarDays}
            label={
              month === null
                ? 'Year Collection'
                : 'Month Collection'
            }
            value={money(
              collections.period
            )}
          />

        </div>


        {/* =================================================
            CHART + BREAKDOWN
        ================================================= */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">


          {/* =================================================
              FINANCIAL BREAKDOWN
          ================================================= */}

          <div className="rounded-2xl bg-white border border-slate-200 p-5">

            <h3 className="font-bold text-slate-900">

              Financial Breakdown

            </h3>

            <p className="text-[11px] text-slate-400 mt-1">

              {periodLabel}

            </p>


            <div className="mt-5 space-y-2">


              <Row
                icon={Banknote}
                label="Student Collection"
                value={money(
                  financial.totalCollection
                )}
              />


              <Row
                icon={University}
                label="University Paid"
                value={money(
                  financial.totalUniversityPaid
                )}
                danger
              />


              <Row
                icon={Receipt}
                label="Total Expenses"
                value={money(
                  financial.totalExpense
                )}
                danger
              />


              <div className="h-px bg-slate-100 my-3"/>


              <Row
                icon={TrendingUp}
                label="Net Institute Balance"
                value={money(
                  financial.netBalance
                )}
                success
              />

            </div>


            <div className="mt-5 rounded-xl bg-violet-50 border border-violet-100 p-4">

              <p className="text-[9px] uppercase tracking-wider font-bold text-violet-400">

                Formula

              </p>

              <p className="text-xs font-semibold text-violet-800 mt-1">

                Collection − University Paid − Expenses

              </p>

            </div>

          </div>

        </div>

      </div>

    </AppShell>

  );
}


// =====================================================
// FINANCE BOX
// =====================================================

function FinanceBox({
  icon: Icon,
  label,
  value,
  danger
}) {

  return (

    <div className="rounded-2xl bg-white border border-slate-200 p-4">

      <div
        className={`h-9 w-9 rounded-xl flex items-center justify-center ${
          danger
            ? 'bg-rose-50 text-rose-500'
            : 'bg-slate-100 text-slate-500'
        }`}
      >

        <Icon size={16}/>

      </div>

      <p className="text-xs text-slate-500 mt-3">

        {label}

      </p>

      <p
        className={`text-lg font-bold mt-1 ${
          danger
            ? 'text-rose-600'
            : 'text-slate-900'
        }`}
      >

        {value}

      </p>

    </div>

  );
}


// =====================================================
// ROW
// =====================================================

function Row({
  icon: Icon,
  label,
  value,
  danger,
  success
}) {

  return (

    <div className="flex items-center justify-between rounded-xl px-2 py-2.5 hover:bg-slate-50">

      <div className="flex items-center gap-2.5">

        <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">

          <Icon size={14}/>

        </div>

        <span className="text-xs font-medium text-slate-500">

          {label}

        </span>

      </div>

      <span
        className={`text-sm font-bold ${
          danger
            ? 'text-rose-600'
            : success
              ? 'text-emerald-600'
              : 'text-slate-900'
        }`}
      >

        {value}

      </span>

    </div>

  );
}
