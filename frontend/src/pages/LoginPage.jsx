import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, Mail, Lock, ArrowRight, User, Stethoscope, ShieldCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login, quickDemoLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.user.role === 'staff') navigate('/staff');
      else if (data.user.role === 'admin') navigate('/admin');
      else navigate('/customer');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (role, destination) => {
    setError('');
    setLoading(true);
    try {
      await quickDemoLogin(role);
      navigate(destination);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Demo sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header matching Figure 5.3 */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 items-center justify-center shadow-glow-blue mb-3">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Queue Ease</h1>
          <h2 className="text-xl font-bold text-slate-200 mt-1">Sign In to Your Account</h2>
          <p className="text-xs text-slate-400 mt-1">
            Access your active queue tokens, staff terminal, or admin metrics
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-[#111C35] border border-[#1E2D4A] rounded-2xl p-6 sm:p-8 shadow-xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="e.g. shankar@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0B132B] border border-[#1E2D4A] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0B132B] border border-[#1E2D4A] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl shadow-glow-blue transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Instant Demo Evaluators matching Figure 5.3 */}
          <div className="mt-8 pt-6 border-t border-[#1E2D4A]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
              One-Click Demo Evaluator Credentials
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <button
                type="button"
                onClick={() => handleDemo('customer', '/customer')}
                className="p-2 rounded-xl bg-navy-800 hover:bg-navy-700 border border-[#1E2D4A] text-slate-300 transition-all text-xs"
              >
                <User className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <span className="block font-medium">Customer</span>
                <span className="text-[10px] text-slate-500">Shankar</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemo('staff', '/staff')}
                className="p-2 rounded-xl bg-navy-800 hover:bg-navy-700 border border-[#1E2D4A] text-slate-300 transition-all text-xs"
              >
                <Stethoscope className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                <span className="block font-medium">Staff</span>
                <span className="text-[10px] text-slate-500">Dr. Sarah</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemo('admin', '/admin')}
                className="p-2 rounded-xl bg-navy-800 hover:bg-navy-700 border border-[#1E2D4A] text-slate-300 transition-all text-xs"
              >
                <ShieldCheck className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                <span className="block font-medium">Admin</span>
                <span className="text-[10px] text-slate-500">Eleanor</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-cyan-400 font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
