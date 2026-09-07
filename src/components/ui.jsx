import React from 'react';
import { X, ArrowUpRight } from 'lucide-react';

/* =========================================================
   STAT CARD
========================================================= */

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = 'ink',
}) {
  const tones = {
    ink: {
      icon: 'from-slate-700 via-slate-800 to-slate-950',
      glow: 'bg-slate-400/10',
      text: 'text-slate-700',
    },

    marigold: {
      icon: 'from-amber-400 via-orange-500 to-orange-600',
      glow: 'bg-amber-400/15',
      text: 'text-orange-600',
    },

    sage: {
      icon: 'from-emerald-400 via-emerald-500 to-teal-600',
      glow: 'bg-emerald-400/15',
      text: 'text-emerald-600',
    },

    clay: {
      icon: 'from-rose-400 via-red-500 to-rose-600',
      glow: 'bg-rose-400/15',
      text: 'text-rose-600',
    },
  };

  const currentTone = tones[tone] || tones.ink;

  return (
    <div
      className="
        group relative overflow-hidden
        rounded-2xl
        bg-white
        border border-slate-200/80
        p-5
        flex items-start justify-between

        shadow-[0_5px_20px_rgba(30,20,80,0.055)]
        transition-all duration-300 ease-out

        hover:-translate-y-1
        hover:border-violet-200
        hover:shadow-[0_14px_35px_rgba(30,20,80,0.11)]
      "
    >
      {/* Background Glow */}
      <div
        className={`
          absolute
          -right-12 -top-12
          h-28 w-28
          rounded-full
          blur-3xl
          ${currentTone.glow}
          transition-all duration-500
          group-hover:scale-150
        `}
      />

      {/* Decorative corner */}
      <div
        className="
          absolute right-0 top-0
          h-16 w-16
          opacity-0
          group-hover:opacity-100
          transition-opacity duration-300
        "
      >
        <div className="absolute right-0 top-0 h-px w-10 bg-gradient-to-l from-violet-400 to-transparent" />
        <div className="absolute right-0 top-0 h-10 w-px bg-gradient-to-b from-violet-400 to-transparent" />
      </div>

      <div className="relative z-10">
        <p
          className="
            text-[10px]
            font-bold
            uppercase
            tracking-[0.14em]
            text-slate-400
          "
        >
          {label}
        </p>

        <p
          className="
            mt-2
            font-display
            text-[28px]
            leading-none
            font-bold
            tracking-tight
            text-slate-900
          "
        >
          {value}
        </p>

        {sub && (
          <p className="mt-2 text-[11px] font-medium text-slate-400">
            {sub}
          </p>
        )}
      </div>

      {Icon && (
        <div
          className={`
            relative z-10
            h-11 w-11
            shrink-0
            rounded-xl
            flex items-center justify-center
            text-white

            bg-gradient-to-br
            ${currentTone.icon}

            shadow-[
              inset_0_1px_2px_rgba(255,255,255,0.35),
              0_4px_0_rgba(0,0,0,0.18),
              0_8px_15px_rgba(30,20,80,0.15)
            ]

            transition-all duration-300

            group-hover:-translate-y-1
            group-hover:scale-105
          `}
        >
          <Icon size={18} strokeWidth={2.2} />

          {/* Icon shine */}
          <span
            className="
              absolute inset-0
              rounded-xl
              bg-gradient-to-br
              from-white/20
              via-transparent
              to-transparent
              pointer-events-none
            "
          />
        </div>
      )}
    </div>
  );
}


/* =========================================================
   MODAL
========================================================= */

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}) {
  if (!open) return null;

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        p-4

        bg-slate-950/45
        backdrop-blur-md

        animate-[fadeIn_0.2s_ease-out]
      "
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`
          relative
          w-full
          ${wide ? 'max-w-3xl' : 'max-w-lg'}
          max-h-[90vh]
          overflow-hidden

          rounded-3xl

          bg-white
          border border-white/80

          shadow-[
            0_25px_80px_rgba(15,10,50,0.25),
            0_8px_25px_rgba(15,10,50,0.12),
            inset_0_1px_1px_rgba(255,255,255,0.9)
          ]

          animate-[modalIn_0.25s_ease-out]
        `}
      >
        {/* Top gradient decoration */}
        <div
          className="
            absolute
            left-0 right-0 top-0
            h-1
            bg-gradient-to-r
            from-violet-500
            via-purple-500
            to-indigo-500
          "
        />

        {/* Header */}
        <div
          className="
            flex items-center justify-between
            px-6 py-5

            border-b border-slate-100
            bg-gradient-to-b
            from-slate-50/80
            to-white
          "
        >
          <div>
            <p
              className="
                text-[9px]
                uppercase
                tracking-[0.18em]
                font-bold
                text-violet-500
                mb-1
              "
            >
              Success Point
            </p>

            <h3
              className="
                font-display
                text-xl
                font-bold
                text-slate-900
                tracking-tight
              "
            >
              {title}
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="
              group
              h-9 w-9
              rounded-xl
              flex items-center justify-center

              bg-slate-100
              text-slate-500

              border border-slate-200

              shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]

              transition-all duration-200

              hover:bg-red-50
              hover:border-red-200
              hover:text-red-500
              hover:rotate-90
              hover:scale-105

              active:scale-95
            "
          >
            <X size={17} strokeWidth={2.2} />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-90px)] overflow-y-auto px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}


/* =========================================================
   BADGE
========================================================= */

export function Badge({
  children,
  tone = 'ink',
}) {
  const tones = {
    ink: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      dot: 'bg-slate-500',
      border: 'border-slate-200',
    },

    marigold: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
      border: 'border-amber-200',
    },

    sage: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
      border: 'border-emerald-200',
    },

    clay: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      dot: 'bg-rose-500',
      border: 'border-rose-200',
    },
  };

  const currentTone = tones[tone] || tones.ink;

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5

        rounded-full

        px-2.5 py-1

        text-[10px]
        font-bold
        tracking-wide

        border

        ${currentTone.bg}
        ${currentTone.text}
        ${currentTone.border}

        shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]

        transition-all duration-200

        hover:-translate-y-0.5
        hover:shadow-sm
      `}
    >
      <span
        className={`
          h-1.5 w-1.5
          rounded-full
          ${currentTone.dot}
          shadow-[0_0_5px_currentColor]
        `}
      />

      {children}
    </span>
  );
}


/* =========================================================
   EMPTY STATE
========================================================= */

export function EmptyState({
  title,
  description,
}) {
  return (
    <div
      className="
        group
        relative
        overflow-hidden

        rounded-2xl

        bg-white
        border border-slate-200/80

        px-6 py-12
        text-center

        shadow-[0_5px_20px_rgba(30,20,80,0.045)]

        transition-all duration-300

        hover:border-violet-200
        hover:shadow-[0_12px_30px_rgba(30,20,80,0.08)]
      "
    >
      {/* Decorative glow */}
      <div
        className="
          absolute
          left-1/2 top-1/2
          -translate-x-1/2 -translate-y-1/2

          h-32 w-32
          rounded-full
          bg-violet-500/5
          blur-3xl

          transition-transform duration-500
          group-hover:scale-150
        "
      />

      {/* Empty icon */}
      <div
        className="
          relative
          mx-auto
          mb-4

          h-14 w-14
          rounded-2xl

          bg-gradient-to-br
          from-violet-50
          to-indigo-50

          border border-violet-100

          flex items-center justify-center

          shadow-[
            inset_0_1px_2px_rgba(255,255,255,0.9),
            0_6px_15px_rgba(99,102,241,0.08)
          ]

          transition-all duration-300

          group-hover:-translate-y-1
          group-hover:rotate-2
        "
      >
        <div className="h-2.5 w-2.5 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.35)]" />
      </div>

      <p
        className="
          relative
          font-display
          text-lg
          font-bold
          text-slate-900
        "
      >
        {title}
      </p>

      {description && (
        <p
          className="
            relative
            mt-1.5
            max-w-md
            mx-auto

            text-xs
            leading-relaxed
            text-slate-400
          "
        >
          {description}
        </p>
      )}
    </div>
  );
}


/* =========================================================
   PAGE HEADER
========================================================= */

export function PageHeader({
  title,
  description,
  action,
}) {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      {/* Left */}
    
      {/* Action */}
      {action && (
        <div
          className="
            shrink-0
            [&>button]:transition-all
            [&>button]:duration-300
            [&>button:hover]:-translate-y-0.5
          "
        >
          {action}
        </div>
      )}
    </div>
  );
}
