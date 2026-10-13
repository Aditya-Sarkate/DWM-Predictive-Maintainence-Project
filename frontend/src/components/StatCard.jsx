import React from 'react';

export default function StatCard({ title, value, unit, subtitle, icon: Icon, color = "blue", badge }) {
  const colorMap = {
    blue:    { border: "border-blue-200",   bg: "bg-blue-50",    text: "text-blue-600",   valCol: "text-blue-700"   },
    emerald: { border: "border-emerald-200",bg: "bg-emerald-50", text: "text-emerald-600",valCol: "text-emerald-700"},
    rose:    { border: "border-rose-200",   bg: "bg-rose-50",    text: "text-rose-600",   valCol: "text-rose-700"   },
    amber:   { border: "border-amber-200",  bg: "bg-amber-50",   text: "text-orange-700",  valCol: "text-orange-800"  },
    purple:  { border: "border-purple-200", bg: "bg-purple-50",  text: "text-purple-600", valCol: "text-purple-700" },
    cyan:    { border: "border-cyan-200",   bg: "bg-cyan-50",    text: "text-cyan-600",   valCol: "text-cyan-700"   },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className={`bg-white border ${scheme.border} rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${scheme.bg} ${scheme.text}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className={`text-2xl lg:text-3xl font-bold tracking-tight ${scheme.valCol}`}>{value}</span>
        {unit && <span className="text-sm font-medium text-gray-400">{unit}</span>}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
        <span>{subtitle}</span>
        {badge && (
          <span className={`px-2 py-0.5 rounded font-medium ${scheme.bg} ${scheme.text} border ${scheme.border}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

