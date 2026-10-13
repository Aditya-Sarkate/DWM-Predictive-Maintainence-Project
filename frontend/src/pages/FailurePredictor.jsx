import React, { useState } from 'react';
import { predictMachineFailure } from '../services/api';
import {
  Zap,
  Play,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Gauge,
  Thermometer,
  RotateCcw,
  Wrench,
  Cpu
} from 'lucide-react';

export default function FailurePredictor() {
  const [inputs, setInputs] = useState({
    product_type: 'L',
    air_temperature: 300.5,
    process_temperature: 310.8,
    rotational_speed: 1350,
    torque: 58.0,
    tool_wear: 175
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await predictMachineFailure({
        product_type: inputs.product_type,
        air_temperature: Number(inputs.air_temperature),
        process_temperature: Number(inputs.process_temperature),
        rotational_speed: Number(inputs.rotational_speed),
        torque: Number(inputs.torque),
        tool_wear: Number(inputs.tool_wear)
      });
      setResult(res);
    } catch (err) {
      console.error(err);
      alert('Prediction failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateInput = (key, value) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const sliderFields = [
    { key: 'air_temperature', label: 'Air Temperature', unit: 'K', min: 295, max: 305, step: 0.1, icon: Thermometer, color: 'blue' },
    { key: 'process_temperature', label: 'Process Temperature', unit: 'K', min: 305, max: 315, step: 0.1, icon: Thermometer, color: 'orange' },
    { key: 'rotational_speed', label: 'Rotational Speed', unit: 'rpm', min: 1100, max: 2900, step: 10, icon: RotateCcw, color: 'cyan' },
    { key: 'torque', label: 'Torque', unit: 'Nm', min: 3, max: 80, step: 0.5, icon: Gauge, color: 'purple' },
    { key: 'tool_wear', label: 'Tool Wear', unit: 'min', min: 0, max: 240, step: 1, icon: Wrench, color: 'amber' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Machine Failure Predictor
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Adjust sensor parameters and predict machine failure using a trained Random Forest model
          </p>
        </div>
        <span className="text-[11px] px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 font-semibold">
          Random Forest Ensemble &bull; 97%+ Accuracy
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Input Controls (3 cols) */}
        <form onSubmit={handlePredict} className="lg:col-span-3 space-y-5">
          {/* Product Type Selector */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl border border-gray-200 p-5">
            <label className="block text-xs font-semibold text-gray-600 mb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-700" />
              Product Quality Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { val: 'L', label: 'Light Duty (L)', desc: '50% of fleet' },
                { val: 'M', label: 'Medium Duty (M)', desc: '30% of fleet' },
                { val: 'H', label: 'Heavy Duty (H)', desc: '20% of fleet' }
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => updateInput('product_type', opt.val)}
                  className={`p-3 rounded-lg border text-left transition-all text-xs ${
                    inputs.product_type === opt.val
                      ? 'bg-blue-600/20 border-blue-500 text-blue-700 ring-1 ring-blue-500/40'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-200'
                  }`}
                >
                  <div className="font-bold text-sm text-gray-900">{opt.val}</div>
                  <div className="text-[11px] mt-0.5">{opt.label}</div>
                  <div className="text-[10px] text-gray-400">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sensor Sliders */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl border border-gray-200 p-5 space-y-5">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Sensor Telemetry Inputs
            </h3>

            {sliderFields.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-gray-400" />
                      {f.label}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step={f.step}
                        min={f.min}
                        max={f.max}
                        value={inputs[f.key]}
                        onChange={(e) => updateInput(f.key, e.target.value)}
                        className="w-24 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-900 font-mono text-right focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-[10px] text-gray-400 w-8">{f.unit}</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={inputs[f.key]}
                    onChange={(e) => updateInput(f.key, e.target.value)}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-500 bg-gray-100"
                  />
                  <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
                    <span>{f.min} {f.unit}</span>
                    <span>{f.max} {f.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Presets & Submit */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setInputs({ product_type: 'H', air_temperature: 298.2, process_temperature: 308.5, rotational_speed: 1550, torque: 38.0, tool_wear: 45 })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/40 text-xs text-emerald-700 transition"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Healthy Machine
            </button>
            <button
              type="button"
              onClick={() => setInputs({ product_type: 'L', air_temperature: 302.5, process_temperature: 311.2, rotational_speed: 1280, torque: 68.5, tool_wear: 215 })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-950/40 border border-rose-500/30 hover:bg-rose-900/40 text-xs text-rose-700 transition"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Critical Failure
            </button>
            <button
              type="button"
              onClick={() => setInputs({ product_type: 'M', air_temperature: 300.8, process_temperature: 310.0, rotational_speed: 1400, torque: 50.0, tool_wear: 130 })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-950/40 border border-amber-500/30 hover:bg-amber-900/40 text-xs text-orange-700 transition"
            >
              <Gauge className="w-3.5 h-3.5" />
              Moderate Risk
            </button>

            <div className="flex-1"></div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-gray-900 font-semibold rounded-xl shadow-lg shadow-blue-500/20 text-sm transition disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              <span>Predict</span>
            </button>
          </div>
        </form>

        {/* Right: Prediction Output (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {result ? (
            <>
              {/* Big Status Card */}
              <div className={`bg-white border border-gray-200 shadow-sm rounded-2xl border p-6 text-center shadow-xl ${
                result.prediction === 1
                  ? 'bg-rose-950/40 border-rose-500/40'
                  : 'bg-emerald-950/40 border-emerald-500/40'
              }`}>
                <div className="mb-3">
                  {result.prediction === 1 ? (
                    <AlertTriangle className="w-12 h-12 text-rose-700 mx-auto" />
                  ) : (
                    <CheckCircle className="w-12 h-12 text-emerald-700 mx-auto" />
                  )}
                </div>
                <div className={`text-3xl font-black ${
                  result.prediction === 1 ? 'text-rose-700' : 'text-emerald-700'
                }`}>
                  {result.predicted_label}
                </div>
                <div className={`text-sm font-mono mt-2 font-semibold ${
                  result.prediction === 1 ? 'text-rose-700' : 'text-emerald-700'
                }`}>
                  {result.risk_level}
                </div>
              </div>

              {/* Probability Gauge */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-gray-500 font-medium">Failure Probability</span>
                  <span className="font-mono font-bold text-gray-900 text-lg">
                    {result.failure_probability_pct}%
                  </span>
                </div>
                <div className="w-full bg-gray-50 rounded-full h-4 border border-gray-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      result.failure_probability_pct > 65
                        ? 'bg-gradient-to-r from-rose-600 to-rose-400'
                        : result.failure_probability_pct > 35
                        ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                        : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                    }`}
                    style={{ width: `${result.failure_probability_pct}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>0% Safe</span>
                  <span>100% Critical</span>
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-xl border border-gray-200 p-5">
                <div className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Recommended Action
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {result.recommended_action}
                </p>
              </div>

              {/* Input Summary */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-xl border border-gray-200 p-4">
                <div className="text-[11px] text-gray-400 font-semibold uppercase mb-2">Input Parameters Used</div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="flex justify-between bg-white rounded p-1.5 border border-gray-200">
                    <span className="text-gray-500">Type</span>
                    <span className="text-gray-900 font-bold">{inputs.product_type}</span>
                  </div>
                  <div className="flex justify-between bg-white rounded p-1.5 border border-gray-200">
                    <span className="text-gray-500">Air T</span>
                    <span className="text-gray-900">{inputs.air_temperature}K</span>
                  </div>
                  <div className="flex justify-between bg-white rounded p-1.5 border border-gray-200">
                    <span className="text-gray-500">Proc T</span>
                    <span className="text-gray-900">{inputs.process_temperature}K</span>
                  </div>
                  <div className="flex justify-between bg-white rounded p-1.5 border border-gray-200">
                    <span className="text-gray-500">Speed</span>
                    <span className="text-gray-900">{inputs.rotational_speed} rpm</span>
                  </div>
                  <div className="flex justify-between bg-white rounded p-1.5 border border-gray-200">
                    <span className="text-gray-500">Torque</span>
                    <span className="text-gray-900">{inputs.torque} Nm</span>
                  </div>
                  <div className="flex justify-between bg-white rounded p-1.5 border border-gray-200">
                    <span className="text-gray-500">Wear</span>
                    <span className="text-gray-900">{inputs.tool_wear} min</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl border border-gray-200 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
              <Zap className="w-16 h-16 text-slate-700 mb-4" />
              <h3 className="text-sm font-semibold text-gray-500 mb-1">No Prediction Yet</h3>
              <p className="text-xs text-gray-400 max-w-xs">
                Adjust the sensor parameters on the left and click <strong className="text-blue-700">Predict</strong> to run the ML inference.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


