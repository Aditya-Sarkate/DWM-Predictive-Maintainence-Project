const API_BASE = '/api';

export async function fetchDashboardSummary() {
  const res = await fetch(`${API_BASE}/dashboard`);
  if (!res.ok) throw new Error('Failed to load dashboard metrics');
  return res.json();
}

export async function fetchDataExplorer(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.page_size) query.append('page_size', params.page_size);
  if (params.product_type) query.append('product_type', params.product_type);
  if (params.failure_status) query.append('failure_status', params.failure_status);
  if (params.search) query.append('search', params.search);

  const res = await fetch(`${API_BASE}/data?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch data explorer records');
  return res.json();
}

export async function fetchWarehouseOverview() {
  const res = await fetch(`${API_BASE}/warehouse-overview`);
  if (!res.ok) throw new Error('Failed to fetch warehouse overview');
  return res.json();
}

export async function fetchStarSchema() {
  const res = await fetch(`${API_BASE}/schema`);
  if (!res.ok) throw new Error('Failed to fetch schema metadata');
  return res.json();
}

export async function fetchEtlStatus() {
  const res = await fetch(`${API_BASE}/etl/status`);
  if (!res.ok) throw new Error('Failed to fetch ETL status');
  return res.json();
}

export async function triggerEtlRun() {
  const res = await fetch(`${API_BASE}/etl/run`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to trigger ETL run');
  return res.json();
}

export async function fetchOlapRollup(dimension = 'month', measure = 'failure_count') {
  const res = await fetch(`${API_BASE}/olap/rollup?dimension=${encodeURIComponent(dimension)}&measure=${encodeURIComponent(measure)}`);
  if (!res.ok) throw new Error('Failed to execute Roll-Up operation');
  return res.json();
}

export async function fetchOlapDrilldown(hierarchy = 'quarter_to_month', parentValue = 'Q2') {
  const res = await fetch(`${API_BASE}/olap/drilldown?hierarchy=${encodeURIComponent(hierarchy)}&parent_value=${encodeURIComponent(parentValue)}`);
  if (!res.ok) throw new Error('Failed to execute Drill-Down operation');
  return res.json();
}

export async function fetchOlapSlice(dimension = 'product_type', value = 'M') {
  const res = await fetch(`${API_BASE}/olap/slice?dimension=${encodeURIComponent(dimension)}&value=${encodeURIComponent(value)}`);
  if (!res.ok) throw new Error('Failed to execute Slice operation');
  return res.json();
}

export async function postOlapDice(filters) {
  const res = await fetch(`${API_BASE}/olap/dice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters)
  });
  if (!res.ok) throw new Error('Failed to execute Dice operation');
  return res.json();
}

export async function fetchOlapPivot(rowDim = 'product_type', colDim = 'failure_status', metric = 'count') {
  const res = await fetch(`${API_BASE}/olap/pivot?row_dim=${encodeURIComponent(rowDim)}&col_dim=${encodeURIComponent(colDim)}&metric=${encodeURIComponent(metric)}`);
  if (!res.ok) throw new Error('Failed to execute Pivot operation');
  return res.json();
}

export async function fetchClassification() {
  const res = await fetch(`${API_BASE}/mining/classification`);
  if (!res.ok) throw new Error('Failed to fetch classification models');
  return res.json();
}

export async function predictMachineFailure(payload) {
  const res = await fetch(`${API_BASE}/mining/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to execute real-time prediction');
  return res.json();
}

export async function fetchClustering(k = 3) {
  const res = await fetch(`${API_BASE}/mining/clustering?k=${encodeURIComponent(k)}`);
  if (!res.ok) throw new Error('Failed to fetch clustering results');
  return res.json();
}

export async function fetchAssociationRules() {
  const res = await fetch(`${API_BASE}/mining/association`);
  if (!res.ok) throw new Error('Failed to fetch association rules');
  return res.json();
}

export async function fetchAnalytics() {
  const res = await fetch(`${API_BASE}/analytics`);
  if (!res.ok) throw new Error('Failed to fetch analytics data');
  return res.json();
}
