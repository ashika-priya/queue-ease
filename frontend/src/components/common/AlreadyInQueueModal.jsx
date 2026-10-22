import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, X, Clock, Users, Hash, CheckCircle2 } from 'lucide-react';

export default function AlreadyInQueueModal({ isOpen, onClose, ticketData }) {
  const navigate = useNavigate();

  if (!isOpen || !ticketData) return null;

  const handleViewQueue = () => {
    onClose();
    navigate('/customer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0F1A34] border border-[#2A3C63] rounded-2xl p-6 shadow-2xl text-center">
        {/* Close icon */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-navy-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-3">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>ACTIVE TICKET FOUND</span>
        </div>

        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
          {ticketData.organizationName} • {ticketData.serviceName}
        </p>

        <h3 className="text-xl font-bold text-white mt-1 mb-2">
          You're already in this queue.
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto mb-5">
          You already have an active ticket in {ticketData.serviceName}. A duplicate ticket was not generated.
        </p>

        {/* Token Callout Box */}
        <div className="bg-[#152347] border border-[#273B6B] rounded-xl p-4 mb-5 shadow-inner">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Your Current Token Number
          </span>
          <div className="text-4xl font-extrabold text-white tracking-tight text-cyan-400">
            {ticketData.tokenNumber}
          </div>
          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Status: {ticketData.status === 'calling' ? 'Now Calling!' : 'Waiting in Line'}
          </span>
        </div>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-6 text-left">
          <div className="bg-navy-900/90 border border-navy-800 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Hash className="w-3.5 h-3.5 text-blue-400" />
              <span>In Line</span>
            </div>
            <p className="text-base font-bold text-white">
              #{ticketData.sequenceNumber || ticketData.peopleAhead + 1}
            </p>
          </div>

          <div className="bg-navy-900/90 border border-navy-800 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>People Ahead</span>
            </div>
            <p className="text-base font-bold text-white">
              {ticketData.peopleAhead ?? 5}
            </p>
          </div>

          <div className="bg-navy-900/90 border border-navy-800 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Estimated Wait</span>
            </div>
            <p className="text-base font-bold text-emerald-400">
              {ticketData.estimatedWait || '15 min'}
            </p>
          </div>

          <div className="bg-navy-900/90 border border-navy-800 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Now Serving</span>
            </div>
            <p className="text-base font-bold text-cyan-300">
              {ticketData.nowServing || 'Q-018'}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-300 bg-navy-800 hover:bg-navy-700 border border-[#273B6B] rounded-xl transition-colors"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={handleViewQueue}
            className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl shadow-glow-blue transition-all flex items-center justify-center gap-1.5"
          >
            <span>View My Queue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
