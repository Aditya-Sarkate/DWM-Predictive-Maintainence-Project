import React from 'react';
import { 
  LayoutDashboard, 
  Database, 
  GitFork, 
  Layers, 
  Workflow, 
  Compass, 
  Cpu, 
  LineChart, 
  FileText,
  Zap,
  Shield,
  Wrench
} from 'lucide-react';

const ALL_NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',           icon: LayoutDashboard, roles: ['admin','mechanic'] },
  { id: 'explorer',   label: 'Machine Logs',         icon: Database,        roles: ['admin'] },
  { id: 'warehouse',  label: 'Data Warehouse',       icon: Layers,          roles: ['admin'] },
  { id: 'olap',       label: 'OLAP Analysis',        icon: Compass,         roles: ['admin'] },
  { id: 'mining',     label: 'Data Mining',          icon: Cpu,             roles: ['admin'] },
  { id: 'analytics',  label: 'Analytics',            icon: LineChart,       roles: ['admin','mechanic'] },
  { id: 'predictor',  label: 'Failure Predictor',    icon: Zap,             roles: ['admin','mechanic'] },
  { id: 'about',      label: 'System Documentation', icon: FileText,        roles: ['admin','mechanic'] },
];

export default function Sidebar({ activeTab, setActiveTab, userRole }) {
  const navItems = ALL_NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  const adminItems = navItems.filter(i => ['explorer','warehouse','olap','mining'].includes(i.id));
  const commonItems = navItems.filter(i => !['explorer','warehouse','olap','mining'].includes(i.id));

  const renderItem = (item) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => setActiveTab(item.id)}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all text-left group ${
          isActive
            ? 'bg-blue-600 text-white shadow-sm shadow-blue-300/40'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent'
        }`}
      >
        <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
        <span className="flex-1">{item.label}</span>
        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white/60"></span>}
      </button>
    );
  };

  return (
    <aside className="w-64 border-r border-gray-200 bg-white flex flex-col shrink-0 min-h-[calc(100vh-4rem)] shadow-sm">
      <div className="p-4 flex-1">

        {/* Common tabs (visible to all) */}
        <div className="mb-4">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Operations
          </div>
          <nav className="space-y-1">
            {commonItems.filter(i => i.id !== 'about').map(renderItem)}
          </nav>
        </div>

        {/* Admin-only tabs */}
        {adminItems.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 px-3 mb-2">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Data & Analytics
              </div>
              <Shield className="w-3 h-3 text-blue-700" />
            </div>
            <nav className="space-y-1">
              {adminItems.map(renderItem)}
            </nav>
          </div>
        )}

        {/* Documentation */}
        <div>
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Help
          </div>
          <nav className="space-y-1">
            {commonItems.filter(i => i.id === 'about').map(renderItem)}
          </nav>
        </div>
      </div>

      {/* Role indicator footer */}
      <div className="p-4 border-t border-gray-100">
        <div className={`rounded-xl p-3 border text-xs ${
          userRole === 'admin'
            ? 'bg-blue-50 border-blue-200'
            : 'bg-emerald-50 border-emerald-200'
        }`}>
          <div className={`flex items-center gap-2 font-semibold mb-0.5 ${
            userRole === 'admin' ? 'text-blue-600' : 'text-emerald-600'
          }`}>
            {userRole === 'admin'
              ? <><Shield className="w-3.5 h-3.5" /> Administrator</>
              : <><Wrench className="w-3.5 h-3.5" /> Field Mechanic</>
            }
          </div>
          <p className="text-[11px] text-gray-400 leading-tight">
            {userRole === 'admin'
              ? 'Full system access enabled'
              : 'Operations & predictor access'}
          </p>
        </div>
      </div>
    </aside>
  );
}

