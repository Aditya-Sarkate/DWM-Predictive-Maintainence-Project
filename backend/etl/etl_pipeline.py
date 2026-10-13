import pandas as pd
import numpy as np
import datetime
import time
import math
from pathlib import Path
from database import get_db_connection, init_warehouse_schema, RAW_CSV_PATH

class ETLPipeline:
    def __init__(self):
        self.raw_csv_path = RAW_CSV_PATH
        self.stats = {}

    def run(self):
        """Execute the full Extract-Transform-Load pipeline."""
        start_time = time.time()
        
        # 1. EXTRACT
        raw_df, extract_stats = self.extract()
        
        # 2. TRANSFORM
        transformed_data, transform_stats = self.transform(raw_df)
        
        # 3. LOAD
        load_stats = self.load(transformed_data)
        
        total_duration = round(time.time() - start_time, 3)
        
        pipeline_summary = {
            "status": "SUCCESS",
            "duration_seconds": total_duration,
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "extract": extract_stats,
            "transform": transform_stats,
            "load": load_stats
        }
        
        # Save run log into database
        self._record_etl_log(pipeline_summary)
        
        return pipeline_summary

    def extract(self):
        """EXTRACT phase: Read raw CSV dataset and compute extraction metrics."""
        if not self.raw_csv_path.exists():
            raise FileNotFoundError(f"Raw dataset not found at {self.raw_csv_path}")
            
        df = pd.read_csv(str(self.raw_csv_path))
        
        extract_stats = {
            "source_file": self.raw_csv_path.name,
            "file_size_bytes": self.raw_csv_path.stat().st_size,
            "total_rows_extracted": len(df),
            "total_columns": len(df.columns),
            "column_names": list(df.columns),
            "missing_values_detected": int(df.isnull().sum().sum()),
            "duplicate_records": int(df.duplicated(subset=['UDI']).sum())
        }
        return df, extract_stats

    def transform(self, df: pd.DataFrame):
        """
        TRANSFORM phase:
        - Data Cleaning & standardisation
        - Renaming to clean database attribute names
        - Deriving physical measures: temp_diff, power_output
        - Building Star Schema Dimension Tables:
            * dim_date
            * dim_product
            * dim_machine
            * dim_sensor
            * dim_failure
        - Assembling Fact Table: fact_machine_maintenance
        """
        clean_df = df.copy()

        # Handle any missing values if present (imputation)
        clean_df = clean_df.ffill().bfill()

        # Standard clean column names
        rename_map = {
            'Air temperature [K]': 'air_temperature',
            'Process temperature [K]': 'process_temperature',
            'Rotational speed [rpm]': 'rotational_speed',
            'Torque [Nm]': 'torque',
            'Tool wear [min]': 'tool_wear',
            'Machine failure': 'machine_failure',
            'Type': 'product_type',
            'Product ID': 'machine_id'
        }
        clean_df.rename(columns=rename_map, inplace=True)

        # Derived Measures
        clean_df['temp_difference'] = np.round(clean_df['process_temperature'] - clean_df['air_temperature'], 2)
        # Mechanical Power = (2 * pi * N / 60) * Torque (Watts)
        clean_df['power_output'] = np.round((2 * math.pi * clean_df['rotational_speed'] / 60.0) * clean_df['torque'], 2)

        # -------------------------------------------------------------
        # 1. DIM_DATE (Simulated chronological 2020 operating cycle)
        # -------------------------------------------------------------
        total_rows = len(clean_df)
        base_date = datetime.date(2020, 1, 1)
        # Map 10,000 records across 366 days in 2020 (~27.3 records/day)
        date_records = []
        date_map = {} # day_index -> date_key

        days_in_year = 366
        records_per_day = math.ceil(total_rows / days_in_year)

        date_keys_for_fact = []
        for i in range(total_rows):
            day_offset = min(i // records_per_day, days_in_year - 1)
            current_date = base_date + datetime.timedelta(days=day_offset)
            date_key = int(current_date.strftime("%Y%m%d"))
            date_keys_for_fact.append(date_key)

            if date_key not in date_map:
                q = f"Q{(current_date.month - 1) // 3 + 1}"
                date_map[date_key] = {
                    "date_key": date_key,
                    "full_date": current_date.strftime("%Y-%m-%d"),
                    "day": current_date.day,
                    "month": current_date.month,
                    "month_name": current_date.strftime("%B"),
                    "quarter": q,
                    "year": current_date.year,
                    "day_of_week": current_date.strftime("%A")
                }

        dim_date_df = pd.DataFrame(list(date_map.values()))
        clean_df['date_key'] = date_keys_for_fact

        # -------------------------------------------------------------
        # 2. DIM_PRODUCT
        # -------------------------------------------------------------
        product_meta = {
            'L': {"product_key": 1, "product_name": "Light Duty Quality (L)", "quality_variant": "Low (50% distribution)", "standard_capacity": 1500},
            'M': {"product_key": 2, "product_name": "Medium Duty Quality (M)", "quality_variant": "Medium (30% distribution)", "standard_capacity": 2000},
            'H': {"product_key": 3, "product_name": "Heavy Duty Quality (H)", "quality_variant": "High (20% distribution)", "standard_capacity": 2500},
        }
        dim_product_rows = []
        for ptype, pinfo in product_meta.items():
            dim_product_rows.append({
                "product_key": pinfo["product_key"],
                "product_type": ptype,
                "product_name": pinfo["product_name"],
                "quality_variant": pinfo["quality_variant"],
                "standard_capacity": pinfo["standard_capacity"]
            })
        dim_product_df = pd.DataFrame(dim_product_rows)
        clean_df['product_key'] = clean_df['product_type'].map(lambda x: product_meta.get(x, {}).get("product_key", 1))

        # -------------------------------------------------------------
        # 3. DIM_MACHINE
        # -------------------------------------------------------------
        unique_machines = clean_df[['machine_id', 'product_type']].drop_duplicates().reset_index(drop=True)
        unique_machines['machine_key'] = range(1, len(unique_machines) + 1)
        unique_machines['machine_type'] = unique_machines['product_type'].map({
            'L': 'Milling Lathe Type L',
            'M': 'CNC Milling Center M',
            'H': 'High-Precision CNC H'
        })
        # Generate consistent installation year & status
        np.random.seed(42)
        unique_machines['installation_year'] = np.random.choice([2017, 2018, 2019], size=len(unique_machines), p=[0.2, 0.4, 0.4])
        unique_machines['operational_status'] = 'Active Operational'

        dim_machine_df = unique_machines[['machine_key', 'machine_id', 'machine_type', 'installation_year', 'operational_status']]
        machine_key_map = dict(zip(dim_machine_df['machine_id'], dim_machine_df['machine_key']))
        clean_df['machine_key'] = clean_df['machine_id'].map(machine_key_map)

        # -------------------------------------------------------------
        # 4. DIM_SENSOR (Categorical Bins)
        # -------------------------------------------------------------
        def categorize_temp(t):
            if t < 300.0:
                return "Low (< 300 K)"
            elif t <= 302.0:
                return "Normal (300-302 K)"
            else:
                return "High (> 302 K)"

        def categorize_speed(s):
            if s < 1400:
                return "Low (< 1400 rpm)"
            elif s <= 1600:
                return "Optimal (1400-1600 rpm)"
            else:
                return "High (> 1600 rpm)"

        def categorize_torque(tq):
            if tq < 35.0:
                return "Low (< 35 Nm)"
            elif tq <= 50.0:
                return "Normal (35-50 Nm)"
            else:
                return "High (> 50 Nm)"

        def categorize_tool_wear(tw):
            if tw < 80:
                return "Low (< 80 min)"
            elif tw <= 160:
                return "Moderate (80-160 min)"
            else:
                return "Critical (> 160 min)"

        clean_df['temp_category'] = clean_df['air_temperature'].apply(categorize_temp)
        clean_df['speed_category'] = clean_df['rotational_speed'].apply(categorize_speed)
        clean_df['torque_category'] = clean_df['torque'].apply(categorize_torque)
        clean_df['tool_wear_category'] = clean_df['tool_wear'].apply(categorize_tool_wear)

        clean_df['combined_profile'] = (
            clean_df['temp_category'] + " | " +
            clean_df['speed_category'] + " | " +
            clean_df['torque_category'] + " | " +
            clean_df['tool_wear_category']
        )

        unique_sensors = clean_df[['temp_category', 'speed_category', 'torque_category', 'tool_wear_category', 'combined_profile']].drop_duplicates().reset_index(drop=True)
        unique_sensors['sensor_key'] = range(1, len(unique_sensors) + 1)
        dim_sensor_df = unique_sensors[['sensor_key', 'temp_category', 'speed_category', 'torque_category', 'tool_wear_category', 'combined_profile']]

        sensor_key_map = dict(zip(dim_sensor_df['combined_profile'], dim_sensor_df['sensor_key']))
        clean_df['sensor_key'] = clean_df['combined_profile'].map(sensor_key_map)

        # -------------------------------------------------------------
        # 5. DIM_FAILURE
        # -------------------------------------------------------------
        def determine_failure_key(row):
            if row['machine_failure'] == 0:
                return 0
            if row.get('TWF', 0) == 1:
                return 1
            if row.get('HDF', 0) == 1:
                return 2
            if row.get('PWF', 0) == 1:
                return 3
            if row.get('OSF', 0) == 1:
                return 4
            if row.get('RNF', 0) == 1:
                return 5
            return 6 # General Failure

        clean_df['failure_key'] = clean_df.apply(determine_failure_key, axis=1)

        dim_failure_rows = [
            {"failure_key": 0, "failure_status": "Normal Operation", "failure_type": "No Failure", "failure_code": "NORMAL", "severity_level": "None"},
            {"failure_key": 1, "failure_status": "Machine Failure", "failure_type": "Tool Wear Failure", "failure_code": "TWF", "severity_level": "High"},
            {"failure_key": 2, "failure_status": "Machine Failure", "failure_type": "Heat Dissipation Failure", "failure_code": "HDF", "severity_level": "Critical"},
            {"failure_key": 3, "failure_status": "Machine Failure", "failure_type": "Power Failure", "failure_code": "PWF", "severity_level": "Critical"},
            {"failure_key": 4, "failure_status": "Machine Failure", "failure_type": "Overstrain Failure", "failure_code": "OSF", "severity_level": "High"},
            {"failure_key": 5, "failure_status": "Machine Failure", "failure_type": "Random Failure", "failure_code": "RNF", "severity_level": "Moderate"},
            {"failure_key": 6, "failure_status": "Machine Failure", "failure_type": "Unspecified Machine Failure", "failure_code": "GEN_FAIL", "severity_level": "Moderate"},
        ]
        dim_failure_df = pd.DataFrame(dim_failure_rows)

        # -------------------------------------------------------------
        # FACT TABLE ASSEMBLY
        # -------------------------------------------------------------
        clean_df['maintenance_id'] = clean_df['UDI']
        clean_df['record_count'] = 1

        fact_columns = [
            'maintenance_id', 'date_key', 'machine_key', 'product_key', 'sensor_key', 'failure_key',
            'air_temperature', 'process_temperature', 'rotational_speed', 'torque', 'tool_wear',
            'machine_failure', 'temp_difference', 'power_output', 'record_count'
        ]
        fact_df = clean_df[fact_columns].copy()

        transform_stats = {
            "records_transformed": len(fact_df),
            "dimensions_generated": 5,
            "dimension_counts": {
                "dim_date": len(dim_date_df),
                "dim_product": len(dim_product_df),
                "dim_machine": len(dim_machine_df),
                "dim_sensor": len(dim_sensor_df),
                "dim_failure": len(dim_failure_df)
            },
            "fact_rows": len(fact_df),
            "calculated_measures": ["temp_difference", "power_output", "record_count"]
        }

        transformed_data = {
            "dim_date": dim_date_df,
            "dim_product": dim_product_df,
            "dim_machine": dim_machine_df,
            "dim_sensor": dim_sensor_df,
            "dim_failure": dim_failure_df,
            "fact_machine_maintenance": fact_df
        }

        return transformed_data, transform_stats

    def load(self, transformed_data: dict):
        """LOAD phase: Write transformed dimension and fact tables into SQLite Data Warehouse."""
        # Initialize schema DDL
        init_warehouse_schema()
        
        conn = get_db_connection()
        
        load_counts = {}
        for table_name, df_data in transformed_data.items():
            df_data.to_sql(table_name, conn, if_exists="append", index=False)
            load_counts[table_name] = len(df_data)
            
        conn.commit()
        conn.close()

        load_stats = {
            "database": "warehouse.db",
            "schema_type": "Star Schema",
            "tables_loaded": list(load_counts.keys()),
            "rows_loaded_per_table": load_counts,
            "total_records_loaded": load_counts["fact_machine_maintenance"]
        }
        return load_stats

    def _record_etl_log(self, summary: dict):
        """Record an execution summary in the etl_log table."""
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO etl_log (
                    run_timestamp, records_extracted, records_transformed,
                    records_loaded, dimensions_created, fact_rows_created,
                    status, message
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                summary["timestamp"],
                summary["extract"]["total_rows_extracted"],
                summary["transform"]["records_transformed"],
                summary["load"]["total_records_loaded"],
                summary["transform"]["dimensions_generated"],
                summary["transform"]["fact_rows"],
                summary["status"],
                f"ETL completed in {summary['duration_seconds']}s. Star Schema loaded with 5 dimensions and 1 fact table."
            ))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Warning: could not write to etl_log: {e}")

    def get_status(self):
        """Retrieve recent ETL runs and data warehouse status."""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM etl_log ORDER BY id DESC LIMIT 5;")
        logs = [dict(row) for row in cursor.fetchall()]
        
        # Check actual table counts
        table_counts = {}
        tables = ['dim_date', 'dim_machine', 'dim_product', 'dim_sensor', 'dim_failure', 'fact_machine_maintenance']
        for t in tables:
            try:
                cursor.execute(f"SELECT COUNT(*) as count FROM {t};")
                row = cursor.fetchone()
                table_counts[t] = row['count'] if row else 0
            except Exception:
                table_counts[t] = 0

        conn.close()
        return {
            "warehouse_status": "READY" if table_counts.get("fact_machine_maintenance", 0) > 0 else "EMPTY",
            "table_counts": table_counts,
            "recent_logs": logs
        }

if __name__ == "__main__":
    pipeline = ETLPipeline()
    res = pipeline.run()
    print("ETL Pipeline executed successfully!")
    print(res)
