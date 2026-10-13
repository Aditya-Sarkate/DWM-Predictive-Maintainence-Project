import React, { useState, useEffect } from 'react';
import { 
  fetchOlapRollup, 
  fetchOlapDrilldown, 
  fetchOlapSlice, 
  postOlapDice, 
  fetchOlapPivot 
} from '../services/api';
import { 
  Compass, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  Scissors, 
  Box, 
  RotateCcw, 
  Play, 
  RefreshCw 
} from 'lucide-react';
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

export default function OlapAnalysis() {
  const [activeOp, setActiveOp] = useState('rollup'); // rollup, drilldown, slice, dice, pivot
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Roll-Up Controls
  const [rollupDim, setRollupDim] = useState('month');
  const [rollupMeasure, setRollupMeasure] = useState('failure_count');

  // Drill-Down Controls
  const [drillHierarchy, setDrillHierarchy] = useState('quarter_to_month');
  const [drillParent, setDrillParent] = useState('Q2');

  // Slice Controls
  const [sliceDim, setSliceDim] = useState('product_type');
  const [sliceVal, setSliceVal] = useState('M');

  // Dice Controls
  const [diceProduct, setDiceProduct] = useState('M');
  const [diceMinTorque, setDiceMinTorque] = useState(45);
  const [diceMinWear, setDiceMinWear] = useState(100);
  const [diceStatus, setDiceStatus] = useState('All');

  // Pivot Controls
  const [pivotRow, setPivotRow] = useState('product_type');
  const [pivotCol, setPivotCol] = useState('failure_status');
  const [pivotMetric, setPivotMetric] = useState('count');

  // Execute the selected OLAP operation
  const executeOperation = async () => {
    try {
      setLoading(true);
      let data = null;

      if (activeOp === 'rollup') {
        data = await fetchOlapRollup(rollupDim, rollupMeasure);
      } else if (activeOp === 'drilldown') {
        data = await fetchOlapDrilldown(drillHierarchy, drillParent);
      } else if (activeOp === 'slice') {
        data = await fetchOlapSlice(sliceDim, sliceVal);
      } else if (activeOp === 'dice') {
        data = await postOlapDice({
          product_type: diceProduct,
          min_torque: diceMinTorque ? Number(diceMinTorque) : null,
          min_tool_wear: diceMinWear ? Number(diceMinWear) : null,
          failure_status: diceStatus
        });
      } else if (activeOp === 'pivot') {
        data = await fetchOlapPivot(pivotRow, pivotCol, pivotMetric);
      }

      setResult(data);
    } catch (err) {
      console.error(err);
      alert('OLAP Execution Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeOperation();
  }, [activeOp]);

  const operations = [
    { id: 'rollup', label: 'Roll-Up', icon: ArrowUpRight, desc: 'Climb concept hierarchy (summarize)' },
    { id: 'drilldown', label: 'Drill-Down', icon: ArrowDownRight, desc: 'Step down concept hierarchy (detail)' },
    { id: 'slice', label: 'Slice', icon: Scissors, desc: 'Filter on 1 dimension (2D plane)' },
    { id: 'dice', label: 'Dice', icon: Box, desc: 'Filter on 2+ dimensions (sub-cube)' },
    { id: 'pivot', label: 'Pivot', icon: RotateCcw, desc: 'Rotate axes / cross-tabulation' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">OLAP Multi-Dimensional Analysis Engine</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Interactive On-Line Analytical Processing queries executed directly against Star Schema tables
          </p>
        </div>
      </div>

      {/* OLAP Operation Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {operations.map((op) => {
          const Icon = op.icon;
          const isActive = activeOp === op.id;
          return (
            <button
              key={op.id}
              onClick={() => setActiveOp(op.id)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                isActive
                  ? 'bg-blue-50 border-blue-400 text-blue-600 shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm text-gray-900">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                <span>{op.label}</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1 leading-snug">{op.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Operation User Control Panel */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
            <Compass className="w-4 h-4 text-blue-500" />
            <span>Interactive Controls: {activeOp.toUpperCase()}</span>
          </h3>
          <button
            onClick={executeOperation}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Execute OLAP</span>
          </button>
        </div>

        {/* Dynamic Controls based on selected OLAP operation */}
        {activeOp === 'rollup' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-gray-500 font-medium mb-1.5">Roll-Up Target Dimension:</label>
              <select
                value={rollupDim}
                onChange={(e) => setRollupDim(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:outline-none focus:border-blue-500"
              >
                <option value="month">Month Level (Day &rarr; Month: Jan to Dec)</option>
                <option value="quarter">Quarter Level (Day &rarr; Month &rarr; Quarter: Q1 to Q4)</option>
                <option value="year">Year Level (Day &rarr; Year: 2020 Total)</option>
                <option value="product_type">Product Grade (Machine &rarr; Quality Grade: L, M, H)</option>
                <option value="sensor_wear">Sensor Tool Wear Category (Telemetry &rarr; Wear Life Stage)</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-500 font-medium mb-1.5">Primary Aggregate Measure:</label>
              <select
                value={rollupMeasure}
                onChange={(e) => setRollupMeasure(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:outline-none focus:border-blue-500"
              >
                <option value="failure_count">Total Failures & Failure Rate (%)</option>
                <option value="torque">Average Torque (Nm)</option>
                <option value="tool_wear">Average Tool Wear (min)</option>
              </select>
            </div>
          </div>
        )}

        {activeOp === 'drilldown' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-gray-500 font-medium mb-1.5">Drill-Down Concept Hierarchy Path:</label>
              <select
                value={drillHierarchy}
                onChange={(e) => setDrillHierarchy(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:outline-none focus:border-blue-500"
              >
                <option value="quarter_to_month">Quarter &rarr; Monthly Breakdown (e.g. Q2 &rarr; Apr, May, Jun)</option>
                <option value="month_to_day">Month &rarr; Daily Production Shifts (Month &rarr; Day 1..31)</option>
                <option value="product_failure">Product Type &rarr; Specific Failure Modes</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-500 font-medium mb-1.5">Parent Level Value to Drill Into:</label>
              {drillHierarchy === 'quarter_to_month' ? (
                <select
                  value={drillParent}
                  onChange={(e) => setDrillParent(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="Q1">Quarter 1 (Q1: Jan - Mar)</option>
                  <option value="Q2">Quarter 2 (Q2: Apr - Jun)</option>
                  <option value="Q3">Quarter 3 (Q3: Jul - Sep)</option>
                  <option value="Q4">Quarter 4 (Q4: Oct - Dec)</option>
                </select>
              ) : drillHierarchy === 'month_to_day' ? (
                <select
                  value={drillParent}
                  onChange={(e) => setDrillParent(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="1">Month 1 (January)</option>
                  <option value="3">Month 3 (March)</option>
                  <option value="6">Month 6 (June)</option>
                  <option value="9">Month 9 (September)</option>
                  <option value="12">Month 12 (December)</option>
                </select>
              ) : (
                <select
                  value={drillParent}
                  onChange={(e) => setDrillParent(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="L">Type L (Light Duty)</option>
                  <option value="M">Type M (Medium Duty)</option>
                  <option value="H">Type H (Heavy Duty)</option>
                </select>
              )}
            </div>
          </div>
        )}

        {activeOp === 'slice' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-gray-500 font-medium mb-1.5">Slice Dimension (Select 1 Dimension):</label>
              <select
                value={sliceDim}
                onChange={(e) => {
                  setSliceDim(e.target.value);
                  if (e.target.value === 'product_type') setSliceVal('M');
                  else if (e.target.value === 'failure_status') setSliceVal('Machine Failure');
                  else if (e.target.value === 'torque_category') setSliceVal('High (> 50 Nm)');
                  else if (e.target.value === 'tool_wear_category') setSliceVal('Critical (> 160 min)');
                  else if (e.target.value === 'quarter') setSliceVal('Q3');
                }}
                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:outline-none focus:border-blue-500"
              >
                <option value="product_type">Product Type (DIM_PRODUCT)</option>
                <option value="failure_status">Failure Status (DIM_FAILURE)</option>
                <option value="torque_category">Torque Category (DIM_SENSOR)</option>
                <option value="tool_wear_category">Tool Wear Category (DIM_SENSOR)</option>
                <option value="quarter">Quarter (DIM_DATE)</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-500 font-medium mb-1.5">Slice Cut Value (1D Predicate):</label>
              {sliceDim === 'product_type' ? (
                <select
                  value={sliceVal}
                  onChange={(e) => setSliceVal(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="L">Product Type = 'L' (Low Quality)</option>
                  <option value="M">Product Type = 'M' (Medium Quality)</option>
                  <option value="H">Product Type = 'H' (High Quality)</option>
                </select>
              ) : sliceDim === 'failure_status' ? (
                <select
                  value={sliceVal}
                  onChange={(e) => setSliceVal(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="Machine Failure">Status = 'Machine Failure'</option>
                  <option value="Normal Operation">Status = 'Normal Operation'</option>
                </select>
              ) : sliceDim === 'torque_category' ? (
                <select
                  value={sliceVal}
                  onChange={(e) => setSliceVal(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="Low (< 35 Nm)">Torque = 'Low (&lt; 35 Nm)'</option>
                  <option value="Normal (35-50 Nm)">Torque = 'Normal (35-50 Nm)'</option>
                  <option value="High (> 50 Nm)">Torque = 'High (&gt; 50 Nm)'</option>
                </select>
              ) : sliceDim === 'tool_wear_category' ? (
                <select
                  value={sliceVal}
                  onChange={(e) => setSliceVal(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="Low (< 80 min)">Tool Wear = 'Low (&lt; 80 min)'</option>
                  <option value="Moderate (80-160 min)">Tool Wear = 'Moderate (80-160 min)'</option>
                  <option value="Critical (> 160 min)">Tool Wear = 'Critical (&gt; 160 min)'</option>
                </select>
              ) : (
                <select
                  value={sliceVal}
                  onChange={(e) => setSliceVal(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="Q1">Quarter = 'Q1'</option>
                  <option value="Q2">Quarter = 'Q2'</option>
                  <option value="Q3">Quarter = 'Q3'</option>
                  <option value="Q4">Quarter = 'Q4'</option>
                </select>
              )}
            </div>
          </div>
        )}

        {activeOp === 'dice' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-gray-500 font-medium mb-1">Dimension 1: Product</label>
              <select
                value={diceProduct}
                onChange={(e) => setDiceProduct(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-800 focus:outline-none"
              >
                <option value="All">All Types</option>
                <option value="L">Type L</option>
                <option value="M">Type M</option>
                <option value="H">Type H</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-500 font-medium mb-1">Dimension 2: Min Torque [Nm]</label>
              <input
                type="number"
                value={diceMinTorque}
                onChange={(e) => setDiceMinTorque(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-800 focus:outline-none"
                placeholder="e.g. 45"
              />
            </div>
            <div>
              <label className="block text-gray-500 font-medium mb-1">Dimension 3: Min Wear [min]</label>
              <input
                type="number"
                value={diceMinWear}
                onChange={(e) => setDiceMinWear(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-800 focus:outline-none"
                placeholder="e.g. 100"
              />
            </div>
            <div>
              <label className="block text-gray-500 font-medium mb-1">Dimension 4: Status</label>
              <select
                value={diceStatus}
                onChange={(e) => setDiceStatus(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-800 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Machine Failure">Machine Failure Only</option>
                <option value="Normal Operation">Normal Operation Only</option>
              </select>
            </div>
          </div>
        )}

        {activeOp === 'pivot' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-gray-500 font-medium mb-1.5">Row Axis Dimension:</label>
              <select
                value={pivotRow}
                onChange={(e) => setPivotRow(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:outline-none focus:border-blue-500"
              >
                <option value="product_type">Rows = Product Type (L, M, H)</option>
                <option value="tool_wear_category">Rows = Tool Wear Category</option>
                <option value="speed_category">Rows = Speed Category</option>
                <option value="quarter">Rows = Operating Quarter (Q1-Q4)</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-500 font-medium mb-1.5">Column Axis Dimension:</label>
              <select
                value={pivotCol}
                onChange={(e) => setPivotCol(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:outline-none focus:border-blue-500"
              >
                <option value="failure_status">Columns = Failure Status (Normal / Failed)</option>
                <option value="failure_type">Columns = Failure Mode Types (TWF, HDF, etc.)</option>
                <option value="torque_category">Columns = Torque Category</option>
                <option value="temp_category">Columns = Temperature Category</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-500 font-medium mb-1.5">Cell Aggregation Metric:</label>
              <select
                value={pivotMetric}
                onChange={(e) => setPivotMetric(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:outline-none focus:border-blue-500"
              >
                <option value="count">Count of Machines</option>
                <option value="avg_torque">Average Torque (Nm)</option>
                <option value="avg_tool_wear">Average Tool Wear (min)</option>
                <option value="avg_speed">Average Speed (rpm)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Slice / Dice Sub-Cube Summary Metrics Banner */}
      {result?.summary && (activeOp === 'slice' || activeOp === 'dice') && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-center">
            <span className="text-[11px] text-gray-500">Sub-cube Records</span>
            <div className="text-xl font-bold text-gray-900 mt-0.5">
              {(result.summary.Total_Count || result.summary.Total_Records || 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-center">
            <span className="text-[11px] text-gray-500">Total Failures</span>
            <div className="text-xl font-bold text-rose-600 mt-0.5">
              {result.summary.Total_Failures ?? result.summary.Failures_Count ?? 0}
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-center">
            <span className="text-[11px] text-gray-500">Failure Rate</span>
            <div className="text-xl font-bold text-orange-700 mt-0.5">
              {result.summary.Failure_Rate_Pct ?? 0}%
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-center">
            <span className="text-[11px] text-gray-500">Avg Torque / Load</span>
            <div className="text-xl font-bold text-cyan-600 mt-0.5">
              {result.summary.Avg_Torque || result.summary.Avg_Torque_Nm || 0} Nm
            </div>
          </div>
        </div>
      )}

      {/* Result Data Table */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between text-xs">
          <span className="font-semibold text-gray-900">
            OLAP Result Set ({result?.data?.length || 0} rows displayed)
          </span>
          <span className="text-[11px] text-gray-500">
            Operation: <strong className="text-blue-600">{activeOp.toUpperCase()}</strong>
          </span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-200 sticky top-0 z-10">
              <tr>
                {result?.columns?.map((col) => (
                  <th key={col} className="py-2.5 px-4 whitespace-nowrap">
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-mono">
              {result?.data && result.data.length > 0 ? (
                result.data.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-gray-50 transition-colors">
                    {result.columns.map((col) => {
                      const val = row[col];
                      const isNumeric = typeof val === 'number';
                      return (
                        <td key={col} className="py-2 px-4 whitespace-nowrap text-gray-700">
                          {isNumeric ? (Number.isInteger(val) ? val.toLocaleString() : val.toFixed(2)) : String(val ?? '—')}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={result?.columns?.length || 1} className="py-8 text-center text-gray-400 font-sans">
                    No records found for this OLAP operation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* OLAP Visual Chart (For Rollup & Drilldown) */}
      {result?.chart_data && (activeOp === 'rollup' || activeOp === 'drilldown') && (
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            OLAP {result.operation} Aggregation Chart
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Visual presentation of aggregated cube measures
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={result.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey={result.chart_data[0]?.Dimension_Value !== undefined ? "Dimension_Value" : 
                           result.chart_data[0]?.Month !== undefined ? "Month" :
                           result.chart_data[0]?.Date_Label !== undefined ? "Date_Label" :
                           "Failure_Category"} 
                  stroke="#9ca3af" 
                  tick={{ fill: '#6b7280', fontSize: 11 }} 
                />
                <YAxis stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#374151' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {result.chart_data[0]?.Total_Failures !== undefined && (
                  <Bar dataKey="Total_Failures" name="Total Failures" fill="#ef4444" radius={[4, 4, 0, 0]} />
                )}
                {result.chart_data[0]?.Failures_Count !== undefined && (
                  <Bar dataKey="Failures_Count" name="Failures Count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                )}
                {result.chart_data[0]?.Failures !== undefined && (
                  <Bar dataKey="Failures" name="Failures" fill="#ef4444" radius={[4, 4, 0, 0]} />
                )}
                {result.chart_data[0]?.Record_Count !== undefined && (
                  <Bar dataKey="Record_Count" name="Record Count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                )}
                {result.chart_data[0]?.Avg_Torque_Nm !== undefined && (
                  <Bar dataKey="Avg_Torque_Nm" name="Avg Torque (Nm)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

