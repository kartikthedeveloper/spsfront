import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-ink-950">
      {/* Left: brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-[46%] px-14 py-12 bg-ink-950 text-ink-50 relative overflow-hidden">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-marigold-500/10" />
        <div className="absolute -left-16 bottom-10 h-56 w-56 rounded-full bg-ink-700/30" />
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-lg bg-marigold-500 flex items-center justify-center font-display font-semibold text-ink-950 text-xl">
            S
          </div>
          <span className="font-display font-semibold text-lg">Success Point</span>
        </div>
        <div className="relative z-10">
          <p className="font-display text-4xl leading-tight font-medium max-w-md">
            One ledger for every admission, batch and rupee collected.
          </p>
          <p className="mt-5 text-ink-100/60 max-w-sm text-sm leading-relaxed">
            Admissions, fees, attendance, leads, expenses and payroll —
            run your institute's daily operations from a single, calm
            dashboard.
          </p>
        </div>
        <p className="relative z-10 text-xs text-ink-100/30 font-mono">Sikar, Rajasthan</p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-ink-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="h-9 w-9 rounded-lg bg-marigold-500 flex items-center justify-center font-display font-semibold text-ink-950">
              S
            </div>
            <span className="font-display font-semibold text-lg text-ink-950">Success Point</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink-950">Welcome back</h1>
          <p className="text-sm text-ink-600 mt-1 mb-8">Sign in to your Success Point CRM account.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@successpoint.local"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-xs text-ink-600/70 mt-8 text-center">
            First time here? Run the seed script on the backend to create your admin login.
          </p>
        </div>
      </div>
    </div>
  );
}
