import React from 'react';
import { Clock, Users, ArrowRight, XCircle, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';

export default function ActiveTokenTicket({ ticket, onCancel, onRefresh }) {
  if (!ticket) return null;

  const isCalling = ticket.status === 'calling';
  const peopleAhead = ticket.peopleAhead ?? 0;
  
  // Visual progress calculation (5 people ahead -> ~20% complete if queue started at 6 ahead, or dynamic ratio)
  // When calling, 100% progress
  const progressPercent = isCalling
    ? 100
    : Math.max(10, Math.min(95, Math.round(100 - (peopleAhead * 15))));

  return (
    <div className="w-full max-w-xl mx-auto bg-[#111C35] border border-[#1E2D4A] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      {/* Glow highlight */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${
        isCalling
          ? 'bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500 animate-pulse'
          : 'bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600'
      }`} />

      {/* Facility & Department banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E2D4A] pb-4 mb-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 block">
            {ticket.organizationName || 'Facility'}
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {ticket.serviceName || 'Service Desk'}
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          {isCalling ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              YOUR TURN NOW!
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-400"></span>
              Waiting in Line
            </span>
          )}
        </div>
      </div>

      {/* When calling banner */}
      {isCalling && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-center animate-bounce">
          <p className="text-sm font-bold text-emerald-300">
            🔔 YOUR TOKEN IS BEING CALLED!
          </p>
          <p className="text-xs text-emerald-200 mt-0.5">
            Please proceed immediately to{' '}
            <strong className="text-white text-sm underline decoration-emerald-400">
              Counter {ticket.counterNumber || '1'}
            </strong>
          </p>
        </div>
      )}

      {/* Big Token Number Display */}
      <div className="text-center py-4 mb-6 bg-[#0B132B]/80 rounded-2xl border border-[#1E2D4A] shadow-inner">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
          YOUR TOKEN NUMBER
        </p>
        <div className="text-5xl sm:text-6xl font-black tracking-tight text-white drop-shadow-[0_0_20px_rgba(56,189,248,0.35)] text-cyan-400">
          {ticket.tokenNumber}
        </div>
        {ticket.notes && (
          <p className="text-xs text-slate-400 italic mt-2">
            "{ticket.notes}"
          </p>
        )}
      </div>

      {/* 3 Metric Boxes matching Figure 5.8 */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 text-center">
        {/* Now Serving */}
        <div className="bg-[#0E1736] border border-[#1E2D4A] rounded-2xl p-3 sm:p-4">
          <span className="text-[10px] sm:text-xs font-semibold uppercase text-slate-400 tracking-wider block mb-1">
            Now Serving
          </span>
          <div className="text-lg sm:text-2xl font-black text-cyan-400">
            {ticket.nowServing || '—'}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Current Counter Call
          </span>
        </div>

        {/* People Ahead */}
        <div className="bg-[#0E1736] border border-[#1E2D4A] rounded-2xl p-3 sm:p-4">
          <span className="text-[10px] sm:text-xs font-semibold uppercase text-slate-400 tracking-wider block mb-1">
            People Ahead
          </span>
          <div className="text-lg sm:text-2xl font-black text-white">
            {peopleAhead}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {peopleAhead === 1 ? '1 patron ahead' : `${peopleAhead} patrons ahead`}
          </span>
        </div>

        {/* Estimated Wait */}
        <div className="bg-[#0E1736] border border-[#1E2D4A] rounded-2xl p-3 sm:p-4">
          <span className="text-[10px] sm:text-xs font-semibold uppercase text-slate-400 tracking-wider block mb-1">
            Estimated Wait
          </span>
          <div className="text-lg sm:text-2xl font-black text-emerald-400">
            {isCalling ? '0 min' : ticket.estimatedWait || '15 min'}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Dynamic Calculation
          </span>
        </div>
      </div>

      {/* Position progress bar matching Figure 5.8 */}
      <div className="bg-[#0E1736] border border-[#1E2D4A] rounded-2xl p-4 mb-6">
        <div className="flex justify-between items-center text-xs mb-2">
          <span className="text-slate-400 font-medium">Queue Progression</span>
          <span className="text-cyan-400 font-semibold">
            {isCalling ? 'Turn Active' : `${peopleAhead} waiting before you`}
          </span>
        </div>
        <div className="w-full bg-navy-950 rounded-full h-3 overflow-hidden p-0.5 border border-navy-800">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isCalling
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                : 'bg-gradient-to-r from-blue-600 to-cyan-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-medium">
          <span>Joined Line</span>
          <span>Approaching</span>
          <span className="text-emerald-400 font-bold">Counter Desk</span>
        </div>
      </div>

      {/* Metadata bar */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 border-t border-[#1E2D4A] pt-4 mb-4 gap-2">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>Avg Service: ~6 min</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span>Active Counters: {ticket.activeCounters || 2} Open</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between gap-3 pt-2">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-navy-800 hover:bg-navy-700 border border-[#1E2D4A] rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        )}

        {onCancel && (
          <button
            onClick={() => onCancel(ticket.id)}
            className="px-4 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancel Ticket</span>
          </button>
        )}
      </div>
    </div>
  );
}
