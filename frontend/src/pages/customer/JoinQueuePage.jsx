import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import AlreadyInQueueModal from '../../components/common/AlreadyInQueueModal';
import {
  Building2,
  Stethoscope,
  Landmark,
  Wrench,
  CheckCircle2,
  Clock,
  Users,
  ArrowRight,
  User,
  Phone,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_BACKEND_URL || '';

export default function JoinQueuePage() {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');

  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Duplicate modal state
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateTicketData, setDuplicateTicketData] = useState(null);

  // Sync user details if logged in
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name);
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
    }
  }, [user]);

  // Load organizations
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
      } finally {
        setLoadingOrgs(false);
      }
    };
    fetchOrgs();
  }, []);

  // Load services when organization changes
  useEffect(() => {
    if (!selectedOrgId) return;
    const fetchServices = async () => {
      setLoadingServices(true);
      try {
        const res = await axios.get(`${API_BASE}/api/services/org/${selectedOrgId}`);
        if (res.data.success) {
          setServices(res.data.services);
          if (res.data.services.length > 0) {
            setSelectedServiceId(res.data.services[0]._id);
          } else {
            setSelectedServiceId('');
          }
        }
      } catch (err) {
        console.error('Failed to load services:', err);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, [selectedOrgId]);

  const selectedService = services.find((s) => s._id === selectedServiceId);
  const selectedOrg = organizations.find((o) => o._id === selectedOrgId);

  const getOrgIcon = (type) => {
    if (type === 'Hospital') return <Stethoscope className="w-5 h-5 text-blue-400" />;
    if (type === 'Bank') return <Landmark className="w-5 h-5 text-amber-400" />;
    return <Wrench className="w-5 h-5 text-cyan-400" />;
  };

  const handleGenerateToken = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!selectedOrgId || !selectedServiceId) {
      setFormError('Please select both an organization and service department.');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setFormError('Please enter a valid 10-digit Indian phone number starting with 6-9.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/api/queues/join`, {
        organizationId: selectedOrgId,
        serviceId: selectedServiceId,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        notes: notes.trim(),
      });

      if (res.data.success) {
        showToast(
          'Token Issued Successfully',
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
          organizationName: selectedOrg?.name || 'CityCare Hospital',
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
        setFormError(err.response?.data?.message || 'Failed to join queue.');
        showToast('Admission Error', err.response?.data?.message || 'Failed to join queue', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Title matching Figure 5.5 */}
      <div className="text-center mb-10">
        <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block mb-1">
          SMART REGISTRATION
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Join a Digital Queue
        </h1>
        <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
          Select your destination and service to generate an instant digital token. You can leave the physical waiting area while tracking your live wait time.
        </p>
      </div>

      {formError && (
        <div className="max-w-3xl mx-auto mb-6 p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* STEP 1: SELECT ORGANIZATION (Figure 5.5) */}
      <div className="mb-10">
        <div className="flex items-center space-x-2 mb-4">
          <span className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/40 text-xs font-bold flex items-center justify-center">
            1
          </span>
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Select Organization
          </h2>
        </div>

        {loadingOrgs ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-navy-800 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {organizations.map((org) => {
              const isSelected = selectedOrgId === org._id;
              return (
                <button
                  key={org._id}
                  type="button"
                  onClick={() => setSelectedOrgId(org._id)}
                  className={`p-5 rounded-2xl text-left border transition-all duration-200 relative ${
                    isSelected
                      ? 'bg-[#152347] border-cyan-500 shadow-glow-blue'
                      : 'bg-[#111C35] border-[#1E2D4A] hover:border-slate-600 hover:bg-[#142240]'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-3 right-3 text-cyan-400">
                      <CheckCircle2 className="w-5 h-5 fill-cyan-400 text-[#0B132B]" />
                    </span>
                  )}
                  <div className="p-2.5 rounded-xl bg-navy-900 border border-navy-800 inline-block mb-3">
                    {getOrgIcon(org.type)}
                  </div>
                  <h3 className="font-bold text-white text-base leading-tight mb-1">
                    {org.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-1">
                    {org.tagline || org.type}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* STEP 2: SELECT SERVICE CATEGORY (Figure 5.5) */}
      <div className="mb-10">
        <div className="flex items-center space-x-2 mb-4">
          <span className="w-6 h-6 rounded-full bg-cyan-600/30 text-cyan-400 border border-cyan-500/40 text-xs font-bold flex items-center justify-center">
            2
          </span>
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Select Service Category
          </h2>
        </div>

        {loadingServices ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 bg-navy-800 rounded-2xl" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <p className="text-xs text-slate-400">No active services found for this facility.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((srv) => {
              const isSelected = selectedServiceId === srv._id;
              return (
                <button
                  key={srv._id}
                  type="button"
                  onClick={() => setSelectedServiceId(srv._id)}
                  className={`p-5 rounded-2xl text-left border transition-all duration-200 relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#152347] border-cyan-500 shadow-glow-blue'
                      : 'bg-[#111C35] border-[#1E2D4A] hover:border-slate-600 hover:bg-[#142240]'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-3 right-3 text-cyan-400">
                      <CheckCircle2 className="w-5 h-5 fill-cyan-400 text-[#0B132B]" />
                    </span>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        PREFIX: {srv.prefix}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        {srv.averageServiceTime} min avg
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-base leading-snug mb-1">
                      {srv.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {srv.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-3 border-t border-navy-800/80 text-slate-300">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <strong>{srv.waitingCount ?? 0}</strong> in line
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      ~{srv.estimatedWait || '0 min'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* STEP 3: CUSTOMER INFORMATION FORM (Figure 5.6) */}
      <div className="max-w-3xl mx-auto bg-[#111C35] border border-[#1E2D4A] rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center space-x-2 mb-6">
          <span className="w-6 h-6 rounded-full bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center justify-center">
            3
          </span>
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Customer Information & Token Issuance
          </h2>
        </div>

        <form onSubmit={handleGenerateToken} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Shankar"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0B132B] border border-[#1E2D4A] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
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
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0B132B] border border-[#1E2D4A] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Enter Indian 10-digit number (e.g. 9876543210)
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Reason for Visit / Special Notes (Optional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <textarea
                rows={2}
                placeholder="Brief description of symptoms, transaction, or inquiry..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0B132B] border border-[#1E2D4A] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Wait estimate summary matching Figure 5.6 */}
          <div className="p-4 rounded-2xl bg-[#0B132B] border border-navy-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs text-slate-300">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>
                Target Desk:{' '}
                <strong className="text-white">
                  {selectedOrg?.name} — {selectedService?.name}
                </strong>
              </span>
            </div>
            <div className="text-xs text-slate-300">
              Estimated Wait:{' '}
              <strong className="text-emerald-400 text-sm">
                ~{selectedService?.estimatedWait || '15 min'}
              </strong>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-6 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl shadow-glow-blue transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{submitting ? 'Verifying Queue Admission...' : 'Generate My Token'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Duplicate Active Queue Prevention Modal */}
      <AlreadyInQueueModal
        isOpen={duplicateModalOpen}
        onClose={() => setDuplicateModalOpen(false)}
        ticketData={duplicateTicketData}
      />
    </div>
  );
}
