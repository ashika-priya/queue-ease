import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue' }) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-400',
      glow: 'shadow-glow-blue',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      text: 'text-cyan-400',
      glow: 'shadow-glow-cyan',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      glow: 'shadow-glow-emerald',
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      glow: '',
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      text: 'text-purple-400',
      glow: '',
    },
    rose: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-400',
      glow: '',
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-[#111C35] border border-[#1E2D4A] rounded-2xl p-5 hover:border-[#2D4168] transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
          {title}
        </span>
        <div className={`p-2 rounded-xl ${scheme.bg} ${scheme.border} border`}>
          <Icon className={`w-4 h-4 ${scheme.text}`} />
        </div>
      </div>
      <div className="text-3xl font-extrabold text-white tracking-tight mb-1">
        {value}
      </div>
      {subtitle && (
        <p className="text-xs text-slate-400 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
}
