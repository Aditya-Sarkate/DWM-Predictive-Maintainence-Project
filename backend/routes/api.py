from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import sqlite3
import pandas as pd
from database import get_db_connection
from etl.etl_pipeline import ETLPipeline
from olap.olap_engine import OLAPEngine
from mining.mining_engine import DataMiningEngine

router = APIRouter()
etl_service = ETLPipeline()
olap_service = OLAPEngine()
mining_service = DataMiningEngine()

# Pydantic schemas for request validation
class DiceFilterRequest(BaseModel):
    product_type: Optional[str] = "All"
    min_torque: Optional[float] = None
    max_torque: Optional[float] = None
    min_tool_wear: Optional[int] = None
    min_speed: Optional[int] = None
    failure_status: Optional[str] = "All"
    quarter: Optional[str] = "All"

class PredictionRequest(BaseModel):
    product_type: str = "L"
    air_temperature: float = 298.5
    process_temperature: float = 308.6
    rotational_speed: int = 1500
    torque: float = 42.5
    tool_wear: int = 120

# ====================================================================
# 1. DASHBOARD OVERVIEW API
# ====================================================================
@router.get("/dashboard")
def get_dashboard_summary():
    """Returns top KPI metrics and aggregation charts for the industrial dashboard."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Overall KPIs
    kpi_query = """
    SELECT 
        COUNT(maintenance_id) AS total_records,
        SUM(machine_failure) AS total_failures,
        ROUND(AVG(machine_failure) * 100.0, 2) AS failure_rate_pct,
        ROUND(AVG(torque), 2) AS avg_torque,
        ROUND(AVG(tool_wear), 1) AS avg_tool_wear,
        ROUND(AVG(rotational_speed), 0) AS avg_rotational_speed,
        ROUND(AVG(air_temperature), 1) AS avg_air_temp,
        ROUND(AVG(process_temperature), 1) AS avg_process_temp,
        ROUND(AVG(temp_difference), 2) AS avg_temp_difference
    FROM fact_machine_maintenance;
    """
    cursor.execute(kpi_query)
    kpis = dict(cursor.fetchone() or {})

    # Chart 1: Failure by Product Type
    product_chart_query = """
    SELECT 
        p.product_type AS name,
        p.product_name AS fullName,
        COUNT(f.maintenance_id) AS total_machines,
        SUM(f.machine_failure) AS failures,
        ROUND(AVG(f.machine_failure) * 100.0, 2) AS failure_rate
    FROM fact_machine_maintenance f
    JOIN dim_product p ON f.product_key = p.product_key
    GROUP BY p.product_type, p.product_name
    ORDER BY p.product_key ASC;
    """
    cursor.execute(product_chart_query)
    by_product = [dict(r) for r in cursor.fetchall()]

    # Chart 2: Failure by Tool Wear Category
    wear_chart_query = """
    SELECT 
        s.tool_wear_category AS category,
        COUNT(f.maintenance_id) AS total_count,
        SUM(f.machine_failure) AS failure_count,
        ROUND(AVG(f.machine_failure) * 100.0, 2) AS failure_rate
    FROM fact_machine_maintenance f
    JOIN dim_sensor s ON f.sensor_key = s.sensor_key
    GROUP BY s.tool_wear_category
    ORDER BY 
        CASE s.tool_wear_category
            WHEN 'Low (< 80 min)' THEN 1
            WHEN 'Moderate (80-160 min)' THEN 2
            ELSE 3
        END;
    """
    cursor.execute(wear_chart_query)
    by_tool_wear = [dict(r) for r in cursor.fetchall()]

    # Chart 3: Failure by Torque Category
    torque_chart_query = """
    SELECT 
        s.torque_category AS category,
        COUNT(f.maintenance_id) AS total_count,
        SUM(f.machine_failure) AS failure_count,
        ROUND(AVG(f.machine_failure) * 100.0, 2) AS failure_rate
    FROM fact_machine_maintenance f
    JOIN dim_sensor s ON f.sensor_key = s.sensor_key
    GROUP BY s.torque_category
    ORDER BY 
        CASE s.torque_category
            WHEN 'Low (< 35 Nm)' THEN 1
            WHEN 'Normal (35-50 Nm)' THEN 2
            ELSE 3
        END;
    """
    cursor.execute(torque_chart_query)
    by_torque = [dict(r) for r in cursor.fetchall()]

    # Chart 4: Monthly Operational Trend (2020)
    monthly_trend_query = """
    SELECT 
        d.month_name AS month,
        d.month AS month_num,
        COUNT(f.maintenance_id) AS monitored,
        SUM(f.machine_failure) AS failures,
        ROUND(AVG(f.torque), 1) AS avg_torque,
        ROUND(AVG(f.tool_wear), 1) AS avg_wear
    FROM fact_machine_maintenance f
    JOIN dim_date d ON f.date_key = d.date_key
    GROUP BY d.month, d.month_name
    ORDER BY d.month ASC;
    """
    cursor.execute(monthly_trend_query)
    monthly_trend = [dict(r) for r in cursor.fetchall()]

    # Chart 5: Failure Mode Distribution
    failure_mode_query = """
    SELECT 
        fl.failure_type AS name,
        fl.failure_code AS code,
        COUNT(f.maintenance_id) AS value
    FROM fact_machine_maintenance f
    JOIN dim_failure fl ON f.failure_key = fl.failure_key
    WHERE f.machine_failure = 1
    GROUP BY fl.failure_type, fl.failure_code
    ORDER BY value DESC;
    """
    cursor.execute(failure_mode_query)
    failure_modes = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return {
        "kpis": kpis,
        "charts": {
            "by_product": by_product,
            "by_tool_wear": by_tool_wear,
            "by_torque": by_torque,
            "monthly_trend": monthly_trend,
            "failure_modes": failure_modes
        }
    }

# ====================================================================
# 2. DATA EXPLORER API
# ====================================================================
@router.get("/data")
def get_data_explorer(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=5, le=200),
    product_type: Optional[str] = None,
    failure_status: Optional[str] = None,
    search: Optional[str] = None
):
    """Returns paginated, searchable, filterable warehouse records for the explorer table."""
    conn = get_db_connection()
    cursor = conn.cursor()

    where_clauses = ["1=1"]
    params = []

    if product_type and product_type != "All":
        where_clauses.append("p.product_type = ?")
        params.append(product_type)

    if failure_status and failure_status != "All":
        if failure_status == "Failed":
            where_clauses.append("f.machine_failure = 1")
        elif failure_status == "Normal":
            where_clauses.append("f.machine_failure = 0")

    if search:
        search_term = f"%{search}%"
        where_clauses.append("(m.machine_id LIKE ? OR d.full_date LIKE ? OR fl.failure_type LIKE ?)")
        params.extend([search_term, search_term, search_term])

    where_str = " AND ".join(where_clauses)
    offset = (page - 1) * page_size

    count_query = f"""
    SELECT COUNT(f.maintenance_id) AS total
    FROM fact_machine_maintenance f
    JOIN dim_date d ON f.date_key = d.date_key
    JOIN dim_machine m ON f.machine_key = m.machine_key
    JOIN dim_product p ON f.product_key = p.product_key
    JOIN dim_sensor s ON f.sensor_key = s.sensor_key
    JOIN dim_failure fl ON f.failure_key = fl.failure_key
    WHERE {where_str};
    """
    cursor.execute(count_query, params)
    total_count = cursor.fetchone()['total']

    data_query = f"""
    SELECT 
        f.maintenance_id,
        d.full_date,
        d.quarter,
        m.machine_id,
        p.product_type,
        f.air_temperature,
        f.process_temperature,
        f.rotational_speed,
        f.torque,
        f.tool_wear,
        f.machine_failure,
        f.temp_difference,
        f.power_output,
        s.torque_category,
        s.tool_wear_category,
        fl.failure_type,
        fl.severity_level
    FROM fact_machine_maintenance f
    JOIN dim_date d ON f.date_key = d.date_key
    JOIN dim_machine m ON f.machine_key = m.machine_key
    JOIN dim_product p ON f.product_key = p.product_key
    JOIN dim_sensor s ON f.sensor_key = s.sensor_key
    JOIN dim_failure fl ON f.failure_key = fl.failure_key
    WHERE {where_str}
    ORDER BY f.maintenance_id ASC
    LIMIT ? OFFSET ?;
    """
    cursor.execute(data_query, params + [page_size, offset])
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return {
        "page": page,
        "page_size": page_size,
        "total_records": total_count,
        "total_pages": (total_count + page_size - 1) // page_size,
        "records": rows
    }

# ====================================================================
# 3. DATA WAREHOUSE & STAR SCHEMA METADATA APIS
# ====================================================================
@router.get("/warehouse-overview")
def get_warehouse_overview():
    """Returns row counts, schema descriptions, and table structures for the Data Warehouse page."""
    conn = get_db_connection()
    cursor = conn.cursor()

    tables = [
        {"table": "fact_machine_maintenance", "type": "FACT", "role": "Central Fact Table storing quantitative measurements & surrogate FKs"},
        {"table": "dim_date", "type": "DIMENSION", "role": "Time Dimension (Year, Quarter, Month, Day, DayOfWeek)"},
        {"table": "dim_product", "type": "DIMENSION", "role": "Product Quality Dimension (L, M, H components)"},
        {"table": "dim_machine", "type": "DIMENSION", "role": "Machine Master Dimension (Machine ID, machine type, installation)"},
        {"table": "dim_sensor", "type": "DIMENSION", "role": "Categorical/Binned Sensor Operating Envelopes"},
        {"table": "dim_failure", "type": "DIMENSION", "role": "Failure Mode & Severity Classification Dimension"}
    ]

    overview = []
    for t in tables:
        cursor.execute(f"SELECT COUNT(*) AS count FROM {t['table']};")
        row_count = cursor.fetchone()['count']

        cursor.execute(f"PRAGMA table_info({t['table']});")
        cols = [
            {"column_name": col['name'], "data_type": col['type'], "is_primary_key": bool(col['pk'])}
            for col in cursor.fetchall()
        ]

        overview.append({
            "table_name": t['table'],
            "table_type": t['type'],
            "role": t['role'],
            "row_count": row_count,
            "column_count": len(cols),
            "columns": cols
        })

    conn.close()
    return {"warehouse_tables": overview}

@router.get("/schema")
def get_star_schema():
    """Provides complete Star Schema relationships and metadata for visual diagram generation."""
    return {
        "schema_name": "Predictive Maintenance Star Schema",
        "fact_table": {
            "name": "FACT_MACHINE_MAINTENANCE",
            "primary_key": "maintenance_id",
            "measures": [
                {"name": "air_temperature", "type": "REAL", "unit": "K"},
                {"name": "process_temperature", "type": "REAL", "unit": "K"},
                {"name": "rotational_speed", "type": "INTEGER", "unit": "rpm"},
                {"name": "torque", "type": "REAL", "unit": "Nm"},
                {"name": "tool_wear", "type": "INTEGER", "unit": "min"},
                {"name": "temp_difference", "type": "REAL", "unit": "K"},
                {"name": "power_output", "type": "REAL", "unit": "Watts"},
                {"name": "machine_failure", "type": "INTEGER", "unit": "binary 0/1"},
                {"name": "record_count", "type": "INTEGER", "unit": "additive count 1"}
            ],
            "foreign_keys": [
                {"key": "date_key", "references": "DIM_DATE(date_key)", "cardinality": "Many-to-One"},
                {"key": "machine_key", "references": "DIM_MACHINE(machine_key)", "cardinality": "Many-to-One"},
                {"key": "product_key", "references": "DIM_PRODUCT(product_key)", "cardinality": "Many-to-One"},
                {"key": "sensor_key", "references": "DIM_SENSOR(sensor_key)", "cardinality": "Many-to-One"},
                {"key": "failure_key", "references": "DIM_FAILURE(failure_key)", "cardinality": "Many-to-One"}
            ]
        },
        "dimensions": [
            {
                "name": "DIM_DATE",
                "primary_key": "date_key",
                "attributes": ["full_date", "day", "month", "month_name", "quarter", "year", "day_of_week"],
                "hierarchy": "Day -> Month -> Quarter -> Year",
                "description": "Temporal dimension enabling Roll-Up and Drill-Down along calendar hierarchy"
            },
            {
                "name": "DIM_PRODUCT",
                "primary_key": "product_key",
                "attributes": ["product_type", "product_name", "quality_variant", "standard_capacity"],
                "hierarchy": "Product Type (L, M, H) -> Quality Grade",
                "description": "Product variant quality categorization (Low, Medium, High)"
            },
            {
                "name": "DIM_MACHINE",
                "primary_key": "machine_key",
                "attributes": ["machine_id", "machine_type", "installation_year", "operational_status"],
                "hierarchy": "Individual Machine -> Machine Type",
                "description": "Industrial asset identity and manufacturing station specifications"
            },
            {
                "name": "DIM_SENSOR",
                "primary_key": "sensor_key",
                "attributes": ["temp_category", "speed_category", "torque_category", "tool_wear_category", "combined_profile"],
                "hierarchy": "Discrete Reading -> Multi-sensor Envelope",
                "description": "Binned operating condition categories for multi-dimensional slicing"
            },
            {
                "name": "DIM_FAILURE",
                "primary_key": "failure_key",
                "attributes": ["failure_status", "failure_type", "failure_code", "severity_level"],
                "hierarchy": "Status (Normal/Failed) -> Failure Mode Type",
                "description": "Fault classification (TWF, HDF, PWF, OSF, RNF) and severity rating"
            }
        ]
    }

# ====================================================================
# 4. ETL PIPELINE APIS
# ====================================================================
@router.get("/etl/status")
def get_etl_status():
    """Returns current status and log history of the ETL pipeline."""
    return etl_service.get_status()

@router.post("/etl/run")
def trigger_etl_run():
    """Manually triggers the full ETL pipeline: Extract -> Clean/Transform -> Load."""
    try:
        result = etl_service.run()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ====================================================================
# 5. OLAP ANALYSIS APIS (Roll-up, Drill-down, Slice, Dice, Pivot)
# ====================================================================
@router.get("/olap/rollup")
def olap_rollup(
    dimension: str = Query("month", regex="^(year|quarter|month|product_type|sensor_wear)$"),
    measure: str = Query("failure_count")
):
    """Executes an OLAP ROLL-UP operation."""
    return olap_service.execute_rollup(dimension=dimension, measure=measure)

@router.get("/olap/drilldown")
def olap_drilldown(
    hierarchy: str = Query("quarter_to_month", regex="^(quarter_to_month|month_to_day|product_failure)$"),
    parent_value: str = Query("Q2")
):
    """Executes an OLAP DRILL-DOWN operation."""
    return olap_service.execute_drilldown(hierarchy=hierarchy, parent_value=parent_value)

@router.get("/olap/slice")
def olap_slice(
    dimension: str = Query("product_type", regex="^(product_type|failure_status|torque_category|tool_wear_category|quarter)$"),
    value: str = Query("M")
):
    """Executes an OLAP SLICE operation."""
    return olap_service.execute_slice(dimension=dimension, value=value)

@router.post("/olap/dice")
def olap_dice(request: DiceFilterRequest):
    """Executes an OLAP DICE operation across multiple dimension filters."""
    return olap_service.execute_dice(request.model_dump())

@router.get("/olap/pivot")
def olap_pivot(
    row_dim: str = Query("product_type", regex="^(product_type|tool_wear_category|speed_category|quarter)$"),
    col_dim: str = Query("failure_status", regex="^(failure_status|failure_type|torque_category|temp_category)$"),
    metric: str = Query("count", regex="^(count|avg_torque|avg_tool_wear|avg_speed)$")
):
    """Executes an OLAP PIVOT (Rotate) cross-tabulation operation."""
    return olap_service.execute_pivot(row_dim=row_dim, col_dim=col_dim, value_metric=metric)

# ====================================================================
# 6. DATA MINING APIS (Classification, Clustering, Association)
# ====================================================================
@router.get("/mining/classification")
def get_classification_results():
    """Trains and returns benchmark metrics for Decision Tree, Random Forest, and Logistic Regression."""
    return mining_service.run_classification()

@router.post("/mining/predict")
def predict_machine_failure(request: PredictionRequest):
    """Real-time failure risk classification inference for user-provided sensor parameters."""
    return mining_service.predict_single(
        product_type=request.product_type,
        air_temp=request.air_temperature,
        proc_temp=request.process_temperature,
        rot_speed=request.rotational_speed,
        torque=request.torque,
        tool_wear=request.tool_wear
    )

@router.get("/mining/clustering")
def get_clustering_results(k: int = Query(3, ge=2, le=5)):
    """Runs K-Means clustering and returns cluster profiles & 2D PCA projection scatter coordinates."""
    return mining_service.run_clustering(k=k)

@router.get("/mining/association")
def get_association_rules():
    """Computes frequent co-occurrence patterns with support, confidence, and lift."""
    return mining_service.run_association_rules()

# ====================================================================
# 7. ANALYTICS & CORRELATION API
# ====================================================================
@router.get("/analytics")
def get_analytics_insights():
    """Returns correlation matrix, thermal dissipation trends, wear rates, and sensor distributions."""
    conn = get_db_connection()
    df_full = pd.read_sql_query("""
        SELECT f.*, p.product_type 
        FROM fact_machine_maintenance f 
        JOIN dim_product p ON f.product_key = p.product_key
    """, conn)
    conn.close()

    # 1. Failure by product
    failure_by_product = df_full.groupby('product_type').agg(
        total=('machine_failure', 'count'),
        failures=('machine_failure', 'sum'),
        failure_rate=('machine_failure', lambda x: round(x.mean() * 100, 2))
    ).reset_index().to_dict(orient='records')

    df = df_full[[
        'air_temperature',
        'process_temperature',
        'rotational_speed',
        'torque',
        'tool_wear',
        'temp_difference',
        'power_output',
        'machine_failure'
    ]].copy()

    # Correlation Matrix
    corr = df.corr().round(3).to_dict()

    # Rotational Speed vs Torque Binned Analysis (Power Curve)
    df['speed_bin'] = pd.cut(df['rotational_speed'], bins=[1100, 1350, 1500, 1650, 2900], labels=['<1350', '1350-1500', '1500-1650', '>1650'])
    speed_torque_group = df.groupby('speed_bin', observed=False).agg(
        avg_torque=('torque', 'mean'),
        failure_rate=('machine_failure', lambda x: round(x.mean() * 100, 2)),
        count=('machine_failure', 'count')
    ).reset_index()
    speed_torque_group['avg_torque'] = speed_torque_group['avg_torque'].round(2)
    speed_torque_group = speed_torque_group.to_dict(orient="records")

    # 2. Tool wear vs failure
    df['wear_bin'] = pd.cut(df['tool_wear'], bins=[0, 50, 100, 150, 200, 240], labels=['0-50', '50-100', '100-150', '150-200', '200-240'])
    wear_failure = df.groupby('wear_bin', observed=False).agg(
        count=('machine_failure', 'count'),
        failures=('machine_failure', 'sum'),
        failure_rate=('machine_failure', lambda x: round(x.mean() * 100, 2))
    ).reset_index().to_dict(orient='records')

    # 3. Torque vs failure
    df['torque_bin'] = pd.cut(df['torque'], bins=[0, 25, 40, 55, 70, 80], labels=['0-25', '25-40', '40-55', '55-70', '70-80'])
    torque_failure = df.groupby('torque_bin', observed=False).agg(
        count=('machine_failure', 'count'),
        failures=('machine_failure', 'sum'),
        failure_rate=('machine_failure', lambda x: round(x.mean() * 100, 2))
    ).reset_index().to_dict(orient='records')

    # 4. Temperature distribution
    df['temp_bin'] = pd.cut(df['air_temperature'], bins=10)
    temp_dist = df.groupby('temp_bin', observed=False).agg(
        count=('machine_failure', 'count'),
        failures=('machine_failure', 'sum')
    ).reset_index()
    temp_dist['temp_bin'] = temp_dist['temp_bin'].astype(str)
    temp_dist = temp_dist.to_dict(orient='records')

    # 5. Speed distribution
    df['speed_bin_fine'] = pd.cut(df['rotational_speed'], bins=10)
    speed_dist = df.groupby('speed_bin_fine', observed=False).agg(
        count=('machine_failure', 'count'),
        failures=('machine_failure', 'sum')
    ).reset_index()
    speed_dist['speed_bin_fine'] = speed_dist['speed_bin_fine'].astype(str)
    speed_dist = speed_dist.to_dict(orient='records')

    return {
        "correlation_matrix": corr,
        "speed_torque_curve": speed_torque_group,
        "failure_by_product": failure_by_product,
        "tool_wear_vs_failure": wear_failure,
        "torque_vs_failure": torque_failure,
        "temp_distribution": temp_dist,
        "speed_distribution": speed_dist,
        "insights": [
            {
                "title": "Torque vs Rotational Speed Balance",
                "finding": f"Strong negative correlation ({corr['torque']['rotational_speed']}) between torque and speed. High torque at low speed causes heavy mechanical strain and higher failure rates."
            },
            {
                "title": "Tool Wear & Machine Failure",
                "finding": f"Tool wear correlates positively ({corr['tool_wear']['machine_failure']}) with machine breakdown, escalating sharply past 150-200 minutes of continuous operation."
            },
            {
                "title": "Temperature & Heat Dissipation",
                "finding": f"Air and process temperatures are closely aligned ({corr['air_temperature']['process_temperature']}). Insufficient temperature differences trigger heat dissipation failures."
            },
            {
                "title": "Product Type Differences",
                "finding": "Type L equipment shows higher overall failure rates compared to medium (M) and heavy-duty (H) machine variants under standard load."
            }
        ]
    }
