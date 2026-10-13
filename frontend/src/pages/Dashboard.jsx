import React, { useState, useEffect } from 'react';
import { 
  fetchDashboardSummary 
} from '../services/api';
import StatCard from '../components/StatCard';
import { 
  Server, 
  AlertTriangle, 
  Gauge, 
  Wrench, 
  Activity, 
  Thermometer, 
  Zap, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchDashboardSummary();
      setData(res);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-gray-500">Loading Data Warehouse metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
        <h3 className="font-semibold text-base mb-1">Failed to load Dashboard data</h3>
        <p className="text-xs mb-3">{error}</p>
        <button onClick={loadData} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs">
          Retry
        </button>
      </div>
    );
  }

  const { kpis, charts } = data;
  const PIE_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#64748b'];

  return (
    <div className="space-y-6">
      {/* Page Title & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Industrial Maintenance Warehouse Dashboard
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Operational telemetry and analytical metrics extracted from AI4I 2020 Star Schema warehouse
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium border border-gray-200 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Cube</span>
        </button>
      </div>

      {/* Top 6 Industrial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Machines"
          value={kpis.total_records?.toLocaleString()}
          subtitle="Monitored records in DW"
          icon={Server}
          color="blue"
          badge="Fact Rows"
        />
        <StatCard
          title="Total Failures"
          value={kpis.total_failures?.toLocaleString()}
          subtitle="Machine breakdowns"
          icon={AlertTriangle}
          color="rose"
          badge="Failure Facts"
        />
        <StatCard
          title="Failure Rate"
          value={`${kpis.failure_rate_pct}%`}
          subtitle="Overall breakdown ratio"
          icon={Activity}
          color="amber"
          badge="Metric"
        />
        <StatCard
          title="Avg Torque"
          value={kpis.avg_torque}
          unit="Nm"
          subtitle="Rotational mechanical load"
          icon={Gauge}
          color="cyan"
          badge="Measure"
        />
        <StatCard
          title="Avg Tool Wear"
          value={kpis.avg_tool_wear}
          unit="min"
          subtitle="Tool cutting life spent"
          icon={Wrench}
          color="purple"
          badge="Measure"
        />
        <StatCard
          title="Avg Speed"
          value={kpis.avg_rotational_speed}
          unit="rpm"
          subtitle="Spindle angular velocity"
          icon={Zap}
          color="emerald"
          badge="Measure"
        />
      </div>

      {/* Primary Analytical Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Failure Distribution by Product Type */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Machine Failure by Product Quality Grade</h3>
              <p className="text-xs text-gray-500">Dimension: DIM_PRODUCT (L: 50%, M: 30%, H: 20%)</p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 font-medium">
              Product Dimension
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.by_product} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#374151' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="total_machines" name="Total Machines" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failures" name="Total Failures" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-gray-500 mt-2 bg-gray-50 p-2 rounded border border-gray-200">
            Observation: Low quality variant (L) machines account for majority of industrial failures due to tighter strain tolerances.
          </p>
        </div>

        {/* Chart 2: Failure Distribution by Tool Wear Category */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Failure Risk by Tool Wear Life Stage</h3>
              <p className="text-xs text-gray-500">Dimension: DIM_SENSOR (Low &lt; 80m, Moderate 80-160m, Critical &gt; 160m)</p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-200 font-medium">
              Sensor Dimension
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.by_tool_wear} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="category" stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#374151' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="failure_count" name="Failure Count" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failure_rate" name="Failure Rate (%)" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-gray-500 mt-2 bg-gray-50 p-2 rounded border border-gray-200">
            Observation: Machine failure probability increases more than 4x once tool wear surpasses 160 minutes.
          </p>
        </div>

        {/* Chart 3: Monthly Machine Monitoring & Breakdowns (2020 Calendar) */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Monthly Temporal Trend (Calendar Year 2020)</h3>
              <p className="text-xs text-gray-500">Dimension: DIM_DATE (Simulated chronological timeline)</p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 font-medium">
              Time Dimension
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.monthly_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#374151' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="failures" name="Failures Occurred" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="avg_torque" name="Avg Torque (Nm)" stroke="#06b6d4" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-gray-500 mt-2 bg-gray-50 p-2 rounded border border-gray-200">
            Observation: Temporal roll-up allows managers to inspect seasonal factory loads and plan preventive maintenance shutdowns.
          </p>
        </div>

        {/* Chart 4: Failure Mode Classification Breakdown */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Specific Failure Mode Breakdown</h3>
              <p className="text-xs text-gray-500">Dimension: DIM_FAILURE (HDF, PWF, OSF, TWF, RNF)</p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 font-medium">
              Failure Dimension
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.failure_modes}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {charts.failure_modes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#374151' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-gray-500 mt-2 bg-gray-50 p-2 rounded border border-gray-200">
            Note: Heat Dissipation (HDF) and Power Failure (PWF) represent critical operational modes requiring cooling & electrical checks.
          </p>
        </div>
      </div>
    </div>
  );
}

