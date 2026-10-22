import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import QRCode from 'qrcode';
import { useNotification } from '../../context/NotificationContext';
import {
  QrCode,
  Building2,
  Layers,
  Wifi,
  ExternalLink,
  Copy,
  Download,
  CheckCircle2,
  Camera,
  Sparkles,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_BACKEND_URL || '';

export default function QRCodeManagementPage() {
  const { showToast } = useNotification();
  const canvasRef = useRef(null);

  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(''); // '' means facility-wide entrance pass

  const [networkInfo, setNetworkInfo] = useState(null);
  const [useLanIp, setUseLanIp] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Load organizations and network info
  useEffect(() => {
    const initData = async () => {
      try {
        const [orgRes, netRes] = await Promise.all([
          axios.get(`${API_BASE}/api/organizations`),
          axios.get(`${API_BASE}/api/admin/network-info`),
        ]);

        if (orgRes.data.success && orgRes.data.organizations.length > 0) {
          setOrganizations(orgRes.data.organizations);
          setSelectedOrgId(orgRes.data.organizations[0]._id);
        }

        if (netRes.data.success) {
          setNetworkInfo(netRes.data);
        }
      } catch (err) {
        console.error('Failed to load QR setup data:', err);
      }
    };
    initData();
  }, []);

  // Load services when organization changes
  useEffect(() => {
    if (!selectedOrgId) return;
    const fetchServices = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/services/org/${selectedOrgId}`);
        if (res.data.success) {
          setServices(res.data.services);
        }
      } catch (err) {
        console.error('Failed to load services:', err);
      }
    };
    fetchServices();
  }, [selectedOrgId]);

  // Determine host baseUrl
  const hostBase = useLanIp && networkInfo?.detectedUrl
    ? networkInfo.detectedUrl
    : (window.location.origin || 'http://localhost:3000');

  // Compute final QR target URL (Hierarchical scheme: /join/:orgId or /join/:orgId/:serviceId)
  const targetUrl = selectedServiceId
    ? `${hostBase}/join/${selectedOrgId}/${selectedServiceId}`
    : `${hostBase}/join/${selectedOrgId}`;

  // Generate QR Code image
  useEffect(() => {
    if (!targetUrl) return;

    QRCode.toDataURL(
      targetUrl,
      {
        width: 320,
        margin: 2,
        color: {
          dark: '#0B132B',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      },
      (err, url) => {
        if (!err) {
          setQrDataUrl(url);
        }
      }
    );
  }, [targetUrl]);

  const selectedOrg = organizations.find((o) => o._id === selectedOrgId);
  const selectedService = services.find((s) => s._id === selectedServiceId);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    showToast('Link Copied', 'Target QR URL copied to clipboard!', 'success');
  };

  const handleOpenLink = () => {
    window.open(targetUrl, '_blank');
  };

  // High-Resolution Standee PNG Vector Renderer and Downloader
  const handleDownloadStandee = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');

    // Background: Clean elegant white standee card
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative top header stripe
    ctx.fillStyle = '#2563EB';
    ctx.fillRect(0, 0, canvas.width, 30);

    // Title Badge
    ctx.fillStyle = '#EFF6FF';
    ctx.beginPath();
    ctx.roundRect(400, 100, 400, 50, 25);
    ctx.fill();

    ctx.fillStyle = '#2563EB';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      selectedServiceId ? 'DEPARTMENT COUNTER STANDEE' : 'DIGITAL ENTRANCE FAST PASS',
      600,
      132
    );

    // Organization Name
    ctx.fillStyle = '#0B132B';
    ctx.font = 'bold 56px Inter, sans-serif';
    ctx.fillText(selectedOrg?.name || 'CityCare Hospital', 600, 230);

    // Department Header
    ctx.fillStyle = '#3B82F6';
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillText(
      selectedService ? `${selectedService.name} (Prefix: ${selectedService.prefix})` : 'Welcome Desk • All Departments',
      600,
      290
    );

    // Tagline
    ctx.fillStyle = '#64748B';
    ctx.font = 'italic 24px Inter, sans-serif';
    ctx.fillText(selectedOrg?.tagline || 'Compassionate Care, Seamless Experience', 600, 340);

    // QR Code Image
    const qrImg = new Image();
    qrImg.onload = () => {
      // Draw QR centered
      ctx.drawImage(qrImg, 300, 420, 600, 600);

      // Scan instruction
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 32px Inter, sans-serif';
      ctx.fillText('POINT PHONE CAMERA TO SCAN', 600, 1100);

      ctx.fillStyle = '#475569';
      ctx.font = '22px Inter, sans-serif';
      ctx.fillText('No app installation required. Get your digital token instantly', 600, 1150);
      ctx.fillText('and wait comfortably anywhere.', 600, 1185);

      // Footer
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(100, 1300, 1000, 2);

      ctx.fillStyle = '#64748B';
      ctx.font = '20px Inter, sans-serif';
      ctx.fillText('Direct Mobile Scan • Queue Ease Smart Queue Management', 600, 1360);

      // Trigger download
      const link = document.createElement('a');
      link.download = `Standee-${(selectedOrg?.name || 'Facility').replace(/\s+/g, '_')}-${(selectedService?.name || 'Entrance').replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('Standee Downloaded', 'High-resolution standee PNG downloaded successfully!', 'success');
    };
    qrImg.src = qrDataUrl;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header matching Figure 5.9 */}
      <div className="mb-8">
        <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest block mb-1">
          SMART QR SYSTEM
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          QR Code Management & Standee Generator
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Generate printable physical counter signage and entrance fast-pass passes with automated Wi-Fi LAN IP detection
        </p>
      </div>

      {/* Selectors and Host IP Bar matching Figure 5.9 */}
      <div className="bg-[#111C35] border border-[#1E2D4A] rounded-2xl p-6 mb-8 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          {/* Select Organization */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
              1. Select Organization
            </label>
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0B132B] border border-[#1E2D4A] rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              {organizations.map((org) => (
                <option key={org._id} value={org._id}>
                  {org.name} ({org.type})
                </option>
              ))}
            </select>
          </div>

          {/* Select Service / Scope */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
              2. Select Scope / Service Desk
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0B132B] border border-[#1E2D4A] rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">🏢 Main Entrance Pass (All Services Menu)</option>
              {services.map((srv) => (
                <option key={srv._id} value={srv._id}>
                  🏷️ {srv.name} (Prefix: {srv.prefix})
                </option>
              ))}
            </select>
          </div>

          {/* Network Host / LAN IP Auto-detection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider flex items-center justify-between">
              <span>3. Target Host / Wi-Fi LAN IP</span>
              {networkInfo && (
                <span className="text-[10px] text-emerald-400 font-bold">
                  ● {networkInfo.detectedIp}
                </span>
              )}
            </label>
            <div className="flex rounded-xl bg-[#0B132B] border border-[#1E2D4A] p-1">
              <button
                type="button"
                onClick={() => setUseLanIp(true)}
                className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  useLanIp
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>Wi-Fi LAN IP</span>
              </button>
              <button
                type="button"
                onClick={() => setUseLanIp(false)}
                className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  !useLanIp
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>localhost</span>
              </button>
            </div>
          </div>
        </div>

        {/* Informational banner about mobile scanning on Wi-Fi */}
        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-slate-300 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            <strong>Mobile Phone Camera Testing:</strong> Mobile phones cannot access <code className="text-cyan-300 bg-navy-900 px-1 py-0.5 rounded">localhost</code> on your PC.
            Queue Ease automatically encodes your host machine's Wi-Fi LAN IP (<strong>{networkInfo?.detectedIp || '192.168.x.x'}</strong>) so phone cameras on the same network open the registration page immediately!
          </span>
        </div>
      </div>

      {/* Standee Preview & Verification Actions matching Figure 5.9 and 5.10 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Printable Standee Preview matching Figure 5.10 */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-sm bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-slate-200 text-center relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3 h-3" />
              <span>{selectedServiceId ? 'Department Counter Standee' : 'Digital Entrance Fast Pass'}</span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              {selectedOrg?.name || 'CityCare Hospital'}
            </h2>
            <p className="text-xs font-bold text-blue-600 mt-0.5">
              {selectedService ? `${selectedService.name} • Prefix: ${selectedService.prefix}` : 'Welcome Desk • All Departments'}
            </p>
            <p className="text-[11px] text-slate-500 italic mt-1">
              {selectedOrg?.tagline || 'Compassionate Care, Seamless Experience'}
            </p>

            {/* Rendered QR Code */}
            <div className="my-5 flex justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Scannable QR Code"
                  className="w-56 h-56 rounded-2xl p-2 border-2 border-slate-100 shadow-sm"
                />
              ) : (
                <div className="w-56 h-56 bg-slate-100 rounded-2xl animate-pulse" />
              )}
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-900 mb-1">
              <Camera className="w-4 h-4 text-blue-600" />
              <span>POINT PHONE CAMERA TO SCAN</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight max-w-[240px] mx-auto">
              No app installation required. Get your digital token instantly and wait comfortably anywhere.
            </p>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <span>{selectedService ? 'Direct Queue' : 'Direct Selection'}</span>
              <span>Queue Ease Smart System</span>
            </div>
          </div>
        </div>

        {/* Encoded URL Inspector & Actions Panel matching Figure 5.9 */}
        <div className="lg:col-span-5 bg-[#111C35] border border-[#1E2D4A] rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Actual Encoded Scan URL
            </span>
            <div className="p-3 bg-[#0B132B] border border-[#1E2D4A] rounded-xl text-xs font-mono text-cyan-300 break-all select-all">
              {targetUrl}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleOpenLink}
              className="w-full py-2.5 px-4 rounded-xl bg-navy-800 hover:bg-navy-700 border border-[#1E2D4A] text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-cyan-400" />
              <span>Open in New Browser Tab</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 px-4 rounded-xl bg-navy-800 hover:bg-navy-700 border border-[#1E2D4A] text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Copy className="w-4 h-4 text-blue-400" />
              <span>Copy Encoded URL</span>
            </button>

            <button
              onClick={handleDownloadStandee}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-glow-blue transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Printable Standee (PNG)</span>
            </button>
          </div>

          <div className="pt-4 border-t border-[#1E2D4A] text-[11px] text-slate-400 space-y-1">
            <p>• Zero sensitive PII encoded in public QR codes (NFR-04 compliant).</p>
            <p>• Scannable from physical counter acrylic stands or mobile phone screens.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
