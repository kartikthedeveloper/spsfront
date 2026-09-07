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
  { to: '/courses', label: 'Courses', icon: GraduationCap, roles: ['admin', 'branch_manager', 'staff'] },
  { to: '/batches', label: 'Batches', icon: GraduationCap, roles: ['admin', 'branch_manager', 'staff'] },
  { to: '/students', label: 'Students', icon: Users, roles: ['admin', 'branch_manager', 'staff'] },
  { to: '/fees', label: 'Fee Management', icon: Wallet, roles: ['admin', 'branch_manager', 'staff'] },
  // { to: '/attendance', label: 'Attendance', icon: CalendarCheck, roles: ['admin', 'branch_manager', 'staff'] },
  { to: '/leads', label: 'Leads', icon: Target, roles: ['admin', 'branch_manager', 'staff'] },
  { to: '/expenses', label: 'Expenses', icon: Receipt, roles: ['admin', 'branch_manager', 'staff'] },
  { to: '/salary', label: 'Salary', icon: Banknote, roles: ['admin', 'branch_manager'] },
  { to: '/reports', label: 'Reports', icon: FileBarChart, roles: ['admin', 'branch_manager'] },
  // { to: '/campaigns', label: 'Campaigns', icon: Megaphone, roles: ['admin', 'branch_manager'] },
  // { to: '/settings', label: 'Settings', icon: SettingsIcon, roles: ['admin'] },
];

export default function Sidebar() {
  const { user } = useAuth();

  const visible = navItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  return (
    <aside
      className="
        hidden lg:flex flex-col shrink-0
        w-[270px] min-h-screen sticky top-0
        text-white
        bg-gradient-to-br from-[#17104a] via-[#21115f] to-[#120b35]
        border-r border-white/10
        shadow-[12px_0_40px_rgba(31,15,90,0.25)]
        overflow-hidden
      "
    >
      {/* Decorative Background Glow */}
      <div className="absolute top-[-100px] left-[-80px] w-[230px] h-[230px] rounded-full bg-purple-600/20 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[100px] right-[-100px] w-[220px] h-[220px] rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />

      {/* ================= LOGO ================= */}
      <div className="relative px-5 pt-6 pb-5">
        <div
          className="
            relative flex items-center gap-3
            px-4 py-3.5
            rounded-2xl
            bg-white/[0.07]
            border border-white/10
            backdrop-blur-xl
            shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_10px_25px_rgba(0,0,0,0.18)]
          "
        >
          {/* 3D Logo */}
          <div className="relative">
            <div
              className="
                h-11 w-11 rounded-xl
                bg-gradient-to-br from-[#fbbf24] via-[#f59e0b] to-[#d97706]
                flex items-center justify-center
                font-bold text-[#241000] text-xl
                shadow-[inset_0_2px_2px_rgba(255,255,255,0.4),0_7px_0_#9a5b00,0_12px_20px_rgba(245,158,11,0.25)]
                transform transition-all duration-300
                hover:-translate-y-1 hover:shadow-[inset_0_2px_2px_rgba(255,255,255,0.4),0_9px_0_#9a5b00,0_16px_25px_rgba(245,158,11,0.35)]
              "
            >
              S
            </div>

            {/* Tiny status light */}
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#21115f] shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
          </div>

          <div className="min-w-0">
            <p className="font-semibold text-[16px] tracking-tight text-white">
              Success Point
            </p>

            <p className="text-[10px] text-white/45 tracking-[0.18em] uppercase mt-0.5">
              Institute CRM
            </p>
          </div>
        </div>
      </div>

      {/* ================= NAVIGATION ================= */}
      <nav className="relative flex-1 overflow-y-auto px-4 py-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
        {/* Section label */}
        <div className="px-3 pb-3 pt-1">
          <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-white/30">
            Main Menu
          </span>
        </div>

        {visible.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `group relative flex items-center gap-3
              px-3 py-2.5
              rounded-xl
              text-[13px] font-medium
              transition-all duration-300 ease-out
              overflow-hidden

              ${
                isActive
                  ? `
                    bg-gradient-to-r from-purple-500/95 via-violet-500/90 to-indigo-500/90
                    text-white
                    shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_7px_20px_rgba(124,58,237,0.28),0_2px_0_rgba(0,0,0,0.18)]
                    translate-x-1
                  `
                  : `
                    text-white/60
                    hover:text-white
                    hover:bg-white/[0.07]
                    hover:translate-x-1
                    hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]
                  `
              }
              `
            }
          >
            {({ isActive }) => (
              <>
                {/* Active animated glow */}
                {isActive && (
                  <>
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 rounded-r-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]" />

                    <span className="absolute right-[-25px] top-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-white/10 blur-2xl" />
                  </>
                )}

                {/* Icon container */}
                <span
                  className={`
                    relative z-10
                    flex items-center justify-center
                    h-8 w-8
                    rounded-lg
                    transition-all duration-300
                    ${
                      isActive
                        ? `
                          bg-white/15
                          shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]
                          scale-105
                        `
                        : `
                          bg-white/[0.035]
                          group-hover:bg-white/[0.1]
                          group-hover:scale-105
                        `
                    }
                  `}
                >
                  <Icon
                    size={16}
                    strokeWidth={isActive ? 2.3 : 1.9}
                    className="
                      transition-transform duration-300
                      group-hover:scale-110
                      group-hover:rotate-[-3deg]
                    "
                  />
                </span>

                {/* Label */}
                <span className="relative z-10 flex-1 truncate">
                  {label}
                </span>

                {/* Active arrow */}
                {isActive && (
                  <span className="relative z-10 text-white/70 text-xs transition-transform duration-300 group-hover:translate-x-1">
                    ›
                  </span>
                )}

                {/* Hover shine */}
                <span
                  className="
                    absolute inset-0
                    -translate-x-full
                    group-hover:translate-x-full
                    transition-transform duration-700
                    bg-gradient-to-r
                    from-transparent via-white/[0.08] to-transparent
                    pointer-events-none
                  "
                />
              </>
            )}
          </NavLink>
        ))}
      </nav>

    </aside>
  );
}
