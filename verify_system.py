import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print('--- CHECKING SPA INDEX ---')
r = client.get('/')
assert r.status_code == 200, f'Status {r.status_code}'
assert '<!doctype html>' in r.text, 'HTML not found'
print('SPA Index check passed!')

print('--- CHECKING ALL 9 PAGES DATA ENDPOINTS ---')
test_cases = [
    ('/api/dashboard', 'kpis'),
    ('/api/data?page=1&page_size=10', 'records'),
    ('/api/warehouse-overview', 'warehouse_tables'),
    ('/api/schema', 'fact_table'),
    ('/api/etl/status', 'warehouse_status'),
    ('/api/olap/rollup?dimension=month', 'data'),
    ('/api/olap/drilldown?hierarchy=quarter_to_month&parent_value=Q2', 'data'),
    ('/api/olap/slice?dimension=product_type&value=M', 'data'),
    ('/api/olap/pivot?row_dim=product_type&col_dim=failure_status&metric=count', 'data'),
    ('/api/mining/classification', 'models'),
    ('/api/mining/clustering?k=3', 'cluster_profiles'),
    ('/api/mining/association', 'rules'),
    ('/api/analytics', 'correlation_matrix'),
]

for url, key in test_cases:
    res = client.get(url)
    assert res.status_code == 200, f'Failed {url} with {res.status_code}'
    json_data = res.json()
    assert key in json_data, f'Missing {key} in {url}'
    print(f'Verified: {url} -> contains key "{key}"')

# Verify POST operations
dice_res = client.post('/api/olap/dice', json={'product_type': 'M', 'min_torque': 50, 'min_tool_wear': 100})
assert dice_res.status_code == 200
assert 'data' in dice_res.json()
print('Verified: POST /api/olap/dice')

pred_res = client.post('/api/mining/predict', json={
    'product_type': 'L',
    'air_temperature': 302.0,
    'process_temperature': 311.0,
    'rotational_speed': 1300,
    'torque': 65.0,
    'tool_wear': 210
})
assert pred_res.status_code == 200
pred_json = pred_res.json()
assert 'predicted_label' in pred_json
print(f'Verified: POST /api/mining/predict -> Result: {pred_json["predicted_label"]}, Probability: {pred_json["failure_probability_pct"]}%, Risk: {pred_json["risk_level"]}')

print('\n======================================================')
print('  ALL VERIFICATIONS PASSED WITH 100% SUCCESS!')
print('======================================================')
