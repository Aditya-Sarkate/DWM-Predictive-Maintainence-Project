import React, { useState, useEffect } from 'react';
import { fetchAnalytics } from '../services/api';
import { RefreshCw, Activity } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

export default function AnalyticsView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetchAnalytics();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs text-gray-500">Loading analytics & correlation engine...</p>
        </div>
      </div>
    );
  }

  const { correlation_matrix, speed_torque_curve, insights } = data;
  const corrCols = correlation_matrix ? Object.keys(correlation_matrix) : [];

  // Helper to format temperature range bins (e.g. "(295.291, 296.22]" -> "295.3-296.2 K")
  const formatTempBin = (bin) => {
    if (!bin) return '';
    const match = bin.match(/\(?([0-9.]+),\s*([0-9.]+)\]?/);
    if (match) {
      return `${parseFloat(match[1]).toFixed(1)}-${parseFloat(match[2]).toFixed(1)}K`;
    }
    return bin;
  };

  // Helper to format speed range bins (e.g. "(1166.282, 1339.8]" -> "1166-1340 rpm")
  const formatSpeedBin = (bin) => {
    if (!bin) return '';
    const match = bin.match(/\(?([0-9.]+),\s*([0-9.]+)\]?/);
    if (match) {
      return `${Math.round(parseFloat(match[1]))}-${Math.round(parseFloat(match[2]))}`;
    }
    return bin;
  };

  // Sort product types explicitly L, M, H
  const productOrder = { 'L': 1, 'M': 2, 'H': 3 };
  const sortedProductData = [...(data.failure_by_product || [])].sort((a, b) => 
    (productOrder[a.product_type] || 99) - (productOrder[b.product_type] || 99)
  );

  const formattedTempDist = (data.temp_distribution || []).map(item => ({
    ...item,
    binLabel: formatTempBin(item.temp_bin)
  }));

  const formattedSpeedDist = (data.speed_distribution || []).map(item => ({
    ...item,
    binLabel: formatSpeedBin(item.speed_bin_fine)
  }));

  const tooltipConfig = {
    contentStyle: { backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' },
    itemStyle: { color: '#374151' }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Industrial Engineering Analytics</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Charts and analysis of machine sensor data
        </p>
      </div>

      {/* Engineering Insights Banner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights?.map((ins, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1.5">
              <Activity className="w-4 h-4 text-blue-500 shrink-0" />
              <span>{ins.title}</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{ins.finding}</p>
          </div>
        ))}
      </div>

      {/* 2-Column Grid Layout for Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Failure by Product Type */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-1">
            Failure Rate by Product Type
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Compares failure rate percentages across machine variants (L, M, H)
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedProductData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="product_type" stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 11 }} unit="%" />
                <Tooltip 
                  {...tooltipConfig}
                  formatter={(value, name, item) => [
                    `${value}% (${item.payload.failures} / ${item.payload.total} units)`,
                    name
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="failure_rate" name="Failure Rate (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Tool Wear vs Failure Rate */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-1">
            Tool Wear vs Failure Rate
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Shows how breakdown risk escalates with cumulative tool operating minutes
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.tool_wear_vs_failure || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="wear_bin" stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 11 }} unit="%" />
                <Tooltip 
                  {...tooltipConfig}
                  formatter={(value, name, item) => [
                    `${value}% (${item.payload.failures} / ${item.payload.count} failures)`,
                    name
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="failure_rate" name="Failure Rate (%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Torque vs Failure Rate */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-1">
            Torque vs Failure Rate
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Failure probability across mechanical torque ranges (Nm)
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.torque_vs_failure || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="torque_bin" stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 11 }} unit="%" />
                <Tooltip 
                  {...tooltipConfig}
                  formatter={(value, name, item) => [
                    `${value}% (${item.payload.failures} / ${item.payload.count} failures)`,
                    name
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="failure_rate" name="Failure Rate (%)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Speed vs Torque vs Failure */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-1">
            Speed vs Torque vs Failure Rate
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Mechanical operating regimes showing torque demand and corresponding failure rates
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={speed_torque_curve || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="speed_bin" stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis yAxisId="left" stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#ef4444" tick={{ fill: '#6b7280', fontSize: 11 }} unit="%" />
                <Tooltip {...tooltipConfig} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar yAxisId="left" dataKey="avg_torque" name="Average Torque (Nm)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="failure_rate" name="Failure Rate (%)" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Temperature Distribution */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-1">
            Temperature Distribution & Failures
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Air temperature distribution (Kelvin) with machine breakdown overlay
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedTempDist} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="binLabel" stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={45} />
                <YAxis yAxisId="left" stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#ef4444" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip {...tooltipConfig} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar yAxisId="left" dataKey="count" name="Total Machines" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="failures" name="Failures" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 6: Speed Distribution */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-1">
            Rotational Speed Distribution & Failures
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Rotational speed bins (RPM) with failure incidents overlay
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedSpeedDist} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="binLabel" stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={45} />
                <YAxis yAxisId="left" stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#ef4444" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip {...tooltipConfig} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar yAxisId="left" dataKey="count" name="Total Machines" fill="#34d399" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="failures" name="Failures" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Correlation Matrix Heatmap Table */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Feature Correlation Matrix (Pearson r)</h3>
            <p className="text-xs text-gray-500">Values range from -1.0 (strong inverse) to +1.0 (strong positive correlation)</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs font-mono">
            <thead className="bg-gray-50 text-gray-600 uppercase font-semibold border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-3 text-left">Feature</th>
                {corrCols.map((c) => (
                  <th key={c} className="py-2.5 px-3 whitespace-nowrap">
                    {c.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {corrCols.map((rowName) => (
                <tr key={rowName} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-2.5 px-3 text-left font-bold text-gray-700 whitespace-nowrap font-sans">
                    {rowName.replace(/_/g, ' ')}
                  </td>
                  {corrCols.map((colName) => {
                    const val = correlation_matrix[rowName][colName];
                    const isDiagonal = rowName === colName;
                    
                    let bg = "bg-transparent";
                    let textCol = "text-gray-600";
                    if (!isDiagonal) {
                      if (val > 0.6) { bg = "bg-emerald-100"; textCol = "text-emerald-800 font-bold"; }
                      else if (val > 0.2) { bg = "bg-emerald-50"; textCol = "text-emerald-700"; }
                      else if (val < -0.6) { bg = "bg-rose-100"; textCol = "text-rose-800 font-bold"; }
                      else if (val < -0.2) { bg = "bg-rose-50"; textCol = "text-rose-700"; }
                    } else {
                      textCol = "text-gray-400 bg-gray-50/50";
                    }

                    return (
                      <td key={colName} className={`py-2 px-3 ${bg} ${textCol}`}>
                        {val !== undefined && val !== null ? val.toFixed(2) : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

