import React, { useState, useEffect } from 'react';
import { fetchDataExplorer } from '../services/api';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Database,
  ArrowUpDown
} from 'lucide-react';

export default function DataExplorer() {
  const [records, setRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [productType, setProductType] = useState('All');
  const [failureStatus, setFailureStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [dataView, setDataView] = useState('warehouse'); // 'warehouse' vs 'raw_source'
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchDataExplorer({
        page,
        page_size: pageSize,
        product_type: productType,
        failure_status: failureStatus,
        search: searchTerm
      });
      setRecords(res.records || []);
      setTotalRecords(res.total_records || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, productType, failureStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Machine Logs</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Inspect raw machine sensor logs alongside cleaned Data Warehouse fact records
          </p>
        </div>

        {/* View Switcher: Star Schema Facts vs Raw Ingestion */}
        <div className="flex items-center bg-gray-100 border border-gray-200 rounded-lg p-1 text-xs">
          <button
            onClick={() => setDataView('warehouse')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              dataView === 'warehouse' 
                ? 'bg-blue-600 text-white shadow' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Star Schema Facts (Cleaned)
          </button>
          <button
            onClick={() => setDataView('raw_source')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              dataView === 'raw_source' 
                ? 'bg-blue-600 text-white shadow' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Raw Source CSV Schema
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[260px] max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Machine ID (e.g. M14860) or Date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg font-medium transition"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          {/* Product Type Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Product:</span>
            <select
              value={productType}
              onChange={(e) => { setProductType(e.target.value); setPage(1); }}
              className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Types (L, M, H)</option>
              <option value="L">Type L (Light Duty)</option>
              <option value="M">Type M (Medium Duty)</option>
              <option value="H">Type H (Heavy Duty)</option>
            </select>
          </div>

          {/* Failure Status Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Status:</span>
            <select
              value={failureStatus}
              onChange={(e) => { setFailureStatus(e.target.value); setPage(1); }}
              className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Failed">Failed (Machine Failure = 1)</option>
              <option value="Normal">Normal Operation (= 0)</option>
            </select>
          </div>

          {/* Page Size */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-800 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <button
            onClick={() => { setSearchTerm(''); setProductType('All'); setFailureStatus('All'); setPage(1); }}
            className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition"
            title="Reset Filters"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Machine ID</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Air Temp [K]</th>
                <th className="py-3 px-4">Process Temp [K]</th>
                <th className="py-3 px-4">Speed [rpm]</th>
                <th className="py-3 px-4">Torque [Nm]</th>
                <th className="py-3 px-4">Tool Wear [min]</th>
                {dataView === 'warehouse' && (
                  <>
                    <th className="py-3 px-4">Temp Diff [K]</th>
                    <th className="py-3 px-4">Power [W]</th>
                  </>
                )}
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Failure Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={dataView === 'warehouse' ? 13 : 11} className="py-12 text-center text-gray-500 font-sans">
                    <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
                    Fetching warehouse records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={dataView === 'warehouse' ? 13 : 11} className="py-12 text-center text-gray-400 font-sans">
                    No matching records found for the applied filters.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const isFailed = r.machine_failure === 1;
                  return (
                    <tr 
                      key={r.maintenance_id} 
                      className={`hover:bg-gray-50 transition-colors ${isFailed ? 'bg-rose-50' : ''}`}
                    >
                      <td className="py-2.5 px-4 font-semibold text-gray-700">#{r.maintenance_id}</td>
                      <td className="py-2.5 px-4 text-gray-500">{r.full_date}</td>
                      <td className="py-2.5 px-4 text-blue-600 font-semibold">{r.machine_id}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.product_type === 'L' ? 'bg-amber-100 text-orange-800 border border-amber-200' :
                          r.product_type === 'M' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                          'bg-purple-100 text-purple-700 border border-purple-200'
                        }`}>
                          {r.product_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-gray-800">{r.air_temperature.toFixed(1)}</td>
                      <td className="py-2.5 px-4 text-gray-800">{r.process_temperature.toFixed(1)}</td>
                      <td className="py-2.5 px-4 text-gray-800">{r.rotational_speed}</td>
                      <td className="py-2.5 px-4 text-gray-800">{r.torque.toFixed(1)}</td>
                      <td className="py-2.5 px-4">
                        <span className={r.tool_wear > 160 ? 'text-rose-600 font-bold' : 'text-gray-700'}>
                          {r.tool_wear}m
                        </span>
                      </td>
                      {dataView === 'warehouse' && (
                        <>
                          <td className="py-2.5 px-4 text-emerald-600">+{r.temp_difference.toFixed(1)}</td>
                          <td className="py-2.5 px-4 text-cyan-600">{r.power_output.toFixed(0)}</td>
                        </>
                      )}
                      <td className="py-2.5 px-4 font-sans">
                        {isFailed ? (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-700 border border-rose-200 w-fit">
                            <AlertCircle className="w-3 h-3 text-rose-500" />
                            Failed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700 border border-emerald-200 w-fit">
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-gray-700 font-sans text-[11px]">
                        {r.failure_type === 'No Failure' ? (
                          <span className="text-gray-400">—</span>
                        ) : (
                          <span className="font-medium text-rose-600">{r.failure_type}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-500">
          <div>
            Showing <strong className="text-gray-800">{records.length}</strong> of{' '}
            <strong className="text-gray-800">{totalRecords.toLocaleString()}</strong> filtered records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 rounded bg-white border border-gray-200 font-mono text-gray-800">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

