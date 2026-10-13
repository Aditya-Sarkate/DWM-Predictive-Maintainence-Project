import React, { useState, useEffect } from 'react';
import { 
  fetchClassification, 
  fetchClustering, 
  fetchAssociationRules 
} from '../services/api';
import { 
  Cpu, 
  Share2, 
  Sliders, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

export default function DataMiningView() {
  const [activeTab, setActiveTab] = useState('classification'); // 'classification', 'clustering', 'association'

  // Classification State
  const [clfData, setClfData] = useState(null);
  const [selectedModel, setSelectedModel] = useState('Random Forest');
  const [loadingClf, setLoadingClf] = useState(false);

  // Clustering State
  const [kClusters, setKClusters] = useState(3);
  const [clusterData, setClusterData] = useState(null);
  const [loadingCluster, setLoadingCluster] = useState(false);

  // Association Rules State
  const [associationData, setAssociationData] = useState(null);
  const [loadingAssoc, setLoadingAssoc] = useState(false);

  // Load classification on initial mount
  useEffect(() => {
    loadClassification();
  }, []);

  const loadClassification = async () => {
    try {
      setLoadingClf(true);
      const res = await fetchClassification();
      setClfData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingClf(false);
    }
  };

  const loadClustering = async (kVal) => {
    try {
      setLoadingCluster(true);
      const res = await fetchClustering(kVal || kClusters);
      setClusterData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCluster(false);
    }
  };

  const loadAssociation = async () => {
    try {
      setLoadingAssoc(true);
      const res = await fetchAssociationRules();
      setAssociationData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAssoc(false);
    }
  };

  const CLUSTER_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Data Mining Engine</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Supervised machine breakdown classification, unsupervised K-Means clustering, and frequent association rule mining
          </p>
        </div>
      </div>

      {/* Mining Module Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('classification')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'classification'
              ? 'bg-blue-600 text-gray-900 shadow-md shadow-blue-500/20'
              : 'bg-gray-50 text-gray-500 hover:text-gray-900 border border-gray-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>1. Classification Models</span>
        </button>

        <button
          onClick={() => { setActiveTab('clustering'); if (!clusterData) loadClustering(kClusters); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'clustering'
              ? 'bg-blue-600 text-gray-900 shadow-md shadow-blue-500/20'
              : 'bg-gray-50 text-gray-500 hover:text-gray-900 border border-gray-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>2. K-Means Clustering (PCA 2D)</span>
        </button>

        <button
          onClick={() => { setActiveTab('association'); if (!associationData) loadAssociation(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'association'
              ? 'bg-blue-600 text-gray-900 shadow-md shadow-blue-500/20'
              : 'bg-gray-50 text-gray-500 hover:text-gray-900 border border-gray-200'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>3. Association / Pattern Rules</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* 1. CLASSIFICATION TAB */}
      {/* =================================================================== */}
      {activeTab === 'classification' && (
        <div className="space-y-6">
          {loadingClf || !clfData ? (
            <div className="p-12 text-center text-gray-500 bg-white border border-gray-200 shadow-sm rounded-xl">
              <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
              Training Decision Tree, Random Forest, and Logistic Regression models...
            </div>
          ) : (
            <>
              {/* Models Comparison Table */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-xl border border-gray-200 p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Supervised Model Benchmark Comparison</h3>
                    <p className="text-xs text-gray-500">Target: Machine failure (0 = No, 1 = Yes) | 80/20 Train/Test Stratified Split</p>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded bg-gray-100 text-gray-600 font-mono">
                    Test Set: {clfData.dataset_info.testing_samples.toLocaleString()} samples
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white text-gray-500 uppercase font-semibold border-b border-gray-200">
                      <tr>
                        <th className="py-2.5 px-4">Classifier Model</th>
                        <th className="py-2.5 px-4">Accuracy</th>
                        <th className="py-2.5 px-4">Precision</th>
                        <th className="py-2.5 px-4">Recall</th>
                        <th className="py-2.5 px-4">F1-Score</th>
                        <th className="py-2.5 px-4">True Positives</th>
                        <th className="py-2.5 px-4">False Positives</th>
                        <th className="py-2.5 px-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 font-mono">
                      {clfData.comparison.map((m) => {
                        const isSelected = selectedModel === m.Model;
                        return (
                          <tr key={m.Model} className={`hover:bg-gray-100/40 ${isSelected ? 'bg-blue-950/20' : ''}`}>
                            <td className="py-3 px-4 font-bold text-gray-900 flex items-center gap-2 font-sans">
                              {isSelected && <span className="w-2 h-2 rounded-full bg-blue-400"></span>}
                              {m.Model}
                            </td>
                            <td className="py-3 px-4 text-emerald-700 font-semibold">{m['Accuracy (%)']}%</td>
                            <td className="py-3 px-4 text-blue-700">{m['Precision (%)']}%</td>
                            <td className="py-3 px-4 text-purple-700">{m['Recall (%)']}%</td>
                            <td className="py-3 px-4 text-orange-700 font-semibold">{m['F1 Score (%)']}%</td>
                            <td className="py-3 px-4 text-emerald-700">{m['True Positives']}</td>
                            <td className="py-3 px-4 text-rose-700">{m['False Positives']}</td>
                            <td className="py-3 px-4 font-sans">
                              <button
                                onClick={() => setSelectedModel(m.Model)}
                                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                                  isSelected 
                                    ? 'bg-blue-600 text-gray-900' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {isSelected ? 'Inspecting' : 'Inspect'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Model Inspector: Confusion Matrix + Feature Importances */}
              {selectedModel && clfData.models[selectedModel] && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Confusion Matrix Card */}
                  <div className="bg-white border border-gray-200 shadow-sm rounded-xl border border-gray-200 p-5 shadow-xl">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      Confusion Matrix: {selectedModel}
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">
                      Evaluated on 2,000 unseen test instances
                    </p>

                    {(() => {
                      const cm = clfData.models[selectedModel].confusion_matrix;
                      return (
                        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-center font-mono my-3">
                          <div className="bg-gray-50 border border-emerald-500/30 p-3 rounded-lg">
                            <span className="text-[10px] text-gray-500 block font-sans">True Negative (TN)</span>
                            <span className="text-xl font-bold text-emerald-700">{cm.true_negative}</span>
                            <span className="text-[10px] text-gray-400 block">Correct Normal</span>
                          </div>

                          <div className="bg-gray-50 border border-rose-500/30 p-3 rounded-lg">
                            <span className="text-[10px] text-gray-500 block font-sans">False Positive (FP)</span>
                            <span className="text-xl font-bold text-rose-700">{cm.false_positive}</span>
                            <span className="text-[10px] text-gray-400 block">False Alarm</span>
                          </div>

                          <div className="bg-gray-50 border border-amber-500/30 p-3 rounded-lg">
                            <span className="text-[10px] text-gray-500 block font-sans">False Negative (FN)</span>
                            <span className="text-xl font-bold text-orange-700">{cm.false_negative}</span>
                            <span className="text-[10px] text-gray-400 block">Missed Failure</span>
                          </div>

                          <div className="bg-gray-50 border border-blue-500/30 p-3 rounded-lg">
                            <span className="text-[10px] text-gray-500 block font-sans">True Positive (TP)</span>
                            <span className="text-xl font-bold text-blue-700">{cm.true_positive}</span>
                            <span className="text-[10px] text-gray-400 block">Detected Failure</span>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="text-[11px] text-gray-500 bg-white p-2.5 rounded-lg border border-gray-200 mt-4 leading-relaxed font-sans">
                      Recall measure is crucial in industrial maintenance: minimizing False Negatives (FN) ensures machinery is serviced before catastrophic mechanical seizure.
                    </div>
                  </div>

                  {/* Feature Importance Chart */}
                  <div className="bg-white border border-gray-200 shadow-sm rounded-xl border border-gray-200 p-5 shadow-xl">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      Feature Importances: {selectedModel}
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">
                      Relative contribution of each physical feature to failure classification
                    </p>

                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={clfData.models[selectedModel].feature_importance}
                          layout="vertical"
                          margin={{ top: 5, right: 20, left: 35, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis type="number" stroke="#64748b" tick={{ fill: '#6b7280', fontSize: 10 }} />
                          <YAxis 
                            dataKey="feature" 
                            type="category" 
                            stroke="#64748b" 
                            tick={{ fill: '#6b7280', fontSize: 9 }}
                            width={110}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                            formatter={(value) => [`${value}%`, 'Relative Weight']}
                          />
                          <Bar dataKey="importance" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                            {clfData.models[selectedModel].feature_importance.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#38bdf8' : index === 1 ? '#60a5fa' : '#818cf8'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <p className="text-[11px] text-gray-500 mt-2">
                      Torque [Nm] and Rotational Speed [rpm] drive over 60% of splits, matching mechanical power dissipation laws.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. K-MEANS CLUSTERING TAB */}
      {/* =================================================================== */}
      {activeTab === 'clustering' && (
        <div className="space-y-6">
          {/* Controls: Slider for k */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-gray-600">
                Number of Clusters (k): <strong className="text-blue-700 text-sm font-mono">{kClusters}</strong>
              </span>
              <input
                type="range"
                min="2"
                max="5"
                value={kClusters}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setKClusters(val);
                  loadClustering(val);
                }}
                className="w-36 accent-blue-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-gray-500">
                Silhouette Score: <strong className="text-emerald-700 font-mono">{clusterData?.silhouette_score ?? '—'}</strong>
              </span>
              <button
                onClick={() => loadClustering(kClusters)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingCluster ? 'animate-spin' : ''}`} />
                <span>Re-cluster</span>
              </button>
            </div>
          </div>

          {loadingCluster || !clusterData ? (
            <div className="p-12 text-center text-gray-500 bg-white border border-gray-200 shadow-sm rounded-xl">
              <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
              Running K-Means algorithm and computing 2D PCA coordinate projection...
            </div>
          ) : (
            <>
              {/* Cluster Profiles Table */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-xl border border-gray-200 p-5 shadow-xl">
                <h3 className="text-sm font-bold text-gray-900 mb-1">
                  Discovered Cluster Operational Profiles (Centroids)
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Unsupervised operational regimes partitioned by K-Means without using failure labels
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white text-gray-500 uppercase font-semibold border-b border-gray-200">
                      <tr>
                        <th className="py-2.5 px-4">Cluster ID</th>
                        <th className="py-2.5 px-4">Size (Machines)</th>
                        <th className="py-2.5 px-4">Failures</th>
                        <th className="py-2.5 px-4">Failure Rate</th>
                        <th className="py-2.5 px-4">Avg Speed [rpm]</th>
                        <th className="py-2.5 px-4">Avg Torque [Nm]</th>
                        <th className="py-2.5 px-4">Avg Tool Wear</th>
                        <th className="py-2.5 px-4">Operational Regime</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 font-mono">
                      {clusterData.cluster_profiles.map((cp) => (
                        <tr key={cp.cluster_id} className="hover:bg-gray-100/40">
                          <td className="py-3 px-4 font-bold flex items-center gap-2">
                            <span 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: CLUSTER_COLORS[cp.cluster_id % CLUSTER_COLORS.length] }}
                            ></span>
                            <span className="text-gray-900 font-sans">{cp.cluster_name}</span>
                          </td>
                          <td className="py-3 px-4 text-gray-700">{cp.size.toLocaleString()} ({cp.percentage}%)</td>
                          <td className="py-3 px-4 text-rose-700 font-semibold">{cp.total_failures}</td>
                          <td className="py-3 px-4 font-semibold" style={{ color: cp.failure_rate_pct > 10 ? '#ef4444' : '#10b981' }}>
                            {cp.failure_rate_pct}%
                          </td>
                          <td className="py-3 px-4 text-gray-600">{cp.avg_speed}</td>
                          <td className="py-3 px-4 text-gray-600">{cp.avg_torque}</td>
                          <td className="py-3 px-4 text-gray-600">{cp.avg_tool_wear}m</td>
                          <td className="py-3 px-4 text-gray-500 font-sans text-[11px]">{cp.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2D PCA Scatter Visualization */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-xl border border-gray-200 p-5 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">2D PCA Cluster Projection Plane</h3>
                    <p className="text-xs text-gray-500">
                      Principal Component Analysis (PCA) maps 5D sensor feature space to 2 principal dimensions
                    </p>
                  </div>
                  <div className="text-[11px] text-gray-500 font-mono">
                    Variance Explained: PC1={clusterData.pca_explained_variance_ratio[0]}%, PC2={clusterData.pca_explained_variance_ratio[1]}%
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 10, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis type="number" dataKey="pca_x" name="Principal Component 1" stroke="#64748b" tick={{ fill: '#6b7280', fontSize: 10 }} />
                      <YAxis type="number" dataKey="pca_y" name="Principal Component 2" stroke="#64748b" tick={{ fill: '#6b7280', fontSize: 10 }} />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px' }}
                      />
                      <Scatter data={clusterData.scatter_points}>
                        {clusterData.scatter_points.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={CLUSTER_COLORS[entry.cluster % CLUSTER_COLORS.length]} 
                            opacity={entry.machine_failure === 1 ? 1 : 0.6}
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-6 mt-3 text-xs">
                  {clusterData.cluster_profiles.map((cp) => (
                    <div key={cp.cluster_id} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CLUSTER_COLORS[cp.cluster_id % CLUSTER_COLORS.length] }}></span>
                      <span className="text-gray-600">{cp.cluster_name} ({cp.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* 3. ASSOCIATION RULES TAB */}
      {/* =================================================================== */}
      {activeTab === 'association' && (
        <div className="space-y-6">
          {loadingAssoc || !associationData ? (
            <div className="p-12 text-center text-gray-500 bg-white border border-gray-200 shadow-sm rounded-xl">
              <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
              Mining frequent co-occurrence patterns from binned sensor categories...
            </div>
          ) : (
            <>
              {/* Rules Table */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-xl border border-gray-200 p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Discovered Failure Association Patterns</h3>
                    <p className="text-xs text-gray-500">Rules discovered between binned telemetry conditions and machine state</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white text-gray-500 uppercase font-semibold border-b border-gray-200">
                      <tr>
                        <th className="py-2.5 px-4">#</th>
                        <th className="py-2.5 px-4">Antecedent Condition (IF)</th>
                        <th className="py-2.5 px-4">Consequent (THEN)</th>
                        <th className="py-2.5 px-4">Support</th>
                        <th className="py-2.5 px-4">Confidence</th>
                        <th className="py-2.5 px-4">Lift</th>
                        <th className="py-2.5 px-4">Industrial Interpretation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {associationData.rules.map((r) => (
                        <tr key={r.rule_id} className="hover:bg-gray-100/40">
                          <td className="py-3 px-4 font-mono text-gray-400">{r.rule_id}</td>
                          <td className="py-3 px-4 font-semibold text-orange-700 font-mono">{r.antecedent}</td>
                          <td className="py-3 px-4 font-semibold font-mono">
                            <span className={r.consequent.includes('Failure') ? 'text-rose-700' : 'text-emerald-700'}>
                              {r.consequent}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-blue-700">{r.support_pct}%</td>
                          <td className="py-3 px-4 font-mono text-emerald-700 font-bold">{r.confidence_pct}%</td>
                          <td className="py-3 px-4 font-mono font-bold text-purple-700">{r.lift}x</td>
                          <td className="py-3 px-4 text-gray-600 text-[11px] leading-relaxed">{r.interpretation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Engineering Analytics Note */}
                <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200 text-xs text-orange-700/80">
                  <strong>Engineering Analytics Note:</strong> {associationData.disclaimer}
                </div>
              </div>

              {/* Metrics Explanation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                  <h4 className="text-xs font-bold text-blue-700 mb-1">Support: P(A &cap; B)</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    The frequency of the combined rule across all 10,000 warehouse records. High support indicates widespread occurrences.
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                  <h4 className="text-xs font-bold text-emerald-700 mb-1">Confidence: P(B | A)</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Reliability of the inference. E.g. A 85% confidence means 85 out of 100 times when antecedent A occurs, breakdown B follows.
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                  <h4 className="text-xs font-bold text-purple-700 mb-1">Lift: P(B | A) / P(B)</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Measures strength over independence. Lift &gt; 1 proves a strong positive correlation rather than accidental co-occurrence.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

