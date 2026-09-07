import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  BarChart3,
  Users,
  Loader2,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /* =========================================================
     LOGIN
  ========================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Login failed'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     FEATURE ITEM
  ========================================================= */

  const Feature = ({ icon: Icon, title, description }) => {
    return (
      <div
        className="
          group
          flex items-center gap-3
          p-3
          rounded-xl

          bg-white/[0.045]
          border border-white/[0.08]

          transition-all duration-300

          hover:bg-white/[0.08]
          hover:border-white/[0.13]
          hover:translate-x-1
        "
      >
        <div
          className="
            h-9 w-9
            shrink-0
            rounded-xl

            bg-white/[0.08]
            border border-white/[0.08]

            flex items-center justify-center

            text-violet-300

            shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]

            transition-all duration-300

            group-hover:scale-105
            group-hover:bg-violet-500/15
          "
        >
          <Icon size={16} />
        </div>

        <div>
          <p className="text-xs font-semibold text-white/85">
            {title}
          </p>

          <p className="text-[10px] text-white/35 mt-0.5">
            {description}
          </p>
        </div>
      </div>
    );
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      className="
        min-h-screen
        flex

        bg-[#f5f5fa]

        overflow-hidden
      "
    >

      {/* =====================================================
          LEFT BRAND PANEL
      ===================================================== */}

      <div
        className="
          hidden
          lg:flex

          relative
          flex-col
          justify-between

          w-[47%]
          xl:w-[48%]

          px-12
          xl:px-16
          py-10

          overflow-hidden

          bg-gradient-to-br
          from-[#11082f]
          via-[#1c0d4a]
          to-[#2b1065]

          text-white
        "
      >

        {/* ================================================
            BACKGROUND GLOWS
        ================================================ */}

        <div
          className="
            absolute
            -right-32
            -top-32

            h-[420px]
            w-[420px]

            rounded-full

            bg-violet-500/15
            blur-[90px]

            animate-pulse
          "
        />

        <div
          className="
            absolute
            -left-32
            bottom-[-100px]

            h-[360px]
            w-[360px]

            rounded-full

            bg-indigo-500/10
            blur-[90px]
          "
        />

        <div
          className="
            absolute
            left-[35%]
            top-[35%]

            h-48
            w-48

            rounded-full

            bg-purple-500/5
            blur-[70px]
          "
        />

        {/* Decorative shapes */}
        <div
          className="
            absolute
            right-10
            top-20

            h-20
            w-20

            rounded-3xl

            border
            border-white/[0.04]

            rotate-12
          "
        />

        <div
          className="
            absolute
            right-24
            top-40

            h-10
            w-10

            rounded-xl

            border
            border-white/[0.05]

            rotate-45
          "
        />


        {/* ================================================
            BRAND
        ================================================ */}

        <div className="relative z-10">

          <div className="flex items-center gap-3">

            {/* 3D Logo */}
            <div
              className="
                relative

                h-12
                w-12

                rounded-2xl

                bg-gradient-to-br
                from-amber-300
                via-orange-400
                to-orange-600

                flex
                items-center
                justify-center

                text-xl
                font-black
                text-[#241000]

                shadow-[
                  inset_0_2px_2px_rgba(255,255,255,0.45),
                  0_5px_0_#9A5B00,
                  0_10px_25px_rgba(245,158,11,0.22)
                ]

                transition-all duration-300

                hover:-translate-y-1
              "
            >
              S

              <span
                className="
                  absolute
                  inset-0
                  rounded-2xl
                  bg-gradient-to-br
                  from-white/25
                  via-transparent
                  to-transparent
                "
              />
            </div>

            <div>
              <p className="font-display text-lg font-bold">
                Success Point
              </p>

              <p className="text-[9px] uppercase tracking-[0.22em] text-white/35">
                Institute CRM
              </p>
            </div>

          </div>

        </div>


        {/* ================================================
            HERO CONTENT
        ================================================ */}

        <div className="relative z-10 max-w-xl">

          <div
            className="
              inline-flex
              items-center
              gap-2

              px-3
              py-1.5

              rounded-full

              bg-white/[0.06]
              border border-white/[0.08]

              text-[9px]
              uppercase
              tracking-[0.16em]
              font-bold

              text-violet-200

              mb-5
            "
          >
            <span
              className="
                h-1.5
                w-1.5
                rounded-full

                bg-emerald-400

                shadow-[0_0_8px_rgba(52,211,153,0.8)]
              "
            />

            Institute Management Platform
          </div>


          <h1
            className="
              font-display

              text-4xl
              xl:text-[46px]

              leading-[1.08]

              font-bold

              tracking-tight
            "
          >
            Manage your
            <br />

            <span
              className="
                bg-gradient-to-r
                from-violet-200
                via-purple-300
                to-indigo-200

                bg-clip-text
                text-transparent
              "
            >
              institute smarter.
            </span>
          </h1>


          <p
            className="
              mt-5

              max-w-lg

              text-sm
              leading-relaxed

              text-white/45
            "
          >
            Admissions, students, fees, attendance, leads,
            expenses and payroll — everything your institute
            needs, connected in one powerful CRM.
          </p>


          {/* Features */}
          <div className="grid grid-cols-2 gap-2.5 mt-7 max-w-lg">

            <Feature
              icon={GraduationCap}
              title="Student Management"
              description="Courses & batches"
            />

            <Feature
              icon={BarChart3}
              title="Finance Tracking"
              description="Fees & collections"
            />

            <Feature
              icon={Users}
              title="Lead Management"
              description="Track admissions"
            />

            <Feature
              icon={ShieldCheck}
              title="Secure CRM"
              description="Role-based access"
            />

          </div>

        </div>


        {/* ================================================
            FOOTER
        ================================================ */}

        <div
          className="
            relative
            z-10

            flex
            items-center
            justify-between

            text-[9px]
            text-white/25

            tracking-wide
          "
        >
          <span>
            SUCCESS POINT CRM
          </span>

          <span>
            Sikar, Rajasthan
          </span>
        </div>

      </div>


      {/* =====================================================
          RIGHT LOGIN AREA
      ===================================================== */}

      <div
        className="
          flex-1

          relative

          flex
          items-center
          justify-center

          px-5
          sm:px-8
          py-10

          overflow-hidden
        "
      >

        {/* Background decoration */}
        <div
          className="
            absolute
            -right-24
            -top-24

            h-64
            w-64

            rounded-full

            bg-violet-500/5
            blur-[70px]
          "
        />

        <div
          className="
            absolute
            -left-20
            bottom-0

            h-52
            w-52

            rounded-full

            bg-indigo-500/5
            blur-[70px]
          "
        />


        {/* =================================================
            LOGIN CARD
        ================================================= */}

        <div className="relative w-full max-w-[430px]">

          {/* Mobile Logo */}
          <div
            className="
              lg:hidden

              flex
              justify-center
              items-center
              gap-3

              mb-8
            "
          >

            <div
              className="
                h-11
                w-11
                rounded-xl

                bg-gradient-to-br
                from-amber-300
                via-orange-400
                to-orange-600

                flex
                items-center
                justify-center

                font-black
                text-[#241000]

                shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_5px_0_#9A5B00,0_8px_15px_rgba(245,158,11,0.18)]
              "
            >
              S
            </div>

            <div>
              <p className="font-display font-bold text-lg text-slate-900">
                Success Point
              </p>

              <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">
                Institute CRM
              </p>
            </div>

          </div>


          {/* Card */}
          <div
            className="
              relative

              rounded-3xl

              bg-white

              border
              border-slate-200/80

              p-6
              sm:p-8

              shadow-[
                0_25px_70px_rgba(30,20,80,0.10),
                0_8px_25px_rgba(30,20,80,0.06),
                inset_0_1px_1px_rgba(255,255,255,0.95)
              ]
            "
          >

            {/* Top gradient */}
            <div
              className="
                absolute
                left-0
                right-0
                top-0

                h-1

                rounded-t-3xl

                bg-gradient-to-r
                from-violet-500
                via-purple-500
                to-indigo-500
              "
            />


            {/* Heading */}
            <div className="mb-7">

              <div
                className="
                  inline-flex
                  items-center
                  gap-2

                  px-2.5
                  py-1

                  rounded-full

                  bg-violet-50
                  border border-violet-100

                  text-[9px]
                  font-bold

                  text-violet-600
                "
              >
                <ShieldCheck size={11} />

                Secure Login
              </div>

              <h2
                className="
                  mt-4

                  font-display

                  text-2xl
                  sm:text-[28px]

                  font-bold

                  tracking-tight

                  text-slate-900
                "
              >
                Welcome back
              </h2>

              <p
                className="
                  mt-1.5

                  text-xs
                  sm:text-sm

                  leading-relaxed

                  text-slate-400
                "
              >
                Sign in to your Success Point CRM account.
              </p>

            </div>


            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Email */}
              <div>

                <label
                  className="
                    block

                    mb-2

                    text-[10px]
                    uppercase
                    tracking-[0.12em]

                    font-bold

                    text-slate-500
                  "
                >
                  Email Address
                </label>

                <div className="relative group">

                  <Mail
                    size={16}
                    className="
                      absolute
                      left-3.5
                      top-1/2
                      -translate-y-1/2

                      text-slate-400

                      transition-colors duration-200

                      group-focus-within:text-violet-500
                    "
                  />

                  <input
                    type="email"
                    required
                    autoComplete="email"

                    className="
                      w-full

                      h-12

                      rounded-xl

                      bg-slate-50

                      border border-slate-200

                      pl-11
                      pr-4

                      text-sm
                      text-slate-800

                      outline-none

                      shadow-[inset_0_1px_2px_rgba(15,23,42,0.025)]

                      transition-all duration-200

                      placeholder:text-slate-300

                      focus:bg-white
                      focus:border-violet-400
                      focus:ring-4
                      focus:ring-violet-500/10
                    "

                    value={email}

                    onChange={(e) =>
                      setEmail(e.target.value)
                    }

                    placeholder="admin@successpoint.local"
                  />

                </div>

              </div>


              {/* Password */}
              <div>

                <div className="flex items-center justify-between mb-2">

                  <label
                    className="
                      text-[10px]
                      uppercase
                      tracking-[0.12em]

                      font-bold

                      text-slate-500
                    "
                  >
                    Password
                  </label>

                </div>

                <div className="relative group">

                  <Lock
                    size={16}
                    className="
                      absolute
                      left-3.5
                      top-1/2
                      -translate-y-1/2

                      text-slate-400

                      transition-colors duration-200

                      group-focus-within:text-violet-500
                    "
                  />

                  <input
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }

                    required
                    autoComplete="current-password"

                    className="
                      w-full

                      h-12

                      rounded-xl

                      bg-slate-50

                      border border-slate-200

                      pl-11
                      pr-12

                      text-sm
                      text-slate-800

                      outline-none

                      shadow-[inset_0_1px_2px_rgba(15,23,42,0.025)]

                      transition-all duration-200

                      placeholder:text-slate-300

                      focus:bg-white
                      focus:border-violet-400
                      focus:ring-4
                      focus:ring-violet-500/10
                    "

                    value={password}

                    onChange={(e) =>
                      setPassword(e.target.value)
                    }

                    placeholder="••••••••"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }

                    className="
                      absolute
                      right-2
                      top-1/2
                      -translate-y-1/2

                      h-8
                      w-8

                      rounded-lg

                      flex
                      items-center
                      justify-center

                      text-slate-400

                      transition-all duration-200

                      hover:bg-slate-100
                      hover:text-violet-500
                    "

                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={15} />
                    ) : (
                      <Eye size={15} />
                    )}
                  </button>

                </div>

              </div>


              {/* Submit */}
              <button
                type="submit"
                disabled={loading}

                className="
                  group

                  relative

                  w-full
                  h-12

                  rounded-xl

                  flex
                  items-center
                  justify-center
                  gap-2

                  overflow-hidden

                  bg-gradient-to-r
                  from-violet-600
                  via-purple-600
                  to-indigo-600

                  text-white

                  text-sm
                  font-bold

                  border
                  border-violet-500/20

                  shadow-[
                    inset_0_1px_2px_rgba(255,255,255,0.25),
                    0_5px_0_#4338CA,
                    0_10px_22px_rgba(79,70,229,0.20)
                  ]

                  transition-all duration-300

                  hover:-translate-y-0.5
                  hover:shadow-[
                    inset_0_1px_2px_rgba(255,255,255,0.25),
                    0_6px_0_#4338CA,
                    0_15px_28px_rgba(79,70,229,0.26)
                  ]

                  active:translate-y-[2px]

                  disabled:opacity-70
                  disabled:cursor-not-allowed
                  disabled:hover:translate-y-0
                "
              >

                {/* Shine */}
                <span
                  className="
                    absolute
                    inset-0

                    -translate-x-full

                    group-hover:translate-x-full

                    transition-transform
                    duration-700

                    bg-gradient-to-r
                    from-transparent
                    via-white/15
                    to-transparent
                  "
                />

                {loading ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />

                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in

                    <ArrowRight
                      size={16}
                      className="
                        transition-transform duration-300
                        group-hover:translate-x-1
                      "
                    />
                  </>
                )}

              </button>

            </form>


            {/* =================================================
                SECURITY NOTE
            ================================================= */}

            <div
              className="
                mt-6

                flex
                items-center
                justify-center
                gap-1.5

                text-[9px]

                text-slate-400
              "
            >
              <ShieldCheck
                size={12}
                className="text-emerald-500"
              />

              Secure role-based access
            </div>

          </div>


          {/* First time message */}
          <div
            className="
              mt-5

              text-center

              px-4
            "
          >
            <p className="text-[10px] leading-relaxed text-slate-400">
              First time here? Run the seed script on the
              backend to create your admin login.
            </p>
          </div>


          {/* Copyright */}
          <p
            className="
              text-center

              text-[9px]

              text-slate-300

              mt-5
            "
          >
            © {new Date().getFullYear()} Success Point CRM
          </p>

        </div>

      </div>

    </div>
  );
}
