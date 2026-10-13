import React, { useState } from 'react';
import { 
  Key, 
  Link2, 
  Database, 
  Layers, 
  Clock, 
  Cpu, 
  AlertTriangle, 
  CheckCircle,
  Eye
} from 'lucide-react';

export default function StarSchemaView() {
  const [activeNode, setActiveNode] = useState('fact');

  const schemaData = {
    fact: {
      name: "FACT_MACHINE_MAINTENANCE",
      type: "CENTRAL FACT TABLE",
      color: "border-rose-500 bg-rose-50 text-rose-700",
      accent: "bg-rose-500",
      description: "Central grain table containing industrial sensor readings, computed physical measures, and surrogate foreign keys pointing to all dimensions.",
      primaryKey: "maintenance_id (INT)",
      foreignKeys: [
        { fk: "date_key", ref: "DIM_DATE(date_key)" },
        { fk: "machine_key", ref: "DIM_MACHINE(machine_key)" },
        { fk: "product_key", ref: "DIM_PRODUCT(product_key)" },
        { fk: "sensor_key", ref: "DIM_SENSOR(sensor_key)" },
        { fk: "failure_key", ref: "DIM_FAILURE(failure_key)" }
      ],
      measures: [
        "air_temperature (REAL) [K]",
        "process_temperature (REAL) [K]",
        "rotational_speed (INT) [rpm]",
        "torque (REAL) [Nm]",
        "tool_wear (INT) [min]",
        "temp_difference (REAL) [K]",
        "power_output (REAL) [W]",
        "machine_failure (INT) [0/1]",
        "record_count (INT) [default 1]"
      ]
    },
    dim_date: {
      name: "DIM_DATE",
      type: "CONFORMED DIMENSION",
      position: "Top",
      color: "border-blue-500 bg-blue-50 text-blue-700",
      accent: "bg-blue-500",
      description: "Temporal dimension providing a 4-level calendar hierarchy for Roll-Up and Drill-Down operations (Day -> Month -> Quarter -> Year).",
      primaryKey: "date_key (INT, YYYYMMDD)",
      attributes: [
        "full_date (TEXT, YYYY-MM-DD)",
        "day (INT, 1-31)",
        "month (INT, 1-12)",
        "month_name (TEXT, January-December)",
        "quarter (TEXT, Q1-Q4)",
        "year (INT, 2020)",
        "day_of_week (TEXT, Monday-Sunday)"
      ],
      hierarchy: "Day -> Month -> Quarter -> Year"
    },
    dim_product: {
      name: "DIM_PRODUCT",
      type: "OUTRIVER DIMENSION",
      position: "Top Left",
      color: "border-amber-500 bg-amber-50 text-orange-700",
      accent: "bg-amber-500",
      description: "Contains manufacturing product quality grades (L, M, H) representing material variants and design margins.",
      primaryKey: "product_key (INT, 1=L, 2=M, 3=H)",
      attributes: [
        "product_type (TEXT, 'L' / 'M' / 'H')",
        "product_name (TEXT, Light/Med/Heavy Duty)",
        "quality_variant (TEXT, 50% / 30% / 20%)",
        "standard_capacity (INT, Design rating)"
      ],
      hierarchy: "Product Type (L, M, H) -> Quality Grade"
    },
    dim_machine: {
      name: "DIM_MACHINE",
      type: "ENTITY DIMENSION",
      position: "Top Right",
      color: "border-emerald-500 bg-emerald-50 text-emerald-700",
      accent: "bg-emerald-500",
      description: "Maintains industrial asset identity for individual machining centers, lathes, and mills.",
      primaryKey: "machine_key (INT)",
      attributes: [
        "machine_id (TEXT, e.g. M14860)",
        "machine_type (TEXT, CNC Center/Lathe)",
        "installation_year (INT, 2017-2019)",
        "operational_status (TEXT, Active)"
      ],
      hierarchy: "Machine ID -> Machine Station Type"
    },
    dim_sensor: {
      name: "DIM_SENSOR",
      type: "JUNK / PROFILE DIMENSION",
      position: "Bottom Left",
      color: "border-purple-500 bg-purple-50 text-purple-700",
      accent: "bg-purple-500",
      description: "Stores discrete categorical bins for multi-sensor envelopes, allowing rapid Slice & Dice filtering without continuous range scans.",
      primaryKey: "sensor_key (INT)",
      attributes: [
        "temp_category (Low <300K, Normal, High >302K)",
        "speed_category (Low <1400, Optimal, High >1600)",
        "torque_category (Low <35, Normal, High >50)",
        "tool_wear_category (Low <80m, Mod, Critical >160m)",
        "combined_profile (TEXT, Composite sensor signature)"
      ],
      hierarchy: "Reading Threshold -> Operating Envelope"
    },
    dim_failure: {
      name: "DIM_FAILURE",
      type: "CLASSIFICATION DIMENSION",
      position: "Bottom Right",
      color: "border-cyan-500 bg-cyan-50 text-cyan-700",
      accent: "bg-cyan-500",
      description: "Categorizes operational machine health and specific breakdown failure modes (TWF, HDF, PWF, OSF, RNF).",
      primaryKey: "failure_key (INT, 0-6)",
      attributes: [
        "failure_status (Normal Operation / Machine Failure)",
        "failure_type (TWF, HDF, PWF, OSF, RNF)",
        "failure_code (NORMAL, TWF, HDF, PWF, OSF, RNF)",
        "severity_level (None, Moderate, High, Critical)"
      ],
      hierarchy: "Status -> Failure Mode Category"
    }
  };

  const selected = schemaData[activeNode];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Interactive Star Schema Diagram</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Click on any table node to inspect its attributes, primary/foreign keys, and dimensional role
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-gray-200">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> 1 Fact Table
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-gray-200">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> 5 Dimension Tables
          </span>
        </div>
      </div>

      {/* Visual Interactive Diagram Canvas */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 relative overflow-hidden">
        {/* Subtle diagram grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#93c5fd15_1px,transparent_1px),linear-gradient(to_bottom,#93c5fd15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

        {/* Schema Layout Grid */}
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-8 py-4">
          
          {/* Top Node: DIM_DATE */}
          <div className="w-full flex justify-center">
            <button
              onClick={() => setActiveNode('dim_date')}
              className={`w-64 p-4 rounded-xl border text-left transition-all transform hover:-translate-y-1 shadow-lg ${
                activeNode === 'dim_date'
                  ? 'border-blue-400 bg-blue-50 shadow-blue-500/20 ring-2 ring-blue-500/40'
                  : 'border-blue-500/30 bg-white hover:border-blue-500/60 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-blue-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> DIM_DATE
                </span>
                <span className="text-[10px] text-gray-500">PK: date_key</span>
              </div>
              <p className="text-[11px] text-gray-700">Time hierarchy: Day &rarr; Month &rarr; Quarter &rarr; Year</p>
              <div className="mt-2 text-[10px] font-mono text-blue-700 bg-blue-50 p-1 rounded">
                full_date, month, quarter, year...
              </div>
            </button>
          </div>

          {/* Connector Down */}
          <div className="h-6 w-0.5 bg-gradient-to-b from-blue-500 to-rose-500 -my-6"></div>

          {/* Middle Row: [DIM_PRODUCT] <---> [FACT_MACHINE_MAINTENANCE] <---> [DIM_MACHINE] */}
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Left Node: DIM_PRODUCT */}
            <button
              onClick={() => setActiveNode('dim_product')}
              className={`w-full md:w-60 p-4 rounded-xl border text-left transition-all transform hover:-translate-y-1 shadow-lg ${
                activeNode === 'dim_product'
                  ? 'border-amber-400 bg-amber-50 shadow-amber-500/20 ring-2 ring-amber-500/40'
                  : 'border-amber-500/30 bg-white hover:border-amber-500/60 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-orange-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> DIM_PRODUCT
                </span>
                <span className="text-[10px] text-gray-500">PK: product_key</span>
              </div>
              <p className="text-[11px] text-gray-700">Product Quality Grade (L, M, H components)</p>
              <div className="mt-2 text-[10px] font-mono text-orange-700 bg-amber-50 p-1 rounded">
                product_type, quality_variant...
              </div>
            </button>

            {/* Central Fact Node */}
            <button
              onClick={() => setActiveNode('fact')}
              className={`w-full md:w-80 p-5 rounded-2xl border text-left transition-all transform hover:scale-[1.02] shadow-2xl relative ${
                activeNode === 'fact'
                  ? 'border-rose-400 bg-rose-50 shadow-rose-500/25 ring-4 ring-rose-500/30'
                  : 'border-rose-500/50 bg-white hover:border-rose-500 hover:bg-gray-50'
              }`}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-rose-600 text-[10px] font-bold text-gray-900 uppercase tracking-wider shadow">
                Central Fact Table
              </div>
              <div className="flex items-center justify-between text-xs mb-2 mt-1">
                <span className="font-bold text-rose-500 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-rose-700" /> FACT_MACHINE_MAINTENANCE
                </span>
              </div>
              <div className="text-[11px] text-gray-700 space-y-1">
                <div className="text-orange-700 text-[10px]">FKs: date, machine, product, sensor, failure</div>
                <div className="text-emerald-500 text-[10px]">Measures: air_temp, torque, speed, wear, failed</div>
              </div>
              <div className="mt-3 pt-2 border-t border-rose-200 flex items-center justify-between text-[10px] text-rose-500">
                <span>Grain: 1 machine scan</span>
                <span className="font-bold">10,000 Fact Records</span>
              </div>
            </button>

            {/* Right Node: DIM_MACHINE */}
            <button
              onClick={() => setActiveNode('dim_machine')}
              className={`w-full md:w-60 p-4 rounded-xl border text-left transition-all transform hover:-translate-y-1 shadow-lg ${
                activeNode === 'dim_machine'
                  ? 'border-emerald-400 bg-emerald-50 shadow-emerald-500/20 ring-2 ring-emerald-500/40'
                  : 'border-emerald-500/30 bg-white hover:border-emerald-500/60 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" /> DIM_MACHINE
                </span>
                <span className="text-[10px] text-gray-500">PK: machine_key</span>
              </div>
              <p className="text-[11px] text-gray-700">Machine station ID & model classification</p>
              <div className="mt-2 text-[10px] font-mono text-emerald-500 bg-emerald-50 p-1 rounded">
                machine_id, machine_type, status...
              </div>
            </button>
          </div>

          {/* Connector Down */}
          <div className="h-6 w-0.5 bg-gradient-to-b from-rose-500 to-purple-500 -my-6"></div>

          {/* Bottom Row: [DIM_SENSOR] & [DIM_FAILURE] */}
          <div className="w-full flex flex-col md:flex-row items-center justify-around gap-6">
            
            {/* Bottom Left: DIM_SENSOR */}
            <button
              onClick={() => setActiveNode('dim_sensor')}
              className={`w-full md:w-64 p-4 rounded-xl border text-left transition-all transform hover:-translate-y-1 shadow-lg ${
                activeNode === 'dim_sensor'
                  ? 'border-purple-400 bg-purple-50 shadow-purple-500/20 ring-2 ring-purple-500/40'
                  : 'border-purple-500/30 bg-white hover:border-purple-500/60 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-purple-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> DIM_SENSOR
                </span>
                <span className="text-[10px] text-gray-500">PK: sensor_key</span>
              </div>
              <p className="text-[11px] text-gray-700">Binned sensor ranges (temp, speed, torque, wear)</p>
              <div className="mt-2 text-[10px] font-mono text-purple-500 bg-purple-50 p-1 rounded">
                torque_category, tool_wear_category...
              </div>
            </button>

            {/* Bottom Right: DIM_FAILURE */}
            <button
              onClick={() => setActiveNode('dim_failure')}
              className={`w-full md:w-64 p-4 rounded-xl border text-left transition-all transform hover:-translate-y-1 shadow-lg ${
                activeNode === 'dim_failure'
                  ? 'border-cyan-400 bg-cyan-50 shadow-cyan-500/20 ring-2 ring-cyan-500/40'
                  : 'border-cyan-500/30 bg-white hover:border-cyan-500/60 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-cyan-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> DIM_FAILURE
                </span>
                <span className="text-[10px] text-gray-500">PK: failure_key</span>
              </div>
              <p className="text-[11px] text-gray-700">Failure status & breakdown failure modes</p>
              <div className="mt-2 text-[10px] font-mono text-cyan-500 bg-cyan-50 p-1 rounded">
                failure_type, severity_level...
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Selected Table Inspector Details */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              {selected.type}
            </span>
            <h3 className="text-base font-bold text-gray-900 font-mono mt-0.5">{selected.name}</h3>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-gray-100 text-gray-700 border border-gray-200">
            Primary Key: <strong className="text-orange-700">{selected.primaryKey}</strong>
          </span>
        </div>

        <p className="text-xs text-gray-700 mt-3 leading-relaxed">
          {selected.description}
        </p>

        {activeNode === 'fact' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
              <h4 className="text-xs font-semibold text-rose-500 mb-2 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" /> Foreign Key Relationships (Dimension Links)
              </h4>
              <ul className="space-y-1 text-xs font-mono text-gray-700">
                {selected.foreignKeys.map((fk) => (
                  <li key={fk.fk} className="flex items-center justify-between">
                    <span className="text-orange-700">{fk.fk}</span>
                    <span className="text-gray-400">&rarr;</span>
                    <span className="text-blue-500">{fk.ref}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
              <h4 className="text-xs font-semibold text-emerald-500 mb-2 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" /> Fact Measures (Continuous & Additive)
              </h4>
              <ul className="space-y-1 text-xs font-mono text-gray-700">
                {selected.measures.map((m) => (
                  <li key={m} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-xs font-semibold text-blue-500 mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Dimension Attributes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-gray-700">
              {selected.attributes?.map((attr) => (
                <div key={attr} className="flex items-center gap-2 p-1.5 rounded bg-white border border-gray-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  <span>{attr}</span>
                </div>
              ))}
            </div>
            {selected.hierarchy && (
              <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500">
                <strong>Concept Hierarchy:</strong> <span className="text-indigo-500">{selected.hierarchy}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


