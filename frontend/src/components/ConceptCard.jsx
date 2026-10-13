import React from 'react';
import { Layers } from 'lucide-react';

export default function ConceptCard({ concept, module = "Data Warehousing & Analytics", explanation }) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-6 shadow-lg relative overflow-hidden backdrop-blur-md">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-blue-600/15 text-blue-700 border border-blue-500/30 shrink-0 mt-0.5">
          <Layers className="w-5 h-5" />
        </div>
        
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/15 text-blue-700 border border-blue-500/30">
              Technical Specification
            </span>
            {module && (
              <span className="text-xs text-slate-400">
                Module: <strong className="text-slate-200">{module}</strong>
              </span>
            )}
          </div>
          
          <h4 className="text-sm font-semibold text-white tracking-wide">{concept}</h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{explanation}</p>
        </div>
      </div>
    </div>
  );
}

