import React, { useEffect, useMemo, useState } from 'react';
import {
  Users, Target, CalendarClock, Wallet, TrendingUp, CheckSquare,
  DollarSign, University, Receipt, ArrowDownRight, ArrowUpRight,
  RefreshCw, CalendarDays, Banknote
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import AppShell from '../components/AppShell';
import { StatCard } from '../components/ui';
import api from '../api/axios';

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

export default function Dashboard() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [useMonth, setUseMonth] = useState(true);
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = { year };
      if (useMonth) params.month = month;
      const [{ data: s }, { data: t }] = await Promise.all([
        api.get('/dashboard/summary', { params }),
        api.get('/dashboard/trend', { params })
      ]);
      setSummary(s);
      const items = t.trend || [];
      if (useMonth) {
        setTrend(items.map((x) => ({
          label: `${x._id.day}`,
          amount: Number(x.total || 0)
        })));
      } else {
        setTrend(items.map((x) => ({
          label: months[(x._id.month || 1) - 1],
          amount: Number(x.total || 0)
        })));
      }
    } catch (e) {
      console.error('Dashboard load error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [year, month, useMonth]);

  const f = summary?.financial || {};
  const c = summary?.collections || {};
  const periodLabel = useMonth ? `${months[month - 1]} ${year}` : `${year}`;

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-[#21115f] via-[#32177c] to-[#4c1d95] text-white p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">Success Point CRM</p>
              <h2 className="text-2xl font-bold mt-1">Financial Dashboard</h2>
              <p className="text-xs text-white/60 mt-1">Track student collection, university payments, expenses and institute balance.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={year} onChange={e => setYear(Number(e.target.value))} className="h-10 rounded-xl bg-white/10 border border-white/20 px-3 text-sm text-white">
                {Array.from({length: 7}, (_, i) => now.getFullYear() - 3 + i).map(y => <option className="text-slate-900" key={y} value={y}>{y}</option>)}
              </select>
              <select value={month} disabled={!useMonth} onChange={e => setMonth(Number(e.target.value))} className="h-10 rounded-xl bg-white/10 border border-white/20 px-3 text-sm text-white disabled:opacity-50">
                {months.map((m, i) => <option className="text-slate-900" key={m} value={i + 1}>{m}</option>)}
              </select>
              <button onClick={() => setUseMonth(v => !v)} className="h-10 rounded-xl bg-white/10 border border-white/20 px-3 text-sm">
                {useMonth ? 'Month View' : 'Year View'}
              </button>
              <button onClick={load} className="h-10 w-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''}/>
              </button>
            </div>
          </div>
          <div className="mt-4 text-xs text-white/55">Selected period: <span className="text-white font-semibold">{periodLabel}</span></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Total Students" value={summary?.totalStudents ?? '—'} icon={Users} tone="ink"/>
          <StatCard label="Active Leads" value={summary?.activeLeads ?? '—'} icon={Target} tone="marigold"/>
          <StatCard label="Upcoming Batches" value={summary?.upcomingBatches ?? '—'} icon={CalendarClock} tone="sage"/>
          <StatCard label="Pending Fees" value={summary ? money(summary.pendingFeesTotal) : '—'} icon={Wallet} tone="clay"/>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-slate-400 mb-2">Selected Period Finance</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard label="Student Collection" value={money(f.totalCollection)} icon={Banknote} tone="sage"/>
            <StatCard label="Paid to University" value={money(f.totalUniversityPaid)} icon={University} tone="marigold"/>
            <StatCard label="Other Expenses" value={money(f.totalExpense)} icon={Receipt} tone="clay"/>
            <StatCard label="Net Institute Balance" value={money(f.netBalance)} icon={TrendingUp} tone="ink"/>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <FinanceBox icon={ArrowDownRight} label="Total Outflow" value={money(f.totalOutflow)} />
          <FinanceBox icon={ArrowUpRight} label="Balance After University" value={money(f.balanceAfterUniversity)} />
          <FinanceBox icon={University} label="University Pending" value={money(summary?.universityPendingTotal)} danger />
          <FinanceBox icon={CalendarDays} label="Period Collection" value={money(c.period)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-slate-900">{useMonth ? 'Daily Collection' : 'Monthly Collection'}</h3>
                <p className="text-[11px] text-slate-400">{periodLabel}</p>
              </div>
              <DollarSign size={18} className="text-violet-500"/>
            </div>
            <div style={{width:'100%', height:300}}>
              <ResponsiveContainer>
                <BarChart data={trend} margin={{top:5,right:5,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#EEF0F6" vertical={false}/>
                  <XAxis dataKey="label" tick={{fontSize:10,fill:'#94A3B8'}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10,fill:'#94A3B8'}} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `₹${Math.round(v/1000)}k` : `₹${v}`}/>
                  <Tooltip formatter={v => money(v)} contentStyle={{borderRadius:12,border:'1px solid #E2E8F0'}}/>
                  <Bar dataKey="amount" fill="#7C3AED" radius={[6,6,2,2]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900">Financial Breakdown</h3>
            <p className="text-[11px] text-slate-400 mt-1">{periodLabel}</p>
            <div className="mt-5 space-y-2">
              <Row icon={Banknote} label="Student Collection" value={money(f.totalCollection)} />
              <Row icon={University} label="University Paid" value={money(f.totalUniversityPaid)} danger />
              <Row icon={Receipt} label="Other Expenses" value={money(f.totalExpense)} danger />
              <div className="h-px bg-slate-100 my-3"/>
              <Row icon={TrendingUp} label="Net Institute Balance" value={money(f.netBalance)} success />
            </div>
            <div className="mt-5 rounded-xl bg-violet-50 border border-violet-100 p-4">
              <p className="text-[9px] uppercase tracking-wider font-bold text-violet-400">Formula</p>
              <p className="text-xs font-semibold text-violet-800 mt-1">Collection − University Paid − Expenses</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function FinanceBox({icon: Icon, label, value, danger}) {
  return <div className="rounded-2xl bg-white border border-slate-200 p-4">
    <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${danger ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-500'}`}><Icon size={16}/></div>
    <p className="text-xs text-slate-500 mt-3">{label}</p>
    <p className={`text-lg font-bold mt-1 ${danger ? 'text-rose-600' : 'text-slate-900'}`}>{value}</p>
  </div>;
}
function Row({icon: Icon, label, value, danger, success}) {
  return <div className="flex items-center justify-between rounded-xl px-2 py-2.5 hover:bg-slate-50">
    <div className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center"><Icon size={14}/></div><span className="text-xs font-medium text-slate-500">{label}</span></div>
    <span className={`text-sm font-bold ${danger ? 'text-rose-600' : success ? 'text-emerald-600' : 'text-slate-900'}`}>{value}</span>
  </div>;
}
