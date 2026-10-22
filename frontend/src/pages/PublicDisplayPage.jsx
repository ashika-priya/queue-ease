import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { useNotification } from '../context/NotificationContext';
import {
  Tv,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Clock,
  Sparkles,
  Building2,
  CheckCircle2,
  Radio,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_BACKEND_URL || '';

export default function PublicDisplayPage() {
  const { socket, joinPublicRoom, leavePublicRoom, isConnected } = useSocket();
  const { playTurnChime, showToast } = useNotification();

  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [displayData, setDisplayData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [flashCall, setFlashCall] = useState(false);

  // Digital clock interval
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial organizations
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/organizations`);
        if (res.data.success && res.data.organizations.length > 0) {
          setOrganizations(res.data.organizations);
          setSelectedOrgId(res.data.organizations[0]._id);
        }
      } catch (err) {
        console.error('Failed to load organizations:', err);
      }
    };
    fetchOrgs();
  }, []);

  // Fetch display data for current organization
  const fetchDisplay = async () => {
    if (!selectedOrgId) return;
    try {
      const res = await axios.get(`${API_BASE}/api/queues/public/${selectedOrgId}`);
      if (res.data.success) {
        setDisplayData(res.data);
      }
    } catch (err) {
      console.error('Failed to load public display:', err);
    }
  };

  useEffect(() => {
    fetchDisplay();
  }, [selectedOrgId]);

  // Socket.IO room subscription and real-time event listener
  useEffect(() => {
    if (!socket || !selectedOrgId) return;

    joinPublicRoom(selectedOrgId);

    const handleTicketCalled = (data) => {
      console.log('[TV Display] Ticket called event:', data);
      if (audioEnabled) {
        playTurnChime();
      }
      setFlashCall(true);
      setTimeout(() => setFlashCall(false), 3000);
      fetchDisplay();
    };

    const handleQueueUpdated = () => {
      fetchDisplay();
    };

    socket.on('ticket:called', handleTicketCalled);
    socket.on('queue:updated', handleQueueUpdated);

    return () => {
      socket.off('ticket:called', handleTicketCalled);
      socket.off('queue:updated', handleQueueUpdated);
      leavePublicRoom(selectedOrgId);
    };
  }, [socket, selectedOrgId, audioEnabled]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleTestAudio = () => {
    playTurnChime();
    setAudioEnabled(true);
    showToast('Audio Synthesizer Active', 'Synthesized 659 Hz & 880 Hz harmonic chime played.', 'success');
  };

  const activeCall = displayData?.activeCall || {
    tokenNumber: 'Q-018',
    counterNumber: '1',
    serviceName: 'General Consultation',
  };

  return (
    <div className="min-h-screen bg-[#070D1E] text-white flex flex-col justify-between selection:bg-blue-600 font-sans">
      {/* Top Header Bar matching Figure 5.14 */}
      <header className="px-6 py-4 bg-[#0B132B] border-b border-[#1E2D4A] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-glow-blue">
            <Tv className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{displayData?.organization?.name || 'CityCare Hospital'}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-cyan-400 border border-blue-500/30 font-semibold">
                Lounge Terminal
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              {displayData?.organization?.tagline || 'Live Service Hall & Waiting Lounge Terminal'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Organization Switcher */}
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="px-3 py-1.5 bg-[#070D1E] border border-[#1E2D4A] rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            {organizations.map((org) => (
              <option key={org._id} value={org._id}>
                {org.name}
              </option>
            ))}
          </select>

          {/* Live Clock */}
          <div className="bg-[#070D1E] border border-[#1E2D4A] px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs font-mono font-bold text-cyan-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>

          {/* Live Sync Badge */}
          <div className="flex items-center space-x-1.5 bg-[#070D1E] px-3 py-1.5 rounded-xl border border-[#1E2D4A] text-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-semibold">Live Sync</span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 text-slate-400 hover:text-white bg-[#070D1E] border border-[#1E2D4A] rounded-xl transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Terminal Display Body matching Figure 5.14 */}
      <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Massive Calling Customer Callout */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <div
            className={`bg-[#0E1838] border-2 rounded-3xl p-8 sm:p-12 text-center transition-all duration-500 shadow-2xl relative overflow-hidden ${
              flashCall
                ? 'border-emerald-400 shadow-[0_0_60px_rgba(16,185,129,0.4)] scale-[1.02]'
                : 'border-[#233560]'
            }`}
          >
            {/* Top Callout Header */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-cyan-400 text-xs sm:text-sm font-bold uppercase tracking-widest mb-4">
              <Sparkles className="w-4 h-4" />
              <span>NOW CALLING CUSTOMER — {activeCall.serviceName || 'GENERAL SERVICE DESK'}</span>
            </div>

            {/* Massive Glowing Token Number */}
            <div className="my-6">
              <span className="text-7xl sm:text-9xl font-black tracking-tight text-white drop-shadow-[0_0_35px_rgba(56,189,248,0.5)]">
                {activeCall.tokenNumber || '—'}
              </span>
            </div>

            {/* Counter Destination */}
            <div className="inline-block bg-[#162550] border border-[#2D4580] rounded-2xl px-6 py-3 shadow-inner">
              <p className="text-xs uppercase text-slate-400 font-bold tracking-wider">
                PLEASE PROCEED TO
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-cyan-400">
                Counter {activeCall.counterNumber || '1'}
              </p>
            </div>

            {/* Audio chime enable/test notice */}
            <div className="mt-8 pt-6 border-t border-[#1E2D4A] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Audio chimes & announcements enabled</span>
              </div>
              <button
                onClick={handleTestAudio}
                className="px-3 py-1 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 text-[11px] font-semibold border border-navy-700"
              >
                Test Sound Chime
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Active Queue Status by Department matching Figure 5.14 */}
        <div className="lg:col-span-5 bg-[#0E1838] border border-[#233560] rounded-3xl p-6 sm:p-7 shadow-2xl">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1E2D4A]">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span>Active Queue Status by Department</span>
            </h2>
            <span className="text-xs text-slate-400 font-semibold">
              Live Lounge Feed
            </span>
          </div>

          <div className="space-y-3">
            {displayData?.departmentRows?.map((dept) => (
              <div
                key={dept.serviceId}
                className="p-3.5 rounded-2xl bg-[#091128] border border-[#1A2A4E] flex items-center justify-between hover:border-[#2B437B] transition-colors"
              >
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {dept.serviceName}
                  </h3>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                    <span>Counter {dept.counterNumber}</span>
                    <span>•</span>
                    <span className="text-amber-400">{dept.waitingCount} waiting</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400 font-semibold">Now Serving</div>
                  <div className="text-lg font-black text-cyan-400">
                    {dept.nowServing}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer ticker */}
      <footer className="px-6 py-3 bg-[#0B132B] border-t border-[#1E2D4A] text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <span>Queue Ease Public Display Core • Real-time reactive screen</span>
        <span>Please prepare your digital token ticket before stepping up to the counter desk.</span>
      </footer>
    </div>
  );
}
