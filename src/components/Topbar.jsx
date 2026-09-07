import React from 'react';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ title }) {
  const { user, logout } = useAuth();

  const roleName = user?.role
    ?.replace('_', ' ')
    ?.replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <header
      className="
        sticky top-0 z-40
        flex items-center justify-between
        px-5 lg:px-7 py-3.5
        bg-[#f7f7fb]/85
        backdrop-blur-2xl
        border-b border-slate-200/70
        shadow-[0_8px_30px_rgba(30,20,80,0.06)]
      "
    >
      {/* ================= LEFT SIDE ================= */}
      <div className="flex items-center gap-4 min-w-0">

        {/* Decorative vertical line */}
        <div
          className="
            hidden sm:block
            w-1 h-8 rounded-full
            bg-gradient-to-b from-violet-500 to-indigo-500
            shadow-[0_0_10px_rgba(124,58,237,0.25)]
          "
        />

        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-[0.18em] font-semibold text-slate-400 mb-0.5">
            Success Point
          </p>

          <h1
            className="
              font-display
              text-xl lg:text-[22px]
              font-bold
              text-slate-900
              tracking-tight
              truncate
            "
          >
            {title}
          </h1>
        </div>
      </div>

      {/* ================= RIGHT SIDE ================= */}
      <div className="flex items-center gap-2.5 sm:gap-3">

        {/* ROLE BADGE */}
        <div
          className="
            hidden sm:flex
            items-center gap-2
            px-3 py-2
            rounded-xl
            bg-white/80
            border border-slate-200/80
            shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_12px_rgba(30,20,80,0.06)]
            transition-all duration-300
            hover:-translate-y-0.5
            hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_7px_18px_rgba(30,20,80,0.09)]
          "
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_7px_rgba(16,185,129,0.55)]" />

          <span className="text-[11px] font-semibold text-slate-600 capitalize">
            {roleName}
          </span>
        </div>

        {/* USER PROFILE */}
        <div
          className="
            group
            flex items-center gap-2.5
            pl-2 pr-3 py-1.5
            rounded-2xl
            bg-white/85
            border border-slate-200/80
            shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_5px_15px_rgba(30,20,80,0.07)]
            transition-all duration-300
            hover:-translate-y-0.5
            hover:border-violet-200
            hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_8px_20px_rgba(124,58,237,0.12)]
          "
        >
          {/* 3D Avatar */}
          <div className="relative">

            <div
              className="
                h-9 w-9
                rounded-xl
                bg-gradient-to-br
                from-violet-500
                via-purple-600
                to-indigo-700
                text-white
                flex items-center justify-center
                shadow-[inset_0_1px_2px_rgba(255,255,255,0.35),0_4px_0_#4338ca,0_7px_13px_rgba(79,70,229,0.25)]
                transition-all duration-300
                group-hover:-translate-y-0.5
                group-hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.35),0_5px_0_#4338ca,0_10px_18px_rgba(79,70,229,0.3)]
              "
            >
              <User size={16} strokeWidth={2.2} />
            </div>

            {/* Online status */}
            <span
              className="
                absolute
                -right-0.5 -bottom-0.5
                h-2.5 w-2.5
                rounded-full
                bg-emerald-400
                border-2 border-white
                shadow-[0_0_7px_rgba(52,211,153,0.7)]
              "
            />
          </div>

          {/* User name */}
          <div className="hidden md:block min-w-0">
            <p className="text-[12px] font-semibold text-slate-800 leading-tight max-w-[130px] truncate">
              {user?.name || 'User'}
            </p>

            <p className="text-[9px] text-slate-400 capitalize mt-0.5">
              {roleName || 'Member'}
            </p>
          </div>

          <ChevronDown
            size={14}
            className="
              hidden md:block
              text-slate-400
              transition-transform duration-300
              group-hover:rotate-180
            "
          />
        </div>

        {/* LOGOUT */}
        <button
          onClick={logout}
          title="Log out"
          className="
            group
            relative
            h-10 w-10
            rounded-xl
            flex items-center justify-center
            bg-white/80
            border border-slate-200/80
            text-slate-500
            shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_4px_12px_rgba(30,20,80,0.06)]
            transition-all duration-300

            hover:-translate-y-0.5
            hover:bg-red-50
            hover:border-red-200
            hover:text-red-500
            hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_7px_17px_rgba(239,68,68,0.12)]

            active:translate-y-0
          "
        >
          <LogOut
            size={16}
            strokeWidth={2}
            className="
              transition-transform duration-300
              group-hover:translate-x-0.5
            "
          />

          {/* Tooltip */}
          <span
            className="
              pointer-events-none
              absolute
              top-[calc(100%+9px)]
              right-0
              whitespace-nowrap
              rounded-lg
              bg-slate-900
              px-2.5 py-1.5
              text-[10px]
              font-medium
              text-white
              opacity-0
              translate-y-[-4px]
              group-hover:opacity-100
              group-hover:translate-y-0
              transition-all duration-200
              shadow-lg
            "
          >
            Logout
          </span>
        </button>
      </div>
    </header>
  );
}
