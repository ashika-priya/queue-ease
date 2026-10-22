import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useNotification } from '../../context/NotificationContext';
import ActiveTokenTicket from '../../components/customer/ActiveTokenTicket';
import {
  Ticket,
  PlusCircle,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_BACKEND_URL || '';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { socket, joinQueueRoom, leaveQueueRoom } = useSocket();
  const { showToast, playTurnChime } = useNotification();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActiveTickets = async () => {
    try {
      let url = `${API_BASE}/api/queues/active/my-tickets`;
      if (user?.phone) {
        url += `?phone=${user.phone}`;
      }
      const res = await axios.get(url);
      if (res.data.success) {
        setTickets(res.data.tickets);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActiveTickets();
  }, [user]);

  // Subscribe to queue rooms via Socket.IO
  useEffect(() => {
    if (!socket || tickets.length === 0) return;

    tickets.forEach((t) => {
      if (t.queueId) {
        joinQueueRoom(t.queueId);
      }
    });

    const handleQueueUpdated = (data) => {
      console.log('[Socket] Queue updated event received:', data);
      fetchActiveTickets();
    };

    const handleTicketCalled = (data) => {
      console.log('[Socket] Ticket called event:', data);
      // Check if this called token belongs to this customer
      const myMatch = tickets.find((t) => t.tokenNumber === data.tokenNumber);
      if (myMatch) {
        playTurnChime();
        showToast(
          '🔔 YOUR TURN CALLED!',
          `Please proceed to Counter ${data.counterNumber} for ${data.serviceName}!`,
          'success'
        );
      }
      fetchActiveTickets();
    };

    socket.on('queue:updated', handleQueueUpdated);
    socket.on('ticket:called', handleTicketCalled);

    return () => {
      socket.off('queue:updated', handleQueueUpdated);
      socket.off('ticket:called', handleTicketCalled);
      tickets.forEach((t) => {
        if (t.queueId) {
          leaveQueueRoom(t.queueId);
        }
      });
    };
  }, [socket, tickets]);

  const handleCancelTicket = async (entryId) => {
    if (!window.confirm('Are you sure you want to cancel this active ticket?')) return;
    try {
      const res = await axios.post(`${API_BASE}/api/queues/entry/${entryId}/cancel`);
      if (res.data.success) {
        showToast('Ticket Cancelled', res.data.message, 'info');
        fetchActiveTickets();
      }
    } catch (err) {
      showToast('Error', err.response?.data?.message || 'Failed to cancel ticket', 'error');
    }
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchActiveTickets();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Title Header matching Figure 5.8 */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest block mb-1">
            LIVE TICKET PORTAL
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Where are you in the queue?
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Keep this window open. Real-time updates without refreshing.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-navy-800 hover:bg-navy-700 border border-[#1E2D4A] rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/join"
            className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl shadow-glow-blue flex items-center gap-1.5 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Join Another Queue</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="max-w-xl mx-auto h-72 bg-navy-800/50 rounded-3xl animate-pulse" />
      ) : tickets.length === 0 ? (
        /* Empty State */
        <div className="max-w-md mx-auto text-center bg-[#111C35] border border-[#1E2D4A] rounded-3xl p-8 sm:p-10 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No Active Tickets</h3>
          <p className="text-xs text-slate-400 mb-6">
            You do not currently have any tokens in waiting lines. Scan a facility standee or tap below to get a token.
          </p>
          <Link
            to="/join"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-glow-blue"
          >
            <span>Join a Queue Now</span>
            <PlusCircle className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        /* Render Active Ticket Cards */
        <div className="space-y-6">
          {tickets.map((ticket) => (
            <ActiveTokenTicket
              key={ticket.id}
              ticket={ticket}
              onCancel={handleCancelTicket}
              onRefresh={handleManualRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
