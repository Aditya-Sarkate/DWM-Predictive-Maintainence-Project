import sqlite3
import pandas as pd
from database import get_db_connection

class OLAPEngine:
    """
    Executes OLAP (On-Line Analytical Processing) operations on the Star Schema warehouse:
    - ROLL-UP (Climb up concept hierarchy / dimension reduction)
    - DRILL-DOWN (Step down concept hierarchy / increasing granularity)
    - SLICE (Filtering on 1 dimension to get a 2D sub-cube)
    - DICE (Filtering on 2+ dimensions to get a multi-dimensional sub-cube)
    - PIVOT (Rotating dimensions to create cross-tabulation / multi-perspective views)
    """

    def __init__(self):
        pass

    def execute_rollup(self, dimension="month", measure="failure_count"):
        """
        ROLL-UP: Aggregates detailed operational data into higher-level groupings.
        Dimension options:
        - 'year': Aggregates to Year level
        - 'quarter': Aggregates to Quarter level (Q1, Q2, Q3, Q4)
        - 'month': Aggregates to Month level (Jan - Dec)
        - 'product_type': Aggregates to Product Type (L, M, H)
        - 'sensor_wear': Aggregates to Tool Wear Category
        """
        conn = get_db_connection()

        if dimension == "quarter":
            sql_query = """
            SELECT 
                d.quarter AS Dimension_Value,
                d.year AS Year,
                COUNT(f.maintenance_id) AS Total_Records,
                SUM(f.machine_failure) AS Total_Failures,
                ROUND(AVG(f.machine_failure) * 100.0, 2) AS Failure_Rate_Pct,
                ROUND(AVG(f.torque), 2) AS Avg_Torque_Nm,
                ROUND(AVG(f.tool_wear), 2) AS Avg_Tool_Wear_Min,
                ROUND(AVG(f.rotational_speed), 1) AS Avg_Rotational_Speed_RPM
            FROM fact_machine_maintenance f
            JOIN dim_date d ON f.date_key = d.date_key
            GROUP BY d.year, d.quarter
            ORDER BY d.quarter ASC;
            """
            explanation = "ROLL-UP Operation: Aggregates daily machine maintenance logs up the Date Hierarchy (Day -> Month -> Quarter). Shows quarter-over-quarter industrial metrics."

        elif dimension == "year":
            sql_query = """
            SELECT 
                CAST(d.year AS TEXT) AS Dimension_Value,
                COUNT(f.maintenance_id) AS Total_Records,
                SUM(f.machine_failure) AS Total_Failures,
                ROUND(AVG(f.machine_failure) * 100.0, 2) AS Failure_Rate_Pct,
                ROUND(AVG(f.torque), 2) AS Avg_Torque_Nm,
                ROUND(AVG(f.tool_wear), 2) AS Avg_Tool_Wear_Min,
                ROUND(AVG(f.air_temperature), 2) AS Avg_Air_Temp_K
            FROM fact_machine_maintenance f
            JOIN dim_date d ON f.date_key = d.date_key
            GROUP BY d.year;
            """
            explanation = "ROLL-UP Operation: Highest time-hierarchy roll-up (Day -> Month -> Quarter -> Year). Summarizes total annual factory throughput and safety performance."

        elif dimension == "product_type":
            sql_query = """
            SELECT 
                p.product_type AS Dimension_Value,
                p.product_name AS Product_Name,
                p.quality_variant AS Quality_Variant,
                COUNT(f.maintenance_id) AS Total_Records,
                SUM(f.machine_failure) AS Total_Failures,
                ROUND(AVG(f.machine_failure) * 100.0, 2) AS Failure_Rate_Pct,
                ROUND(AVG(f.torque), 2) AS Avg_Torque_Nm,
                ROUND(AVG(f.tool_wear), 2) AS Avg_Tool_Wear_Min,
                ROUND(AVG(f.power_output), 1) AS Avg_Power_Watts
            FROM fact_machine_maintenance f
            JOIN dim_product p ON f.product_key = p.product_key
            GROUP BY p.product_key, p.product_type, p.product_name, p.quality_variant
            ORDER BY p.product_key ASC;
            """
            explanation = "ROLL-UP Operation: Aggregates individual machines to Product Quality Grade (L, M, H). Demonstrates how product grade impacts failure frequency."

        elif dimension == "sensor_wear":
            sql_query = """
            SELECT 
                s.tool_wear_category AS Dimension_Value,
                COUNT(f.maintenance_id) AS Total_Records,
                SUM(f.machine_failure) AS Total_Failures,
                ROUND(AVG(f.machine_failure) * 100.0, 2) AS Failure_Rate_Pct,
                ROUND(AVG(f.torque), 2) AS Avg_Torque_Nm,
                ROUND(AVG(f.rotational_speed), 1) AS Avg_Rotational_Speed_RPM
            FROM fact_machine_maintenance f
            JOIN dim_sensor s ON f.sensor_key = s.sensor_key
            GROUP BY s.tool_wear_category
            ORDER BY Total_Failures DESC;
            """
            explanation = "ROLL-UP Operation: Groups sensor-level readings into Tool Wear Life Stages (Low, Moderate, Critical). Visibly demonstrates risk concentration in critical wear."

        else: # Default: month
            sql_query = """
            SELECT 
                d.month_name AS Dimension_Value,
                d.month AS Month_Number,
                COUNT(f.maintenance_id) AS Total_Records,
                SUM(f.machine_failure) AS Total_Failures,
                ROUND(AVG(f.machine_failure) * 100.0, 2) AS Failure_Rate_Pct,
                ROUND(AVG(f.torque), 2) AS Avg_Torque_Nm,
                ROUND(AVG(f.tool_wear), 2) AS Avg_Tool_Wear_Min,
                ROUND(AVG(f.temp_difference), 2) AS Avg_Temp_Difference_K
            FROM fact_machine_maintenance f
            JOIN dim_date d ON f.date_key = d.date_key
            GROUP BY d.month, d.month_name
            ORDER BY d.month ASC;
            """
            explanation = "ROLL-UP Operation: Aggregates daily telemetry up the temporal hierarchy to Calendar Month level for monthly operational reporting."

        cursor = conn.cursor()
        cursor.execute(sql_query)
        rows = [dict(row) for row in cursor.fetchall()]
        conn.close()

        columns = list(rows[0].keys()) if rows else []

        return {
            "operation": "ROLL-UP",
            "dimension": dimension,
            "measure": measure,
            "explanation": explanation,
            "sql_query": sql_query.strip(),
            "columns": columns,
            "data": rows,
            "chart_data": rows
        }

    def execute_drilldown(self, hierarchy="time", parent_value="Q2"):
        """
        DRILL-DOWN: Traverses from summary level to finer granularity.
        - Time: Quarter -> Month or Month -> Day
        - Product: Product Grade (e.g. 'L') -> Detailed Failure Modes
        """
        conn = get_db_connection()

        if hierarchy == "product_failure":
            product_type = parent_value if parent_value in ['L', 'M', 'H'] else 'L'
            sql_query = f"""
            SELECT 
                p.product_type AS Product_Type,
                fl.failure_type AS Failure_Category,
                fl.severity_level AS Severity,
                COUNT(f.maintenance_id) AS Record_Count,
                ROUND(AVG(f.torque), 2) AS Avg_Torque_Nm,
                ROUND(AVG(f.tool_wear), 2) AS Avg_Tool_Wear_Min,
                ROUND(AVG(f.rotational_speed), 1) AS Avg_Speed_RPM
            FROM fact_machine_maintenance f
            JOIN dim_product p ON f.product_key = p.product_key
            JOIN dim_failure fl ON f.failure_key = fl.failure_key
            WHERE p.product_type = '{product_type}'
            GROUP BY p.product_type, fl.failure_key, fl.failure_type, fl.severity_level
            ORDER BY Record_Count DESC;
            """
            explanation = f"DRILL-DOWN Operation: Drilling down from Product Type Grade '{product_type}' into specific failure classifications and operational severity."

        elif hierarchy == "month_to_day":
            month_num = int(parent_value) if str(parent_value).isdigit() and 1 <= int(parent_value) <= 12 else 6
            sql_query = f"""
            SELECT 
                d.full_date AS Date_Label,
                d.day AS Day_Of_Month,
                d.day_of_week AS Day_Name,
                COUNT(f.maintenance_id) AS Machines_Monitored,
                SUM(f.machine_failure) AS Failures,
                ROUND(AVG(f.torque), 2) AS Avg_Torque_Nm,
                ROUND(AVG(f.tool_wear), 2) AS Avg_Tool_Wear_Min,
                ROUND(AVG(f.air_temperature), 2) AS Avg_Air_Temp_K
            FROM fact_machine_maintenance f
            JOIN dim_date d ON f.date_key = d.date_key
            WHERE d.month = {month_num}
            GROUP BY d.date_key, d.full_date, d.day, d.day_of_week
            ORDER BY d.day ASC;
            """
            explanation = f"DRILL-DOWN Operation: Drilling down from Month {month_num} to Day-by-Day operational shifts. Displays individual days with failure spikes."

        else: # Default: Quarter -> Month
            quarter_val = parent_value if parent_value in ['Q1', 'Q2', 'Q3', 'Q4'] else 'Q2'
            sql_query = f"""
            SELECT 
                d.quarter AS Quarter,
                d.month_name AS Month,
                d.month AS Month_Number,
                COUNT(f.maintenance_id) AS Machines_Monitored,
                SUM(f.machine_failure) AS Failures_Count,
                ROUND(AVG(f.machine_failure) * 100.0, 2) AS Failure_Rate_Pct,
                ROUND(AVG(f.torque), 2) AS Avg_Torque_Nm,
                ROUND(AVG(f.tool_wear), 2) AS Avg_Tool_Wear_Min,
                ROUND(AVG(f.power_output), 1) AS Avg_Power_Watts
            FROM fact_machine_maintenance f
            JOIN dim_date d ON f.date_key = d.date_key
            WHERE d.quarter = '{quarter_val}'
            GROUP BY d.quarter, d.month, d.month_name
            ORDER BY d.month ASC;
            """
            explanation = f"DRILL-DOWN Operation: Drilling down from {quarter_val} into individual months ({quarter_val} -> Monthly details). Shows monthly breakdown."

        cursor = conn.cursor()
        cursor.execute(sql_query)
        rows = [dict(row) for row in cursor.fetchall()]
        conn.close()

        columns = list(rows[0].keys()) if rows else []

        return {
            "operation": "DRILL-DOWN",
            "hierarchy": hierarchy,
            "parent_value": parent_value,
            "explanation": explanation,
            "sql_query": sql_query.strip(),
            "columns": columns,
            "data": rows,
            "chart_data": rows
        }

    def execute_slice(self, dimension="product_type", value="M"):
        """
        SLICE: Filters the warehouse along ONE specific dimension to produce a 2D sub-cube.
        Supported dimensions:
        - 'product_type': 'L', 'M', 'H'
        - 'failure_status': 'Machine Failure', 'Normal Operation'
        - 'torque_category': 'Low (< 35 Nm)', 'Normal (35-50 Nm)', 'High (> 50 Nm)'
        - 'tool_wear_category': 'Low (< 80 min)', 'Moderate (80-160 min)', 'Critical (> 160 min)'
        - 'quarter': 'Q1', 'Q2', 'Q3', 'Q4'
        """
        conn = get_db_connection()

        if dimension == "product_type":
            filter_clause = f"p.product_type = '{value}'"
            dim_name = "Product Type"
        elif dimension == "failure_status":
            filter_clause = f"fl.failure_status = '{value}'"
            dim_name = "Failure Status"
        elif dimension == "torque_category":
            filter_clause = f"s.torque_category = '{value}'"
            dim_name = "Torque Category"
        elif dimension == "tool_wear_category":
            filter_clause = f"s.tool_wear_category = '{value}'"
            dim_name = "Tool Wear Category"
        elif dimension == "quarter":
            filter_clause = f"d.quarter = '{value}'"
            dim_name = "Quarter"
        else:
            filter_clause = f"p.product_type = '{value}'"
            dim_name = "Product Type"

        sql_query = f"""
        SELECT 
            f.maintenance_id AS ID,
            d.full_date AS Date,
            m.machine_id AS Machine_ID,
            p.product_type AS Product_Type,
            s.temp_category AS Temp_Category,
            s.torque_category AS Torque_Category,
            s.tool_wear_category AS Tool_Wear_Category,
            fl.failure_status AS Status,
            fl.failure_type AS Failure_Type,
            f.air_temperature AS Air_Temp_K,
            f.process_temperature AS Process_Temp_K,
            f.rotational_speed AS Speed_RPM,
            f.torque AS Torque_Nm,
            f.tool_wear AS Tool_Wear_Min,
            f.machine_failure AS Failed
        FROM fact_machine_maintenance f
        JOIN dim_date d ON f.date_key = d.date_key
        JOIN dim_machine m ON f.machine_key = m.machine_key
        JOIN dim_product p ON f.product_key = p.product_key
        JOIN dim_sensor s ON f.sensor_key = s.sensor_key
        JOIN dim_failure fl ON f.failure_key = fl.failure_key
        WHERE {filter_clause}
        ORDER BY f.maintenance_id ASC
        LIMIT 100;
        """

        # Also compute aggregate metrics for the sliced sub-cube
        summary_query = f"""
        SELECT 
            COUNT(f.maintenance_id) AS Total_Count,
            SUM(f.machine_failure) AS Total_Failures,
            ROUND(AVG(f.machine_failure) * 100.0, 2) AS Failure_Rate_Pct,
            ROUND(AVG(f.torque), 2) AS Avg_Torque,
            ROUND(AVG(f.tool_wear), 2) AS Avg_Tool_Wear,
            ROUND(AVG(f.rotational_speed), 1) AS Avg_Speed
        FROM fact_machine_maintenance f
        JOIN dim_date d ON f.date_key = d.date_key
        JOIN dim_machine m ON f.machine_key = m.machine_key
        JOIN dim_product p ON f.product_key = p.product_key
        JOIN dim_sensor s ON f.sensor_key = s.sensor_key
        JOIN dim_failure fl ON f.failure_key = fl.failure_key
        WHERE {filter_clause};
        """

        cursor = conn.cursor()
        cursor.execute(sql_query)
        rows = [dict(row) for row in cursor.fetchall()]

        cursor.execute(summary_query)
        summary = dict(cursor.fetchone() or {})
        conn.close()

        explanation = f"SLICE Operation: Slicing the data cube along {dim_name} = '{value}'. Isolates this 2D slice from the cube for focused examination."

        columns = list(rows[0].keys()) if rows else []

        return {
            "operation": "SLICE",
            "dimension": dimension,
            "filter_value": value,
            "explanation": explanation,
            "sql_query": sql_query.strip(),
            "summary": summary,
            "columns": columns,
            "data": rows,
            "total_matching_records": summary.get("Total_Count", 0)
        }

    def execute_dice(self, filters: dict):
        """
        DICE: Selects a sub-cube by specifying selection conditions on TWO OR MORE dimensions simultaneously.
        Example filters:
        {
            "product_type": "M",
            "min_torque": 50,
            "min_tool_wear": 100,
            "failure_status": "All" or "Machine Failure"
        }
        """
        conn = get_db_connection()

        where_clauses = ["1=1"]
        params = []

        if filters.get("product_type") and filters["product_type"] != "All":
            where_clauses.append("p.product_type = ?")
            params.append(filters["product_type"])

        if filters.get("min_torque") is not None and str(filters["min_torque"]).strip() != "":
            where_clauses.append("f.torque >= ?")
            params.append(float(filters["min_torque"]))

        if filters.get("max_torque") is not None and str(filters["max_torque"]).strip() != "":
            where_clauses.append("f.torque <= ?")
            params.append(float(filters["max_torque"]))

        if filters.get("min_tool_wear") is not None and str(filters["min_tool_wear"]).strip() != "":
            where_clauses.append("f.tool_wear >= ?")
            params.append(int(filters["min_tool_wear"]))

        if filters.get("min_speed") is not None and str(filters["min_speed"]).strip() != "":
            where_clauses.append("f.rotational_speed >= ?")
            params.append(int(filters["min_speed"]))

        if filters.get("failure_status") and filters["failure_status"] != "All":
            where_clauses.append("fl.failure_status = ?")
            params.append(filters["failure_status"])

        if filters.get("quarter") and filters["quarter"] != "All":
            where_clauses.append("d.quarter = ?")
            params.append(filters["quarter"])

        where_str = " AND ".join(where_clauses)

        sql_query = f"""
        SELECT 
            f.maintenance_id AS ID,
            d.full_date AS Date,
            p.product_type AS Product,
            s.speed_category AS Speed_Cat,
            s.torque_category AS Torque_Cat,
            s.tool_wear_category AS Wear_Cat,
            fl.failure_status AS Status,
            fl.failure_type AS Failure_Type,
            f.air_temperature AS Air_Temp,
            f.process_temperature AS Proc_Temp,
            f.rotational_speed AS Speed,
            f.torque AS Torque,
            f.tool_wear AS Tool_Wear,
            f.machine_failure AS Failed
        FROM fact_machine_maintenance f
        JOIN dim_date d ON f.date_key = d.date_key
        JOIN dim_product p ON f.product_key = p.product_key
        JOIN dim_sensor s ON f.sensor_key = s.sensor_key
        JOIN dim_failure fl ON f.failure_key = fl.failure_key
        WHERE {where_str}
        ORDER BY f.maintenance_id ASC
        LIMIT 100;
        """

        summary_query = f"""
        SELECT 
            COUNT(f.maintenance_id) AS Total_Records,
            SUM(f.machine_failure) AS Failures_Count,
            ROUND(AVG(f.machine_failure) * 100.0, 2) AS Failure_Rate_Pct,
            ROUND(AVG(f.torque), 2) AS Avg_Torque_Nm,
            ROUND(AVG(f.tool_wear), 2) AS Avg_Tool_Wear_Min,
            ROUND(AVG(f.rotational_speed), 1) AS Avg_Rotational_Speed
        FROM fact_machine_maintenance f
        JOIN dim_date d ON f.date_key = d.date_key
        JOIN dim_product p ON f.product_key = p.product_key
        JOIN dim_sensor s ON f.sensor_key = s.sensor_key
        JOIN dim_failure fl ON f.failure_key = fl.failure_key
        WHERE {where_str};
        """

        cursor = conn.cursor()
        cursor.execute(sql_query, params)
        rows = [dict(row) for row in cursor.fetchall()]

        cursor.execute(summary_query, params)
        summary = dict(cursor.fetchone() or {})
        conn.close()

        # Reconstructed SQL for display
        display_sql = sql_query
        for p in params:
            val = f"'{p}'" if isinstance(p, str) else str(p)
            display_sql = display_sql.replace("?", val, 1)

        explanation = (
            "DICE Operation: Forms a sub-cube using simultaneous multi-dimensional predicates. "
            "Unlike SLICE (which selects on 1 dimension), DICE projects across multiple dimensions at once."
        )

        columns = list(rows[0].keys()) if rows else []

        return {
            "operation": "DICE",
            "applied_filters": filters,
            "explanation": explanation,
            "sql_query": display_sql.strip(),
            "summary": summary,
            "columns": columns,
            "data": rows,
            "total_matching_records": summary.get("Total_Records", 0)
        }

    def execute_pivot(self, row_dim="product_type", col_dim="failure_status", value_metric="count"):
        """
        PIVOT: Rotates data axes to provide a multi-dimensional cross-tabulation table.
        - row_dim: 'product_type', 'tool_wear_category', 'speed_category', 'quarter'
        - col_dim: 'failure_status', 'failure_type', 'torque_category', 'temp_category'
        - value_metric: 'count', 'avg_torque', 'avg_tool_wear', 'avg_speed'
        """
        conn = get_db_connection()

        dim_expr_map = {
            'product_type': ('p.product_type', 'dim_product p ON f.product_key = p.product_key'),
            'tool_wear_category': ('s.tool_wear_category', 'dim_sensor s ON f.sensor_key = s.sensor_key'),
            'speed_category': ('s.speed_category', 'dim_sensor s ON f.sensor_key = s.sensor_key'),
            'quarter': ('d.quarter', 'dim_date d ON f.date_key = d.date_key'),
            'failure_status': ('fl.failure_status', 'dim_failure fl ON f.failure_key = fl.failure_key'),
            'failure_type': ('fl.failure_type', 'dim_failure fl ON f.failure_key = fl.failure_key'),
            'torque_category': ('s.torque_category', 'dim_sensor s ON f.sensor_key = s.sensor_key'),
            'temp_category': ('s.temp_category', 'dim_sensor s ON f.sensor_key = s.sensor_key')
        }

        row_expr, row_join = dim_expr_map.get(row_dim, dim_expr_map['product_type'])
        col_expr, col_join = dim_expr_map.get(col_dim, dim_expr_map['failure_status'])

        # Collect unique joins
        joins = set()
        joins.add(f"JOIN {row_join}")
        joins.add(f"JOIN {col_join}")
        join_str = "\n".join(list(joins))

        # Query all distinct column values
        col_distinct_query = f"SELECT DISTINCT {col_expr} AS col_val FROM fact_machine_maintenance f {join_str} ORDER BY col_val;"
        cursor = conn.cursor()
        cursor.execute(col_distinct_query)
        distinct_cols = [row['col_val'] for row in cursor.fetchall() if row['col_val']]

        # Build Pivot SQL with conditional CASE expressions
        metric_expr = "COUNT(f.maintenance_id)"
        if value_metric == "avg_torque":
            metric_template = "ROUND(AVG(CASE WHEN {col_expr} = '{c}' THEN f.torque END), 2)"
        elif value_metric == "avg_tool_wear":
            metric_template = "ROUND(AVG(CASE WHEN {col_expr} = '{c}' THEN f.tool_wear END), 2)"
        elif value_metric == "avg_speed":
            metric_template = "ROUND(AVG(CASE WHEN {col_expr} = '{c}' THEN f.rotational_speed END), 1)"
        else: # count
            metric_template = "SUM(CASE WHEN {col_expr} = '{c}' THEN 1 ELSE 0 END)"

        case_clauses = []
        for c in distinct_cols:
            safe_c = str(c).replace("'", "''")
            alias = str(c).replace(" ", "_").replace("(", "").replace(")", "").replace("<", "LT_").replace(">", "GT_").replace("-", "_").replace("|", "_")
            case_clauses.append(f"{metric_template.format(col_expr=col_expr, c=safe_c)} AS [{alias}]")

        case_str = ",\n    ".join(case_clauses)
        if not case_str:
            case_str = "COUNT(f.maintenance_id) AS Total_Count"

        sql_query = f"""
        SELECT 
            {row_expr} AS Row_Label,
            {case_str},
            COUNT(f.maintenance_id) AS Row_Total
        FROM fact_machine_maintenance f
        {join_str}
        GROUP BY {row_expr}
        ORDER BY {row_expr} ASC;
        """

        cursor.execute(sql_query)
        rows = [dict(row) for row in cursor.fetchall()]
        conn.close()

        columns = list(rows[0].keys()) if rows else []

        explanation = (
            f"PIVOT (Rotate) Operation: Cross-tabulation where Rows = '{row_dim}', "
            f"Columns = '{col_dim}', and Cells = '{value_metric}'. "
            "Rotates warehouse perspectives to reveal multi-dimensional interactions."
        )

        return {
            "operation": "PIVOT",
            "row_dimension": row_dim,
            "col_dimension": col_dim,
            "metric": value_metric,
            "explanation": explanation,
            "sql_query": sql_query.strip(),
            "columns": columns,
            "data": rows,
            "distinct_columns": distinct_cols
        }
