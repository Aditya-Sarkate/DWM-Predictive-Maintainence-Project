import React, { useState, useEffect } from 'react';
import { Activity, Database, Server, Clock, LogOut, Shield, Wrench } from 'lucide-react';

export default function Navbar({ currentUser, onLogout }) {
  const [timeStr, setTimeStr] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="h-16 border-b border-gray-200 bg-white shadow-sm sticky top-0 z-40 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-300/40">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-gray-800 tracking-wider uppercase">
              Predictive Maintenance Data Warehouse
            </h1>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 border border-blue-200">
              Enterprise v1.0
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            Industrial Telemetry &bull; AI4I 2020 Dataset
          </p>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-xs text-gray-600">
          <Database className="w-3.5 h-3.5 text-blue-500" />
          <span>10,000 Records</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-xs text-gray-600">
          <Server className="w-3.5 h-3.5 text-emerald-500" />
          <span>warehouse.db</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-600">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Online</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
          <Clock className="w-3.5 h-3.5" />
          <span>{timeStr}</span>
        </div>

        {/* User badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
          isAdmin
            ? 'bg-blue-50 border-blue-200 text-blue-600'
            : 'bg-emerald-50 border-emerald-200 text-emerald-600'
        }`}>
          {isAdmin ? <Shield className="w-3.5 h-3.5" /> : <Wrench className="w-3.5 h-3.5" />}
          <span>{currentUser?.displayName}</span>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-rose-50 border border-gray-200 hover:border-rose-200 text-xs text-gray-500 hover:text-rose-500 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}

