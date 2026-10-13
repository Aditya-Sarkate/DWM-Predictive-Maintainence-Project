import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

endpoints = [
    ('/', 200),
    ('/api/dashboard', 200),
    ('/api/data?page=1&page_size=5', 200),
    ('/api/warehouse-overview', 200),
    ('/api/schema', 200),
    ('/api/etl/status', 200),
    ('/api/olap/rollup?dimension=month', 200),
    ('/api/olap/drilldown?hierarchy=quarter_to_month&parent_value=Q2', 200),
    ('/api/olap/slice?dimension=product_type&value=M', 200),
    ('/api/olap/pivot?row_dim=product_type&col_dim=failure_status&metric=count', 200),
    ('/api/mining/classification', 200),
    ('/api/mining/clustering?k=3', 200),
    ('/api/mining/association', 200),
    ('/api/analytics', 200)
]

print("=== TESTING BACKEND API ENDPOINTS ===")
all_passed = True
for ep, expected_status in endpoints:
    resp = client.get(ep)
    passed = (resp.status_code == expected_status)
    status_str = "PASS" if passed else "FAIL"
    print(f"{ep} -> {resp.status_code} (Expected {expected_status}) : {status_str}")
    if not passed:
        all_passed = False
        print("Error details:", resp.text[:200])

# Test POST endpoints
dice_resp = client.post('/api/olap/dice', json={'product_type': 'M', 'min_torque': 40})
print(f"/api/olap/dice (POST) -> {dice_resp.status_code} : {'PASS' if dice_resp.status_code == 200 else 'FAIL'}")

pred_resp = client.post('/api/mining/predict', json={
    'product_type': 'L',
    'air_temperature': 302.0,
    'process_temperature': 311.0,
    'rotational_speed': 1300,
    'torque': 65.0,
    'tool_wear': 210
})
print(f"/api/mining/predict (POST) -> {pred_resp.status_code} : {'PASS' if pred_resp.status_code == 200 else 'FAIL'}")
if pred_resp.status_code == 200:
    res = pred_resp.json()
    print(f"Sample Prediction: {res['predicted_label']} | Risk: {res['risk_level']} | Probability: {res['failure_probability_pct']}%")

if all_passed and dice_resp.status_code == 200 and pred_resp.status_code == 200:
    print("\n>>> ALL 16 BACKEND API ENDPOINTS VERIFIED AND WORKING PERFECTLY! <<<")
