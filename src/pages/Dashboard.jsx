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

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);

  // ─── Load summary ────────────────────────────────────────────
  useEffect(() => {
    api.get('/dashboard/summary').then(({ data }) => setSummary(data));
  }, []);

  // ─── Load monthly trend & fill all months ──────────────────
  useEffect(() => {
    api.get('/dashboard/trend').then(({ data }) => {
      // Get current year
      const currentYear = new Date().getFullYear();

      // Create 12 months with zero amount
      const filled = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        label: monthNames[i],
        year: currentYear,
        amount: 0,
      }));

      // Overwrite with actual data for the current year
      data.trend.forEach((item) => {
        if (item._id.year === currentYear) {
          const index = item._id.month - 1;
          if (index >= 0 && index < 12) {
            filled[index].amount = item.total;
          }
        }
      });

      setMonthlyData(filled);
    });
  }, []);

  // ─── Helpers ───────────────────────────────────────────────
  const formatCurrency = (value) =>
    `₹${(value ?? 0).toLocaleString('en-IN')}`;

  // ─── Render ───────────────────────────────────────────────
  return (
    <AppShell title="Dashboard">
      {/* ─── First Row: Core Metrics ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
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

      {/* ─── Second Row: Finance Metrics ────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Pending Fees"
          value={summary ? formatCurrency(summary.pendingFeesTotal) : '—'}
          icon={Wallet}
          tone="clay"
        />
        <StatCard
          label="Today's Collection"
          value={summary ? formatCurrency(summary.collections?.today) : '—'}
          icon={CalendarDays}
          tone="marigold"
        />
        <StatCard
          label="This Week's Collection"
          value={summary ? formatCurrency(summary.collections?.week) : '—'}
          icon={Clock}
          tone="sage"
        />
        <StatCard
          label="This Month's Collection"
          value={summary ? formatCurrency(summary.collections?.month) : '—'}
          icon={TrendingUp}
          tone="ink"
        />
      </div>

      {/* ─── Chart & Expense Sidecard ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart - spans 2 columns */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-display text-base font-semibold text-ink-950">
                Monthly Fee Collection ({new Date().getFullYear()})
              </p>
              <p className="text-xs text-ink-600">January – December</p>
            </div>
            <DollarSign className="text-marigold-500" size={18} />
          </div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={monthlyData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7EDF4" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#2A4E7C' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#2A4E7C' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v / 1000}k`}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  labelStyle={{ color: '#2A4E7C', fontWeight: 'bold' }}
                />
                <Bar
                  dataKey="amount"
                  fill="#D9822B"
                  radius={[4, 4, 0, 0]}
                  activeBar={{ fill: '#B86B1F' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary sidecard */}
        <div className="card p-5">
          <p className="font-display text-base font-semibold text-ink-950 mb-4">
            Quick Summary
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-600">Total Students</span>
              <span className="font-semibold text-ink-950">
                {summary?.totalStudents ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-600">Active Leads</span>
              <span className="font-semibold text-ink-950">
                {summary?.activeLeads ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-600">Upcoming Batches</span>
              <span className="font-semibold text-ink-950">
                {summary?.upcomingBatches ?? 0}
              </span>
            </div>
            <div className="h-px bg-ink-100 my-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-600">Pending Fees</span>
              <span className="font-semibold text-clay-600">
                {formatCurrency(summary?.pendingFeesTotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-600">This Month's Expense</span>
              <span className="font-semibold text-clay-600">
                {formatCurrency(summary?.monthExpense)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}