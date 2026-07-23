import React from 'react';

function StatCard({ title, value, icon, color, subtext }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    yellow: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };

  return (
    <div className="bg-white p-4.5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center justify-between hover:shadow-sm hover:border-slate-300 transition-all">
      <div className="flex-1 min-w-0 pr-2">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-0.5 truncate">{title}</p>
        <h3 className="text-xl font-black text-slate-800 tracking-tight tabular-nums truncate">{value}</h3>
        {subtext && <p className="text-[9px] font-bold text-slate-500 mt-1 truncate">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-xl border flex items-center justify-center shrink-0 ${colorMap[color] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
        {typeof icon === 'string' ? <span className="text-base font-bold">{icon}</span> : icon}
      </div>
    </div>
  );
}

export default StatCard;

