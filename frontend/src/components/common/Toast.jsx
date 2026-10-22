import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toasts, removeToast } = useNotification();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let icon = <Info className="w-5 h-5 text-blue-400 shrink-0" />;
        let borderColor = 'border-blue-500/40';
        let bgGlow = 'shadow-[0_0_20px_rgba(59,130,246,0.2)]';

        if (toast.type === 'success') {
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
          borderColor = 'border-emerald-500/40';
          bgGlow = 'shadow-[0_0_20px_rgba(16,185,129,0.2)]';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
          borderColor = 'border-amber-500/40';
          bgGlow = 'shadow-[0_0_20px_rgba(245,158,11,0.2)]';
        } else if (toast.type === 'error') {
          icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
          borderColor = 'border-rose-500/40';
          bgGlow = 'shadow-[0_0_20px_rgba(239,68,68,0.2)]';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 bg-[#0E1830] border ${borderColor} rounded-xl ${bgGlow} transition-all duration-300 animate-slideUp`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white leading-tight">
                {toast.title}
              </p>
              <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
