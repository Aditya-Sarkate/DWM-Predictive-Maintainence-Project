import sqlite3
import os
from pathlib import Path

# Paths configuration
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
WAREHOUSE_DIR = BASE_DIR / "warehouse"
RAW_CSV_PATH = DATA_DIR / "ai4i2020.csv"
DB_PATH = WAREHOUSE_DIR / "warehouse.db"

def get_db_connection():
    """Create and return a SQLite database connection with row factory enabled."""
    WAREHOUSE_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    # Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_warehouse_schema():
    """
    Creates the complete Star Schema in the SQLite Data Warehouse:
    - 5 Dimension Tables:
        * dim_date
        * dim_machine
        * dim_product
        * dim_sensor
        * dim_failure
    - 1 Central Fact Table:
        * fact_machine_maintenance
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Drop existing tables if rebuilding
    cursor.executescript("""
    DROP TABLE IF EXISTS fact_machine_maintenance;
    DROP TABLE IF EXISTS dim_date;
    DROP TABLE IF EXISTS dim_machine;
    DROP TABLE IF EXISTS dim_product;
    DROP TABLE IF EXISTS dim_sensor;
    DROP TABLE IF EXISTS dim_failure;
    DROP TABLE IF EXISTS etl_log;

    -- ============================================================
    -- DIM_DATE (Time Dimension: Year -> Quarter -> Month -> Day)
    -- ============================================================
    CREATE TABLE dim_date (
        date_key INTEGER PRIMARY KEY,
        full_date TEXT NOT NULL,
        day INTEGER NOT NULL,
        month INTEGER NOT NULL,
        month_name TEXT NOT NULL,
        quarter TEXT NOT NULL,
        year INTEGER NOT NULL,
        day_of_week TEXT NOT NULL
    );

    -- ============================================================
    -- DIM_MACHINE (Machine Dimension)
    -- ============================================================
    CREATE TABLE dim_machine (
        machine_key INTEGER PRIMARY KEY,
        machine_id TEXT NOT NULL UNIQUE,
        machine_type TEXT NOT NULL,
        installation_year INTEGER NOT NULL,
        operational_status TEXT NOT NULL
    );

    -- ============================================================
    -- DIM_PRODUCT (Product Quality Dimension)
    -- ============================================================
    CREATE TABLE dim_product (
        product_key INTEGER PRIMARY KEY,
        product_type TEXT NOT NULL UNIQUE,
        product_name TEXT NOT NULL,
        quality_variant TEXT NOT NULL,
        standard_capacity INTEGER NOT NULL
    );

    -- ============================================================
    -- DIM_SENSOR (Sensor Binned/Categorical Dimension)
    -- ============================================================
    CREATE TABLE dim_sensor (
        sensor_key INTEGER PRIMARY KEY AUTOINCREMENT,
        temp_category TEXT NOT NULL,
        speed_category TEXT NOT NULL,
        torque_category TEXT NOT NULL,
        tool_wear_category TEXT NOT NULL,
        combined_profile TEXT NOT NULL UNIQUE
    );

    -- ============================================================
    -- DIM_FAILURE (Failure Status & Mode Dimension)
    -- ============================================================
    CREATE TABLE dim_failure (
        failure_key INTEGER PRIMARY KEY,
        failure_status TEXT NOT NULL,
        failure_type TEXT NOT NULL,
        failure_code TEXT NOT NULL,
        severity_level TEXT NOT NULL
    );

    -- ============================================================
    -- FACT_MACHINE_MAINTENANCE (Central Fact Table)
    -- ============================================================
    CREATE TABLE fact_machine_maintenance (
        maintenance_id INTEGER PRIMARY KEY,
        date_key INTEGER NOT NULL,
        machine_key INTEGER NOT NULL,
        product_key INTEGER NOT NULL,
        sensor_key INTEGER NOT NULL,
        failure_key INTEGER NOT NULL,
        air_temperature REAL NOT NULL,
        process_temperature REAL NOT NULL,
        rotational_speed INTEGER NOT NULL,
        torque REAL NOT NULL,
        tool_wear INTEGER NOT NULL,
        machine_failure INTEGER NOT NULL,
        temp_difference REAL NOT NULL,
        power_output REAL NOT NULL,
        record_count INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (date_key) REFERENCES dim_date(date_key),
        FOREIGN KEY (machine_key) REFERENCES dim_machine(machine_key),
        FOREIGN KEY (product_key) REFERENCES dim_product(product_key),
        FOREIGN KEY (sensor_key) REFERENCES dim_sensor(sensor_key),
        FOREIGN KEY (failure_key) REFERENCES dim_failure(failure_key)
    );

    -- Indexes for fast OLAP aggregations
    CREATE INDEX idx_fact_date ON fact_machine_maintenance(date_key);
    CREATE INDEX idx_fact_product ON fact_machine_maintenance(product_key);
    CREATE INDEX idx_fact_failure ON fact_machine_maintenance(failure_key);
    CREATE INDEX idx_fact_sensor ON fact_machine_maintenance(sensor_key);
    CREATE INDEX idx_fact_machine ON fact_machine_maintenance(machine_key);

    -- ============================================================
    -- ETL_LOG (Tracks ETL pipeline runs and statistics)
    -- ============================================================
    CREATE TABLE etl_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_timestamp TEXT NOT NULL,
        records_extracted INTEGER NOT NULL,
        records_transformed INTEGER NOT NULL,
        records_loaded INTEGER NOT NULL,
        dimensions_created INTEGER NOT NULL,
        fact_rows_created INTEGER NOT NULL,
        status TEXT NOT NULL,
        message TEXT NOT NULL
    );
    """)

    conn.commit()
    conn.close()
    return True
