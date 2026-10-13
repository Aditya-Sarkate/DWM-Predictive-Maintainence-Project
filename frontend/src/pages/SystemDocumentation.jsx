import React, { useState } from 'react';
import { 
  FileText, 
  Database, 
  Layers, 
  Workflow, 
  Compass, 
  Cpu, 
  Server, 
  CheckCircle2, 
  HardDrive,
  Code2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function SystemDocumentation() {
  const [openSection, setOpenSection] = useState(0);

  const docSections = [
    {
      title: "📖 Sensor Guide — What Each Reading Means",
      icon: FileText,
      content: (
        <div className="space-y-5 text-xs font-sans">

          {/* Sensor cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="font-bold text-orange-600 mb-1 text-sm">🌡️ Air Temperature (K)</div>
              <p className="text-gray-600 leading-relaxed mb-2">The temperature of the air surrounding the machine.</p>
              <div className="text-[11px] space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">Normal range:</span><span className="font-semibold text-gray-700">298 – 302 K (25–29°C)</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Warning:</span><span className="font-semibold text-orange-700">&gt; 302 K — Machine may overheat</span></div>
              </div>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="font-bold text-red-600 mb-1 text-sm">🔥 Process Temperature (K)</div>
              <p className="text-gray-600 leading-relaxed mb-2">The temperature inside the machine during operation.</p>
              <div className="text-[11px] space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">Normal range:</span><span className="font-semibold text-gray-700">306 – 312 K (33–39°C)</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Warning:</span><span className="font-semibold text-red-600">&gt; 312 K — Too hot, risk of failure</span></div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="font-bold text-blue-600 mb-1 text-sm">⚡ Rotational Speed (rpm)</div>
              <p className="text-gray-600 leading-relaxed mb-2">How fast the machine's spindle is spinning per minute.</p>
              <div className="text-[11px] space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">Normal range:</span><span className="font-semibold text-gray-700">1400 – 1600 rpm</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Warning:</span><span className="font-semibold text-orange-700">&lt; 1300 rpm — Too slow, risk of stalling</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Warning:</span><span className="font-semibold text-orange-700">&gt; 2500 rpm — Too fast, risk of stress</span></div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
              <div className="font-bold text-purple-600 mb-1 text-sm">🔩 Torque (Nm)</div>
              <p className="text-gray-600 leading-relaxed mb-2">The rotational force being applied on the machine. Think of it like how hard the machine is being pushed to work.</p>
              <div className="text-[11px] space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">Normal range:</span><span className="font-semibold text-gray-700">35 – 50 Nm</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Warning:</span><span className="font-semibold text-red-600">&gt; 60 Nm — Too much load, breakdown likely</span></div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="font-bold text-orange-800 mb-1 text-sm">🛠️ Tool Wear (min)</div>
              <p className="text-gray-600 leading-relaxed mb-2">Total time (in minutes) the cutting tool has been in use. Like the mileage on a car — the higher it is, the more worn out the tool is.</p>
              <div className="text-[11px] space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">Low wear:</span><span className="font-semibold text-emerald-600">&lt; 80 min — Good condition</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Moderate:</span><span className="font-semibold text-orange-700">80 – 160 min — Keep watching</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Critical:</span><span className="font-semibold text-red-600">&gt; 160 min — Replace tool soon</span></div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="font-bold text-emerald-700 mb-1 text-sm">🏷️ Product Type (L / M / H)</div>
              <p className="text-gray-600 leading-relaxed mb-2">The grade/quality of the product being manufactured.</p>
              <div className="text-[11px] space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">L (Light):</span><span className="font-semibold text-orange-700">Most common, breaks more often</span></div>
                <div className="flex justify-between"><span className="text-gray-500">M (Medium):</span><span className="font-semibold text-gray-700">Average breakdown risk</span></div>
                <div className="flex justify-between"><span className="text-gray-500">H (Heavy):</span><span className="font-semibold text-emerald-600">Sturdiest, breaks least</span></div>
              </div>
            </div>

          </div>

          {/* Co-dependency section */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="font-bold text-blue-700 mb-3 text-sm">⚠️ Dangerous Combinations — When Machines Break</div>
            <div className="space-y-3 text-[12px] text-gray-600">
              <div className="flex gap-3 items-start p-3 bg-white rounded-lg border border-blue-100">
                <span className="text-red-500 text-base mt-0.5">🔴</span>
                <div><strong className="text-gray-700">High Torque + High Tool Wear</strong><br/>When the machine is under heavy load AND the tool is old — this is the #1 cause of breakdown. Replace the tool immediately.</div>
              </div>
              <div className="flex gap-3 items-start p-3 bg-white rounded-lg border border-blue-100">
                <span className="text-orange-500 text-base mt-0.5">🟠</span>
                <div><strong className="text-gray-700">High Air Temp + High Process Temp</strong><br/>When both temperatures are rising together, the machine is overheating. Slow down or cool the environment.</div>
              </div>
              <div className="flex gap-3 items-start p-3 bg-white rounded-lg border border-blue-100">
                <span className="text-orange-400 text-base mt-0.5">🟡</span>
                <div><strong className="text-gray-700">Low Speed + High Torque</strong><br/>If the machine is spinning slowly but under heavy load — like a car stuck in traffic while flooring the accelerator — this causes strain and failure.</div>
              </div>
              <div className="flex gap-3 items-start p-3 bg-white rounded-lg border border-blue-100">
                <span className="text-orange-700 text-base mt-0.5">⚠️</span>
                <div><strong className="text-gray-700">Product Type L + Any Other Warning Sign</strong><br/>Light-grade (L) products are manufactured with less tolerant materials. Any abnormal reading on an L-type machine needs faster attention.</div>
              </div>
            </div>
          </div>

          {/* Failure prediction output guide */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="font-bold text-gray-700 mb-3 text-sm">🔮 Understanding the Prediction Result</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px]">
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="text-2xl">✅</span>
                <div><strong className="text-emerald-700 block">Machine OK</strong><span className="text-gray-500">Safe to continue. No action needed.</span></div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="text-2xl">⚠️</span>
                <div><strong className="text-orange-800 block">Watch Carefully</strong><span className="text-gray-500">Schedule maintenance soon. Don't ignore.</span></div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <span className="text-2xl">🚨</span>
                <div><strong className="text-red-700 block">Stop Machine</strong><span className="text-gray-500">High failure risk. Inspect immediately.</span></div>
              </div>
            </div>
          </div>

        </div>
      )
    },

    {
      title: "1. System Objective & Architecture Overview",
      icon: Server,
      content: (
        <div className="space-y-2 text-xs text-gray-600 leading-relaxed font-sans">
          <p>
            The <strong>Predictive Maintenance Data Warehouse & Mining System</strong> is an enterprise-grade analytical platform engineered to monitor industrial manufacturing machinery, identify degradation patterns, and anticipate catastrophic mechanical failure prior to operational disruption.
          </p>
          <p>
            Operating on 10,000 continuous sensor cycles from the UCI AI4I 2020 Predictive Maintenance Dataset, the platform bridges historical data warehousing with real-time predictive machine learning. The system is split into two integrated tiers:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-500">
            <li><strong>Relational OLAP Tier:</strong> Star Schema Data Warehouse hosting granular sensor facts and surrounding conformed dimensions for fast multi-dimensional slicing, dicing, and aggregations.</li>
            <li><strong>Data Mining & Inference Tier:</strong> Supervised classification models, unsupervised operational clustering, and frequent association rule mining engines.</li>
          </ul>
        </div>
      )
    },
    {
      title: "2. Star Schema & Dimensional Modeling Specification",
      icon: Layers,
      content: (
        <div className="space-y-3 text-xs text-gray-600 leading-relaxed font-sans">
          <p>
            The warehouse utilizes a de-normalized <strong>Star Schema</strong> design optimized for analytical query performance:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <strong className="text-rose-700 block mb-1">FACT_MACHINE_MAINTENANCE</strong>
              <span className="text-gray-500 block">Grain: One row per discrete sensor scan</span>
              <span className="text-gray-500 block">Foreign Keys: date_key, machine_key, product_key, sensor_key, failure_key</span>
              <span className="text-emerald-700 block mt-1">Measures: air_temp, proc_temp, speed, torque, wear, temp_diff, power, failure</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
              <strong className="text-blue-700 block mb-1">5 Conformed Dimensions</strong>
              <span className="text-gray-500 block">&bull; <strong>DIM_DATE:</strong> Day &rarr; Month &rarr; Quarter &rarr; Year hierarchy</span>
              <span className="text-gray-500 block">&bull; <strong>DIM_PRODUCT:</strong> Quality variants (L: 50%, M: 30%, H: 20%)</span>
              <span className="text-gray-500 block">&bull; <strong>DIM_MACHINE:</strong> Equipment model and installation metadata</span>
              <span className="text-gray-500 block">&bull; <strong>DIM_SENSOR:</strong> Discrete binned telemetry envelopes</span>
              <span className="text-gray-500 block">&bull; <strong>DIM_FAILURE:</strong> Failure status, classifications, and severity</span>
            </div>
          </div>
          <p className="text-gray-500">
            <strong>Surrogate Keys:</strong> Artificial sequential integer keys decouple the analytical warehouse schema from source transactional schema changes.
          </p>
        </div>
      )
    },
    {
      title: "3. ETL Pipeline Specifications & Data Processing",
      icon: Workflow,
      content: (
        <div className="space-y-2 text-xs text-gray-600 leading-relaxed font-sans">
          <p>
            The automated ETL pipeline stages raw manufacturing files into the warehouse:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-500">
            <li><strong>Extract:</strong> Ingests 10,000 raw sensor records from CSV storage, validating data encodings and structure.</li>
            <li><strong>Clean:</strong> Audits null values, removes synthetic identifier duplicates, and verifies sensor boundaries.</li>
            <li><strong>Transform:</strong> Derives physical measures including Temperature Differential (&Delta;T = T_process - T_air) and Mechanical Power (P = [2&pi;N/60] &times; &tau;), maps chronological calendar dates across 2020, and assigns dimension surrogate keys.</li>
            <li><strong>Load:</strong> Executes relational DDL in SQLite (<code className="text-emerald-700">warehouse.db</code>), populates tables in bulk, builds B-tree indexes, and registers execution logs in <code className="text-blue-700">etl_log</code>.</li>
          </ul>
        </div>
      )
    },
    {
      title: "4. OLAP Multi-Dimensional Query Engine",
      icon: Compass,
      content: (
        <div className="space-y-2 text-xs text-gray-600 leading-relaxed font-sans">
          <p>
            The system executes 5 native OLAP operations directly against the relational database:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-gray-500">
            <li><strong>Roll-Up:</strong> Summarizes measures by climbing up a dimension hierarchy (Day &rarr; Month &rarr; Quarter &rarr; Year).</li>
            <li><strong>Drill-Down:</strong> De-aggregates summary data to higher granularity (Quarter &rarr; Monthly breakdowns).</li>
            <li><strong>Slice:</strong> Filters on 1 dimension to isolate a 2D sub-cube plane (e.g. <code className="text-orange-700">product_type = 'M'</code>).</li>
            <li><strong>Dice:</strong> Forms a sub-cube by applying simultaneous multi-dimensional filters (e.g. <code className="text-orange-700">product = 'M' AND torque &gt; 50 AND tool_wear &gt; 100</code>).</li>
            <li><strong>Pivot:</strong> Re-orientates data axes to provide a cross-tabulation matrix (Rows = Product Grade, Columns = Failure Status).</li>
          </ul>
        </div>
      )
    },
    {
      title: "5. Data Mining & Target Leakage Prevention",
      icon: Cpu,
      content: (
        <div className="space-y-2 text-xs text-gray-600 leading-relaxed font-sans">
          <p>
            The data mining module deploys supervised and unsupervised models trained on warehouse records:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-gray-500">
            <li><strong>Supervised Classification:</strong> Decision Tree, Random Forest, and Logistic Regression models predict binary failure status. Accuracy, Precision, Recall, F1-Score, and Confusion Matrices are evaluated on a 20% holdout test set.</li>
            <li><strong>Target Leakage Mitigation:</strong> Failure mode flags (<code className="text-rose-700">TWF, HDF, PWF, OSF, RNF</code>) and machine identifiers (<code className="text-rose-700">UDI, Product ID</code>) are strictly excluded from predictive features. Only operational sensor telemetry available prior to failure is used.</li>
            <li><strong>Unsupervised K-Means:</strong> Partitions machine operating cycles into $k$ clusters with 2D PCA projection to visualize operating regimes.</li>
            <li><strong>Association Rules:</strong> Computes frequent co-occurrence patterns using Support, Confidence, and Lift metrics.</li>
          </ul>
        </div>
      )
    },
    {
      title: "6. Software Stack & Local Infrastructure",
      icon: Code2,
      content: (
        <div className="space-y-2 text-xs text-gray-600 leading-relaxed font-sans">
          <p>
            The platform is built entirely using open-source technologies:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px] mt-2">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <strong className="text-blue-700 block mb-1">Backend</strong>
              <span className="text-gray-500 block">&bull; Python 3.12</span>
              <span className="text-gray-500 block">&bull; FastAPI</span>
              <span className="text-gray-500 block">&bull; Uvicorn ASGI</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <strong className="text-emerald-700 block mb-1">Data & Analytics</strong>
              <span className="text-gray-500 block">&bull; SQLite (Star Schema)</span>
              <span className="text-gray-500 block">&bull; Pandas & NumPy</span>
              <span className="text-gray-500 block">&bull; Scikit-learn</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <strong className="text-purple-700 block mb-1">Frontend</strong>
              <span className="text-gray-500 block">&bull; React 19</span>
              <span className="text-gray-500 block">&bull; Vite & Tailwind CSS</span>
              <span className="text-gray-500 block">&bull; Recharts & Lucide</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">System Architecture & Technical Documentation</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Detailed technical specifications, schema design rationale, and pipeline operational documentation
        </p>
      </div>

      {/* System Overview Card */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl border border-gray-200 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-600/15 text-blue-700 border border-blue-500/30">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Industrial Predictive Maintenance Platform
            </h3>
            <p className="text-xs text-gray-500">
              Architecture Reference &bull; Data Warehouse & Data Mining Systems
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          This system models an industrial predictive maintenance infrastructure using the <strong>AI4I 2020 Predictive Maintenance Dataset</strong>. It integrates high-throughput dimensional warehousing with advanced analytical processing, providing manufacturing plant managers with real-time operational insights, multi-dimensional cube analysis, and machine breakdown risk forecasting.
        </p>

        {/* Feature Badges Grid */}
        <div className="pt-2 flex flex-wrap gap-2 text-xs">
          {[
            "Star Schema Architecture", "1 Fact Table", "5 Conformed Dimensions", 
            "Automated ETL Pipeline", "Roll-Up & Drill-Down", "Slice & Dice Sub-cubes", 
            "Cross-Tabulation Pivot", "Random Forest Ensemble", "Decision Tree Classifier", 
            "Target Leakage Exclusion", "K-Means Clustering", "2D PCA Projection", 
            "Association Rule Mining", "SQLite Storage Engine", "FastAPI Asynchronous Backend"
          ].map((tag) => (
            <span key={tag} className="px-2.5 py-1 rounded bg-gray-50 border border-gray-200 text-gray-600 font-mono text-[11px]">
              &bull; {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Technical Documentation Accordion */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl border border-gray-200 p-6 shadow-xl">
        <h3 className="text-sm font-bold text-gray-900 mb-2">
          System Technical Specifications
        </h3>
        <p className="text-xs text-gray-500 mb-6">
          Review the core architecture components, data flow models, and computational engines below.
        </p>

        <div className="space-y-3">
          {docSections.map((sec, idx) => {
            const Icon = sec.icon;
            const isOpen = openSection === idx;
            return (
              <div 
                key={idx} 
                className="border border-gray-200 rounded-xl overflow-hidden bg-white/60 transition"
              >
                <button
                  onClick={() => setOpenSection(isOpen ? null : idx)}
                  className="w-full p-4 flex items-center justify-between text-left text-xs font-semibold text-gray-700 hover:text-gray-900 transition"
                >
                  <span className="flex items-center gap-2.5 font-sans text-gray-700">
                    <Icon className="w-4 h-4 text-blue-700" />
                    <span>{sec.title}</span>
                  </span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-900 bg-gray-50">
                    {sec.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


