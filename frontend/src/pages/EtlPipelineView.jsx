import React, { useState, useEffect } from 'react';
import { fetchEtlStatus, triggerEtlRun } from '../services/api';
import { 
  Workflow, 
  ArrowRight, 
  CheckCircle2, 
  RefreshCw, 
  Database, 
  FileText, 
  Filter, 
  Sparkles, 
  Clock, 
  Layers,
  HardDrive
} from 'lucide-react';

export default function EtlPipelineView() {
  const [etlStatus, setEtlStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [latestRunResult, setLatestRunResult] = useState(null);
  const [activeStep, setActiveStep] = useState(null);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const res = await fetchEtlStatus();
      setEtlStatus(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleRunPipeline = async () => {
    try {
      setRunning(true);
      const result = await triggerEtlRun();
      setLatestRunResult(result);
      await loadStatus();
    } catch (err) {
      console.error(err);
      alert('ETL Execution failed: ' + err.message);
    } finally {
      setRunning(false);
    }
  };

  const etlSteps = [
    {
      id: "raw",
      stepNumber: "1",
      name: "RAW DATA",
      subtext: "ai4i2020.csv",
      icon: FileText,
      color: "border-slate-600 bg-gray-50 text-gray-700",
      description: "10,000 industrial machine sensor records ingested directly from the UCI AI4I 2020 manufacturing stream."
    },
    {
      id: "extract",
      stepNumber: "2",
      name: "EXTRACT",
      subtext: "File Parser & Validator",
      icon: Database,
      color: "border-blue-500 bg-blue-50 text-blue-700",
      description: "Reads raw CSV, validates 14 required columns, verifies encoding, checks header schema, and computes initial byte metrics."
    },
    {
      id: "clean",
      stepNumber: "3",
      name: "CLEAN & IMPUTE",
      subtext: "Quality Assurance",
      icon: Filter,
      color: "border-teal-500 bg-teal-50 text-teal-700",
      description: "Verifies zero duplicate primary keys, checks null distributions (0 missing values), and validates physical sensor ranges."
    },
    {
      id: "transform",
      stepNumber: "4",
      name: "TRANSFORM",
      subtext: "Measure & Key Derivation",
      icon: Sparkles,
      color: "border-purple-500 bg-purple-50 text-purple-700",
      description: "Derives physical measures (temp_difference, power_output), categorizes sensor telemetry into discrete bins, and creates synthetic surrogate keys."
    },
    {
      id: "dimensions",
      stepNumber: "5",
      name: "DIMENSION TABLES",
      subtext: "5 Star Dimensions",
      icon: Layers,
      color: "border-amber-500 bg-amber-50 text-orange-800",
      description: "Generates DIM_DATE (358 days), DIM_PRODUCT (3 variants), DIM_MACHINE (10k assets), DIM_SENSOR (63 binned profiles), and DIM_FAILURE (7 modes)."
    },
    {
      id: "fact",
      stepNumber: "6",
      name: "FACT TABLE",
      subtext: "FACT_MACHINE_MAINTENANCE",
      icon: Workflow,
      color: "border-rose-500 bg-rose-50 text-rose-700",
      description: "Assembles 10,000 grain records with surrogate foreign keys (FK) pointing to dimensions and additive numerical metrics."
    },
    {
      id: "warehouse",
      stepNumber: "7",
      name: "DATA WAREHOUSE",
      subtext: "warehouse.db (SQLite)",
      icon: HardDrive,
      color: "border-emerald-500 bg-emerald-50 text-emerald-700",
      description: "Commits tables to SQLite storage engine, builds B-tree indexes on foreign keys, and records execution audit metadata in etl_log."
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">ETL Pipeline (Extract &bull; Transform &bull; Load)</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Automated pipeline processing raw AI4I telemetry into high-performance Star Schema warehouse
          </p>
        </div>

        <button
          onClick={handleRunPipeline}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-500/20 disabled:opacity-50 transition"
        >
          <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
          <span>{running ? 'Running ETL Pipeline...' : 'Execute Full ETL Pipeline'}</span>
        </button>
      </div>

      {/* Visual Pipeline Flow Chart */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 overflow-x-auto">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Pipeline Flow Architecture
        </h3>

        <div className="flex items-center gap-2 min-w-[850px] py-2">
          {etlSteps.map((step, idx) => {
            const Icon = step.icon;
            const isLast = idx === etlSteps.length - 1;
            const isSelected = activeStep === step.id;

            return (
              <React.Fragment key={step.id}>
                <div
                  onClick={() => setActiveStep(step.id)}
                  className={`flex-1 min-w-[110px] p-3 rounded-xl border text-center cursor-pointer transition-all ${
                    isSelected
                      ? 'ring-2 ring-blue-400 border-blue-400 bg-gray-50 shadow-lg'
                      : `${step.color} hover:scale-105`
                  }`}
                >
                  <div className="flex justify-center mb-1.5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono">Step {step.stepNumber}</div>
                  <div className="text-xs font-bold text-gray-900 tracking-tight mt-0.5">{step.name}</div>
                  <div className="text-[10px] text-gray-500 truncate mt-1">{step.subtext}</div>
                </div>

                {!isLast && (
                  <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Interactive Step Details Inspector */}
      {activeStep && (
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 text-xs text-gray-700">
          <strong className="text-gray-900 uppercase font-bold">
            {etlSteps.find((s) => s.id === activeStep)?.name} Deep-Dive:
          </strong>{' '}
          {etlSteps.find((s) => s.id === activeStep)?.description}
        </div>
      )}

      {/* Pipeline Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="text-[11px] font-medium text-gray-500 uppercase">Records Extracted</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">10,000</div>
          <div className="text-[10px] text-blue-600 mt-1">Source: ai4i2020.csv</div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="text-[11px] font-medium text-gray-500 uppercase">Records Transformed</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">10,000</div>
          <div className="text-[10px] text-purple-600 mt-1">100% Validated</div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="text-[11px] font-medium text-gray-500 uppercase">Records Loaded</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">10,000</div>
          <div className="text-[10px] text-emerald-600 mt-1">In fact_machine_maint</div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="text-[11px] font-medium text-gray-500 uppercase">Dimensions Created</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">5</div>
          <div className="text-[10px] text-orange-700 mt-1">Date, Machine, Product, etc.</div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="text-[11px] font-medium text-gray-500 uppercase">Pipeline Status</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">READY</div>
          <div className="text-[10px] text-gray-500 mt-1">warehouse.db active</div>
        </div>
      </div>

      {/* ETL Execution History Log Table */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span>ETL Execution Audit Trail (etl_log table)</span>
          </h3>
          <span className="text-xs text-gray-500">Maintained in warehouse metadata</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-4">Run ID</th>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Extracted</th>
                <th className="py-2.5 px-4">Transformed</th>
                <th className="py-2.5 px-4">Loaded</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Execution Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-mono">
              {etlStatus?.recent_logs && etlStatus.recent_logs.length > 0 ? (
                etlStatus.recent_logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-4 text-gray-500">#{log.id}</td>
                    <td className="py-2.5 px-4 text-gray-700">{log.run_timestamp}</td>
                    <td className="py-2.5 px-4 text-blue-600">{log.records_extracted.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-purple-600">{log.records_transformed.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-emerald-600">{log.records_loaded.toLocaleString()}</td>
                    <td className="py-2.5 px-4 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-gray-700 font-sans text-[11px]">{log.message}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 font-sans">
                    No ETL runs recorded yet. Click 'Execute Full ETL Pipeline' above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

