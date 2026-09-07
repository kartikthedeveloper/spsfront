import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  Users,
  Wallet,
  CalendarCheck,
  Target,
  Receipt,
  Banknote,
  FileBarChart,
  Megaphone,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'branch_manager', 'staff'] },
  { to: '/branches', label: 'Branches', icon: Building2, roles: ['admin'] },
  { to: '/academics', label: 'Courses & Batches', icon: GraduationCap, roles: ['admin', 'branch_manager', 'staff'] },
  { to: '/students', label: 'Students', icon: Users, roles: ['admin', 'branch_manager', 'staff'] },
  { to: '/fees', label: 'Fee Management', icon: Wallet, roles: ['admin', 'branch_manager', 'staff'] },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck, roles: ['admin', 'branch_manager', 'staff'] },
  { to: '/leads', label: 'Leads', icon: Target, roles: ['admin', 'branch_manager', 'staff'] },
  { to: '/expenses', label: 'Expenses', icon: Receipt, roles: ['admin', 'branch_manager', 'staff'] },
  { to: '/salary', label: 'Salary', icon: Banknote, roles: ['admin', 'branch_manager'] },
  { to: '/reports', label: 'Reports', icon: FileBarChart, roles: ['admin', 'branch_manager'] },
  { to: '/campaigns', label: 'Campaigns', icon: Megaphone, roles: ['admin', 'branch_manager'] },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, roles: ['admin'] },
];

export default function Sidebar() {
  const { user } = useAuth();
  const visible = navItems.filter((item) => item.roles.includes(user?.role));

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-ink-900 text-ink-100 min-h-screen sticky top-0">
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-marigold-500 flex items-center justify-center font-display font-semibold text-ink-950 text-lg">
            S
          </div>
          <div>
            <p className="font-display font-semibold text-white text-[15px] leading-tight">Success Point</p>
            <p className="text-[11px] text-ink-100/60 tracking-wide">Institute CRM</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {visible.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-marigold-500/90 text-white'
                  : 'text-ink-100/75 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={17} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-white/10 text-[11px] text-ink-100/40">
        Success Point CRM
      </div>
    </aside>
  );
}
