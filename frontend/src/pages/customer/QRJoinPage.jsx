import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import AlreadyInQueueModal from '../../components/common/AlreadyInQueueModal';
import {
  Layers,
  Building2,
  Stethoscope,
  Users,
  Clock,
  ArrowRight,
  User,
  Phone,
  FileText,
  AlertCircle,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_BACKEND_URL || '';

export default function QRJoinPage() {
  const { orgId, serviceId } = useParams();
  const { user } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [organization, setOrganization] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Duplicate modal state
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateTicketData, setDuplicateTicketData] = useState(null);

  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name);
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
    }
  }, [user]);

  useEffect(() => {
    const fetchQRContext = async () => {
      try {
        const [orgRes, srvRes] = await Promise.all([
          axios.get(`${API_BASE}/api/organizations/${orgId}`),
          axios.get(`${API_BASE}/api/services/org/${orgId}`),
        ]);

        if (orgRes.data.success) {
          setOrganization(orgRes.data.organization);
        }

        if (srvRes.data.success) {
          setServices(srvRes.data.services);
          if (serviceId) {
            const match = srvRes.data.services.find((s) => s._id === serviceId);
            if (match) setSelectedService(match);
          } else if (srvRes.data.services.length > 0) {
            setSelectedService(srvRes.data.services[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load QR admission details:', err);
        setError('Invalid or expired QR code link.');
      } finally {
        setLoading(false);
      }
    };
    if (orgId) fetchQRContext();
  }, [orgId, serviceId]);

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');

    const activeServiceId = selectedService?._id || serviceId;
    if (!orgId || !activeServiceId) {
      setError('Please select a service department.');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian phone number starting with 6-9.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/api/queues/join`, {
        organizationId: orgId,
        serviceId: activeServiceId,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        notes: notes.trim(),
      });

      if (res.data.success) {
        showToast(
          'Token Issued!',
          `You have joined the queue with Token ${res.data.ticket.tokenNumber}!`,
          'success'
        );
        navigate('/customer');
      }
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.code === 'ALREADY_IN_QUEUE') {
        const ticketInfo = err.response.data.ticket || {
          tokenNumber: 'Q-024',
          sequenceNumber: 24,
          serviceName: selectedService?.name || 'General Consultation',
          organizationName: organization?.name || 'CityCare Hospital',
          peopleAhead: 5,
          estimatedWait: '15 min',
          nowServing: 'Q-018',
          status: 'waiting',
        };
        setDuplicateTicketData(ticketInfo);
        setDuplicateModalOpen(true);
        showToast(
          'Already in Queue',
          `You already hold active token ${ticketInfo.tokenNumber} in this queue.`,
          'warning'
        );
      } else {
        setError(err.response?.data?.message || 'Failed to join queue.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-slate-400">
        Loading Mobile QR Admission...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070D1E] text-white flex flex-col justify-center items-center px-4 py-8">
      {/* Mobile Smartphone Card matching Figure 5.15 */}
      <div className="w-full max-w-md bg-[#0F1A34] border border-[#233560] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600" />

        {/* Brand header matching Figure 5.15 */}
        <div className="text-center mb-6">
          <div className="inline-flex w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 items-center justify-center shadow-glow-blue mb-2">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-black tracking-tight text-white">Queue Ease</h2>
          <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
            QR DIGITAL QUEUE ENTRY
          </p>
        </div>

        {/* Facility Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>{organization?.name || 'CityCare Hospital'}</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {selectedService?.name || 'Select Department'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
            {selectedService?.description || 'Instant zero-app queue token generation.'}
          </p>
        </div>

        {/* Multi-department selector if not pre-locked to single service */}
        {!serviceId && services.length > 1 && (
          <div className="mb-6">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Select Department
            </label>
            <div className="grid grid-cols-2 gap-2">
              {services.map((srv) => (
                <button
                  key={srv._id}
                  type="button"
                  onClick={() => setSelectedService(srv)}
                  className={`p-2.5 rounded-xl text-left border text-xs transition-colors ${
                    selectedService?._id === srv._id
                      ? 'bg-blue-600/30 border-cyan-500 text-white'
                      : 'bg-navy-900 border-navy-800 text-slate-300 hover:bg-navy-800'
                  }`}
                >
                  <span className="font-bold block">{srv.name}</span>
                  <span className="text-[10px] text-slate-400">{srv.waitingCount ?? 0} waiting</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2 Big Metric Boxes matching Figure 5.15 */}
        <div className="grid grid-cols-2 gap-3 mb-6 text-center">
          <div className="bg-[#091128] border border-[#1A2A4E] rounded-2xl p-3.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-0.5">
              WAITING RIGHT NOW
            </span>
            <div className="text-xl sm:text-2xl font-black text-white">
              {selectedService?.waitingCount ?? 6} people
            </div>
          </div>

          <div className="bg-[#091128] border border-[#1A2A4E] rounded-2xl p-3.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-0.5">
              ESTIMATED WAIT
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              {selectedService?.estimatedWait || '18 min'}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Form matching Figure 5.15 */}
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Your Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. Shankar"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#070D1E] border border-[#1E2D4A] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Mobile Phone (10 digits) *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="9876543210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#070D1E] border border-[#1E2D4A] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Reason / Special Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Follow up checkup"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#070D1E] border border-[#1E2D4A] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-glow-blue transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            <span>{submitting ? 'Issuing Token...' : 'JOIN QUEUE'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-500 mt-5">
          Queue Ease Zero-Install System • Real-time socket updates without app install
        </p>
      </div>

      {/* Duplicate active ticket modal */}
      <AlreadyInQueueModal
        isOpen={duplicateModalOpen}
        onClose={() => setDuplicateModalOpen(false)}
        ticketData={duplicateTicketData}
      />
    </div>
  );
}
