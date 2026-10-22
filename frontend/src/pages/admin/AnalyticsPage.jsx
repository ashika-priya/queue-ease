import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3, Clock, Users, CheckCircle2, RefreshCw } from 'lucide-react';

const API_BASE = import.meta.env.VITE_BACKEND_URL || '';

export default function AnalyticsPage() {
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

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">
        Loading Departmental Analytics & Duration Calibration Matrix...
      </div>
    );
  }

  // Format data for Recharts Bar Chart
  const barData = (analytics?.departmentalThroughput || []).map((d) => ({
    name: d.serviceName,
    Waiting: d.currentlyWaiting,
    Completed: d.totalServedToday,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header matching Figure 5.13 */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest block mb-1">
            ADMIN CONSOLE
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Analytics & Queue Performance
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Departmental workloads, throughput metrics, and service time calibration
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-navy-800 hover:bg-navy-700 border border-[#1E2D4A] rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Bar Chart: Queue Load by Service Department matching Figure 5.13 */}
      <div className="bg-[#111C35] border border-[#1E2D4A] rounded-2xl p-6 mb-8 shadow-xl">
        <h2 className="text-base font-bold text-white tracking-tight mb-1">
          Queue Load by Service Department
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Comparison of waiting customer volume against completed consultations across services
        </p>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
              <XAxis dataKey="name" stroke="#64748B" fontSize={11} interval={0} angle={-15} textAnchor="end" />
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
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
              <Bar dataKey="Completed" fill="#10B981" radius={[4, 4, 0, 0]} name="Served Today" />
              <Bar dataKey="Waiting" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Currently Waiting" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Departmental Throughput & Duration Calibration Matrix Table matching Figure 5.13 */}
      <div className="bg-[#111C35] border border-[#1E2D4A] rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-[#1E2D4A] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Departmental Throughput & Service Durations
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Live calibration metrics
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B132B] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1E2D4A]">
              <tr>
                <th className="py-3 px-4">Service Department</th>
                <th className="py-3 px-4">Facility</th>
                <th className="py-3 px-4 text-center">Active Counters</th>
                <th className="py-3 px-4 text-center">Target Avg Service</th>
                <th className="py-3 px-4 text-center">Currently Waiting</th>
                <th className="py-3 px-4 text-center">Total Served Today</th>
                <th className="py-3 px-4 text-center">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2D4A] text-slate-200">
              {analytics?.departmentalThroughput?.map((row) => (
                <tr key={row.serviceId} className="hover:bg-[#152347] transition-colors">
                  <td className="py-3 px-4 font-bold text-white">
                    {row.serviceName}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {row.organizationName}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-cyan-400">
                    {row.activeCounters}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-300">
                    {row.targetAvgServiceTime} min
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-amber-400">
                    {row.currentlyWaiting}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-400">
                    {row.totalServedToday}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                      {row.completionRate}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
