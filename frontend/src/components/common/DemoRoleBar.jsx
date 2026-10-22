import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { User, Stethoscope, ShieldCheck, Radio } from 'lucide-react';

export default function DemoRoleBar() {
  const { user, quickDemoLogin } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();

  const handleSwitch = async (role, destination) => {
    try {
      await quickDemoLogin(role);
      navigate(destination);
    } catch (err) {
      console.error('Demo switch failed:', err);
    }
  };

  return (
    <div className="w-full bg-[#070C1B] border-b border-[#1E2D4A] px-3 py-1.5 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2 z-50">
      <div className="flex items-center space-x-2">
        <span className="text-slate-400 font-medium hidden sm:inline">
          Demo Role Switcher:
        </span>
        <span className="text-slate-500 hidden md:inline">Switch role anytime to test workflows →</span>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => handleSwitch('customer', '/customer')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              user?.role === 'customer'
                ? 'bg-blue-600/30 text-blue-400 border border-blue-500/50'
                : 'bg-navy-800/80 hover:bg-navy-700 text-slate-300 border border-navy-700'
            }`}
            title="Sign in as Shankar (Customer with Active Token Q-024)"
          >
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span>Customer (Shankar)</span>
          </button>

          <button
            onClick={() => handleSwitch('staff', '/staff')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              user?.role === 'staff'
                ? 'bg-cyan-600/30 text-cyan-400 border border-cyan-500/50'
                : 'bg-navy-800/80 hover:bg-navy-700 text-slate-300 border border-navy-700'
            }`}
            title="Sign in as Dr. Sarah Patel (Counter 1 Operator)"
          >
            <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
            <span>Staff (Dr. Sarah)</span>
          </button>

          <button
            onClick={() => handleSwitch('admin', '/admin')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              user?.role === 'admin'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                : 'bg-navy-800/80 hover:bg-navy-700 text-slate-300 border border-navy-700'
            }`}
            title="Sign in as Eleanor Vance (Administrator)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Admin (Eleanor)</span>
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5 bg-navy-900/80 px-2 py-0.5 rounded border border-navy-800 text-[11px]">
          <span className="relative flex h-2 w-2">
            {isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            ></span>
          </span>
          <span className={isConnected ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
            {isConnected ? 'Live Sync' : 'Reconnecting...'}
          </span>
        </div>
      </div>
    </div>
  );
}
