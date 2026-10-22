import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useNotification } from '../../context/NotificationContext';
import {
  PhoneCall,
  RotateCcw,
  SkipForward,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Clock,
  Users,
  Building2,
  Stethoscope,
  AlertCircle,
  RefreshCw,
  Hash,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_BACKEND_URL || '';

export default function StaffDashboard() {
  const { user } = useAuth();
  const { socket, joinQueueRoom, leaveQueueRoom } = useSocket();
  const { showToast, playTurnChime } = useNotification();

  const [staffData, setStaffData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStaffQueue = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/queues/staff/my-queue`);
      if (res.data.success) {
        setStaffData(res.data);
      }
    } catch (err) {
      console.error('Failed to load staff queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffQueue();
  }, [user]);

  // Socket room subscription
  useEffect(() => {
    if (!socket || !staffData?.queue?.id) return;

    joinQueueRoom(staffData.queue.id);

    const handleUpdate = () => {
      fetchStaffQueue();
    };

    socket.on('queue:updated', handleUpdate);
    socket.on('queue:status_changed', handleUpdate);

    return () => {
      socket.off('queue:updated', handleUpdate);
      socket.off('queue:status_changed', handleUpdate);
      leaveQueueRoom(staffData.queue.id);
    };
  }, [socket, staffData?.queue?.id]);

  const handleCallNext = async () => {
    if (!staffData?.queue?.id) return;
    setActionLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/queues/${staffData.queue.id}/next`);
      if (res.data.success) {
        playTurnChime();
        showToast('Called Next', res.data.message, 'success');
        fetchStaffQueue();
      }
    } catch (err) {
      showToast('Queue Notice', err.response?.data?.message || 'Failed to call next token', 'info');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecall = async () => {
    if (!staffData?.queue?.id) return;
    setActionLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/queues/${staffData.queue.id}/recall`);
      if (res.data.success) {
        playTurnChime();
        showToast('Re-Announced', res.data.message, 'info');
      }
    } catch (err) {
      showToast('Notice', err.response?.data?.message || 'No calling customer to recall', 'info');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!staffData?.queue?.id) return;
    if (!window.confirm('Skip current customer? Customer will be flagged as skipped.')) return;
    setActionLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/queues/${staffData.queue.id}/skip`);
      if (res.data.success) {
        showToast('Customer Skipped', res.data.message, 'warning');
        fetchStaffQueue();
      }
    } catch (err) {
      showToast('Error', err.response?.data?.message || 'Failed to skip ticket', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!staffData?.queue?.id) return;
    setActionLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/queues/${staffData.queue.id}/complete`);
      if (res.data.success) {
        showToast('Consultation Completed', res.data.message, 'success');
        fetchStaffQueue();
      }
    } catch (err) {
      showToast('Error', err.response?.data?.message || 'Failed to complete consultation', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePause = async () => {
    if (!staffData?.queue?.id) return;
    const isPaused = staffData.queue.status === 'paused';
    const action = isPaused ? 'resume' : 'pause';
    setActionLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/queues/${staffData.queue.id}/${action}`);
      if (res.data.success) {
        showToast('Queue Status Changed', res.data.message, 'info');
        fetchStaffQueue();
      }
    } catch (err) {
      showToast('Error', err.response?.data?.message || 'Failed to toggle pause', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center text-slate-400">
        Loading Service Desk Operator Terminal...
      </div>
    );
  }

  const isPaused = staffData?.queue?.status === 'paused';
  const currentToken = staffData?.currentServing?.tokenNumber || staffData?.queue?.currentToken || 'None';
  const nextToken = staffData?.nextTicket?.tokenNumber || 'None';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Service Terminal Banner matching Figure 5.11 */}
      <div className="bg-[#111C35] border border-[#1E2D4A] rounded-2xl p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {staffData?.organization?.name} • {staffData?.service?.name}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Counter {staffData?.counter?.number || '1'}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-0.5">
              Service Terminal — {staffData?.staff?.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
              isPaused
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`}
            ></span>
            {isPaused ? 'Queue Admissions Paused' : '● Active Service Desk'}
          </span>

          <button
            onClick={fetchStaffQueue}
            className="p-2 text-slate-400 hover:text-white bg-navy-800 rounded-lg border border-[#1E2D4A] transition-colors"
            title="Refresh Terminal"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Metric Cards matching Figure 5.11 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#111C35] border border-[#1E2D4A] rounded-2xl p-4 sm:p-5 text-center">
          <span className="text-[10px] sm:text-xs font-semibold uppercase text-slate-400 tracking-wider block mb-1">
            Current Token
          </span>
          <div className="text-2xl sm:text-4xl font-black text-cyan-400 tracking-tight">
            {currentToken}
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">
            At Counter {staffData?.counter?.number || '1'}
          </span>
        </div>

        <div className="bg-[#111C35] border border-[#1E2D4A] rounded-2xl p-4 sm:p-5 text-center">
          <span className="text-[10px] sm:text-xs font-semibold uppercase text-slate-400 tracking-wider block mb-1">
            Next In Line
          </span>
          <div className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {nextToken}
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">
            Waiting in queue
          </span>
        </div>

        <div className="bg-[#111C35] border border-[#1E2D4A] rounded-2xl p-4 sm:p-5 text-center">
          <span className="text-[10px] sm:text-xs font-semibold uppercase text-slate-400 tracking-wider block mb-1">
            Waiting Customers
          </span>
          <div className="text-2xl sm:text-4xl font-black text-amber-400 tracking-tight">
            {staffData?.waitingCount ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">
            In queue sequence
          </span>
        </div>

        <div className="bg-[#111C35] border border-[#1E2D4A] rounded-2xl p-4 sm:p-5 text-center">
          <span className="text-[10px] sm:text-xs font-semibold uppercase text-slate-400 tracking-wider block mb-1">
            Est. Total Wait
          </span>
          <div className="text-2xl sm:text-4xl font-black text-emerald-400 tracking-tight">
            {staffData?.estimatedTotalWaitMinutes ?? 0} min
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">
            Avg {staffData?.service?.averageServiceTime || 6}m per patron
          </span>
        </div>
      </div>

      {/* Queue Operator Action Controls matching Figure 5.11 */}
      <div className="bg-[#111C35] border border-[#1E2D4A] rounded-2xl p-6 mb-8">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-4">
          Queue Controls
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Call Next */}
          <button
            onClick={handleCallNext}
            disabled={actionLoading || staffData?.waitingCount === 0}
            className="py-3 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs flex flex-col items-center justify-center gap-1.5 shadow-glow-blue transition-all disabled:opacity-40"
          >
            <PhoneCall className="w-5 h-5" />
            <span>Call Next</span>
            <span className="text-[9px] text-blue-200">Advance Line</span>
          </button>

          {/* Recall */}
          <button
            onClick={handleRecall}
            disabled={actionLoading || !staffData?.currentServing}
            className="py-3 px-3 rounded-xl bg-navy-800 hover:bg-navy-700 border border-cyan-500/30 text-cyan-300 font-semibold text-xs flex flex-col items-center justify-center gap-1.5 transition-all disabled:opacity-40"
          >
            <RotateCcw className="w-5 h-5 text-cyan-400" />
            <span>Recall</span>
            <span className="text-[9px] text-slate-400">Re-chime Token</span>
          </button>

          {/* Skip */}
          <button
            onClick={handleSkip}
            disabled={actionLoading || !staffData?.currentServing}
            className="py-3 px-3 rounded-xl bg-navy-800 hover:bg-amber-950/40 border border-amber-500/30 text-amber-300 font-semibold text-xs flex flex-col items-center justify-center gap-1.5 transition-all disabled:opacity-40"
          >
            <SkipForward className="w-5 h-5 text-amber-400" />
            <span>Skip</span>
            <span className="text-[9px] text-slate-400">Absent Customer</span>
          </button>

          {/* Complete */}
          <button
            onClick={handleComplete}
            disabled={actionLoading || !staffData?.currentServing}
            className="py-3 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-semibold text-xs flex flex-col items-center justify-center gap-1.5 transition-all disabled:opacity-40"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Complete</span>
            <span className="text-[9px] text-emerald-400/80">Finish Consultation</span>
          </button>

          {/* Pause / Resume */}
          <button
            onClick={handleTogglePause}
            disabled={actionLoading}
            className={`py-3 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all ${
              isPaused
                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 hover:bg-emerald-600/30'
                : 'bg-rose-600/20 border-rose-500/40 text-rose-300 hover:bg-rose-600/30'
            }`}
          >
            {isPaused ? <PlayCircle className="w-5 h-5 text-emerald-400" /> : <PauseCircle className="w-5 h-5 text-rose-400" />}
            <span>{isPaused ? 'Resume Queue' : 'Pause Queue'}</span>
            <span className="text-[9px] text-slate-400">{isPaused ? 'Allow Admission' : 'Operator Break'}</span>
          </button>
        </div>
      </div>

      {/* Live Waiting Queue Table matching Figure 5.11 */}
      <div className="bg-[#111C35] border border-[#1E2D4A] rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-[#1E2D4A] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Live Waiting Queue
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300">
              {staffData?.waitingList?.length || 0} waiting
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Ordered by arrival sequence (FCFS)
          </span>
        </div>

        {staffData?.waitingList?.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No patrons waiting in queue right now. Ready for arrivals.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B132B] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1E2D4A]">
                <tr>
                  <th className="py-3 px-4">Token</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Joined Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2D4A] text-slate-200">
                {staffData?.waitingList?.map((item, idx) => (
                  <tr
                    key={item._id}
                    className={`hover:bg-[#152347] transition-colors ${
                      idx === 0 ? 'bg-blue-600/5' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-cyan-400">
                      {item.tokenNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-white">
                      {item.customerName}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {item.customerPhone}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(item.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                        Waiting (#{idx + 1})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 italic">
                      {item.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
