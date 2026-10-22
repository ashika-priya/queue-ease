import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import StatCard from '../../components/common/StatCard';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Layers,
  Users,
  CheckCircle2,
  Tv,
  Clock,
  Timer,
  BarChart3,
  QrCode,
  RefreshCw,
  Building2,
  ArrowRight,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_BACKEND_URL || '';

export default function AdminDashboard() {
  const { socket, joinAdminRoom } = useSocket();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/analytics`);
      if (res.data.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (!socket) return;
    joinAdminRoom();

    const handleUpdate = () => {
      fetchAnalytics();
    };

    socket.on('stats:updated', handleUpdate);
    socket.on('queue:updated', handleUpdate);

    return () => {
      socket.off('stats:updated', handleUpdate);
      socket.off('queue:updated', handleUpdate);
    };
  }, [socket]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">
        Loading Enterprise Command Center & Analytics...
      </div>
    );
  }

  const kpis = analytics?.kpis || {
    activeQueues: 3,
    waitingCustomers: 12,
    servedToday: 3,
    activeCounters: 5,
    averageWaitingTime: '15 minutes',
    averageServiceTime: '6 minutes',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Header matching Figure 5.12 */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest block mb-1">
            ENTERPRISE SYSTEM OBSERVABILITY
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Enterprise Analytics & Queue Command
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time aggregate facility metrics, hourly throughput curves, and active counter telemetry
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-navy-800 hover:bg-navy-700 border border-[#1E2D4A] rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/admin/qr"
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-glow-blue flex items-center gap-1.5 transition-all"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Studio</span>
          </Link>

          <Link
            to="/admin/analytics"
            className="px-4 py-2 text-xs font-semibold text-cyan-300 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 rounded-xl flex items-center gap-1.5 transition-all"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Detailed Throughput</span>
          </Link>
        </div>
      </div>

      {/* 6 Live KPI Cards matching Figure 5.12 */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5 sm:gap-4 mb-8">
        <StatCard
          title="Active Queues"
          value={kpis.activeQueues}
          subtitle="Hospital & service desks"
          icon={Layers}
          color="blue"
        />
        <StatCard
          title="Waiting Customers"
          value={kpis.waitingCustomers}
          subtitle="Currently waiting in line"
          icon={Users}
          color="amber"
        />
        <StatCard
          title="Served Today"
          value={kpis.servedToday}
          subtitle="Completed consultations"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Active Counters"
          value={kpis.activeCounters}
          subtitle="Open operational desks"
          icon={Tv}
          color="cyan"
        />
        <StatCard
          title="Avg Waiting Time"
          value={kpis.averageWaitingTime}
          subtitle="Calculated remaining wait"
          icon={Clock}
          color="purple"
        />
        <StatCard
          title="Avg Service Time"
          value={kpis.averageServiceTime}
          subtitle="Rolling 5-consultation avg"
          icon={Timer}
          color="rose"
        />
      </div>

      {/* Hourly Activity Chart matching Figure 5.12 */}
      <div className="bg-[#111C35] border border-[#1E2D4A] rounded-2xl p-6 mb-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Queue Hourly Activity Chart
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Hourly arrival surges correlated with served patron completions
            </p>
          </div>
          <div className="flex items-center space-x-4 text-xs">
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
              Arrival Volume
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              Served Today
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={analytics?.hourlyActivity || []}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorArrivals" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorServed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
              <XAxis dataKey="hour" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0E1736',
                  borderColor: '#233158',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#fff',
                }}
              />
              <Area
                type="monotone"
                dataKey="arrivals"
                name="Arrival Volume"
                stroke="#3B82F6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorArrivals)"
              />
              <Area
                type="monotone"
                dataKey="served"
                name="Served Customers"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorServed)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Access Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/admin/analytics"
          className="bg-[#111C35] border border-[#1E2D4A] rounded-2xl p-6 hover:border-cyan-500/40 transition-colors group"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-white text-base">Departmental Throughput Matrix</h3>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-xs text-slate-400">
            Compare active waiting loads, target service benchmarks, and completion rates across all clinical and banking departments.
          </p>
        </Link>

        <Link
          to="/admin/qr"
          className="bg-[#111C35] border border-[#1E2D4A] rounded-2xl p-6 hover:border-blue-500/40 transition-colors group"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-white text-base">Smart QR Signage Studio</h3>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-xs text-slate-400">
            Generate printable counter standees with automated Wi-Fi LAN IP auto-detection and high-resolution PNG vector export.
          </p>
        </Link>
      </div>
    </div>
  );
}
