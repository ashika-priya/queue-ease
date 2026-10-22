import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  Sparkles,
  Zap,
  QrCode,
  ShieldCheck,
  Clock,
  Building2,
  Users,
  CheckCircle2,
  ChevronRight,
  Tv,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_BACKEND_URL || '';

export default function LandingPage() {
  const { quickDemoLogin } = useAuth();
  const navigate = useNavigate();
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const orgRes = await axios.get(`${API_BASE}/api/organizations`);
        if (orgRes.data.success && orgRes.data.organizations.length > 0) {
          const firstOrg = orgRes.data.organizations[0];
          const srvRes = await axios.get(`${API_BASE}/api/services/org/${firstOrg._id}`);
          if (srvRes.data.success && srvRes.data.services.length > 0) {
            setPreviewData({
              org: firstOrg,
              service: srvRes.data.services[0],
            });
          }
        }
      } catch (err) {
        console.warn('Preview fetch warning:', err);
      }
    };
    fetchPreview();
  }, []);

  const handleDemoLaunch = async (role, targetPath) => {
    try {
      await quickDemoLogin(role);
      navigate(targetPath);
    } catch (err) {
      console.error('Demo launch error:', err);
    }
  };

  return (
    <div className="relative overflow-hidden pb-16">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-blue-600/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 left-1/3 w-[400px] h-[300px] bg-cyan-500/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 text-center relative z-10">
        {/* Version Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-cyan-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation Digital Queue Experience • v2.0 Live</span>
        </div>

        {/* Hero Title matching Figure 5.2 */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Know your place. <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-300">
            Know your wait.
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 mb-8 leading-relaxed">
          Real-time queue management for hospitals, banks, service centers, and
          modern service organizations. Free your customers from waiting lobbies.
        </p>

        {/* Primary CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
          <Link
            to="/join"
            className="px-6 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl shadow-glow-blue transition-all flex items-center gap-2 group"
          >
            <span>Join a Queue</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/login"
            className="px-6 py-3.5 text-sm font-semibold text-slate-200 hover:text-white bg-navy-800 hover:bg-navy-700 border border-[#1E2D4A] rounded-xl transition-colors"
          >
            Staff / Admin Login
          </Link>
        </div>

        {/* Instant One-Click Demo Evaluators matching Figure 5.2 */}
        <div className="max-w-2xl mx-auto bg-[#0E1736]/90 border border-[#1E2D4A] rounded-2xl p-4 sm:p-5 mb-14">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
            Instant One-Click Demo Evaluators
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              onClick={() => handleDemoLaunch('customer', '/customer')}
              className="py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <span>Customer (Shankar: Q-024)</span>
              <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
            </button>

            <button
              onClick={() => handleDemoLaunch('staff', '/staff')}
              className="py-2.5 px-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <span>Staff: Dr. Sarah (Counter 1)</span>
              <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
            </button>

            <button
              onClick={() => handleDemoLaunch('admin', '/admin')}
              className="py-2.5 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <span>Admin: Eleanor (Full Access)</span>
              <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
            </button>
          </div>
        </div>

        {/* Live Facility Queue Preview Card */}
        {previewData && (
          <div className="max-w-2xl mx-auto bg-[#111C35] border border-[#1E2D4A] rounded-2xl p-5 mb-16 text-left shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {previewData.org.name} — {previewData.service.name}
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ● Live Operating
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center bg-[#0B132B] p-3 rounded-xl border border-navy-800">
              <div>
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Now Serving</span>
                <span className="text-base font-bold text-cyan-400">{previewData.service.currentToken || 'Q-018'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">In Waiting Line</span>
                <span className="text-base font-bold text-white">{previewData.service.waitingCount ?? 6} Patrons</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Estimated Wait</span>
                <span className="text-base font-bold text-emerald-400">{previewData.service.estimatedWait || '15 min'}</span>
              </div>
            </div>
          </div>
        )}

        {/* 4 Architectural Pillar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
          <div className="bg-[#111C35] border border-[#1E2D4A] rounded-2xl p-5 hover:border-blue-500/40 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-sm font-bold text-white mb-1">Sub-Second Sync</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Socket.IO WebSocket broadcast engine dispatches queue mutations under 100ms.
            </p>
          </div>

          <div className="bg-[#111C35] border border-[#1E2D4A] rounded-2xl p-5 hover:border-cyan-500/40 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-3">
              <QrCode className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-sm font-bold text-white mb-1">Zero-App QR Scan</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Point phone camera to take a verified token in seconds without app installs.
            </p>
          </div>

          <div className="bg-[#111C35] border border-[#1E2D4A] rounded-2xl p-5 hover:border-emerald-500/40 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-sm font-bold text-white mb-1">Adaptive Wait Model</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculates remaining minutes using classical M/M/c and rolling service history.
            </p>
          </div>

          <div className="bg-[#111C35] border border-[#1E2D4A] rounded-2xl p-5 hover:border-purple-500/40 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-sm font-bold text-white mb-1">Anti-Duplicate Guard</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Atomic MongoDB partial unique indexing blocks duplicate active ticket spam.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
