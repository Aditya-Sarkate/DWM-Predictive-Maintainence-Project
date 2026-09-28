# Predictive Maintenance Data Warehouse & Mining System (DWM)

> **Enterprise Platform Specification**  
> **Domain:** Industrial Manufacturing & Predictive Maintenance  
> **Dataset:** AI4I 2020 Predictive Maintenance Dataset (10,000 Industrial Milling Machine Records)  
> **Stack:** Python, FastAPI, SQLite (Star Schema), React 19, Vite, Tailwind CSS, Recharts  
> **License:** 100% Free & Open-Source (No paid APIs or cloud dependencies)

---

## 📌 Project Overview

This platform implements an end-to-end industrial **Predictive Maintenance Data Warehouse & Mining System**. The system integrates data warehousing and predictive analytics into a unified, high-performance web application:

1. **Dimensional Data Warehouse:** True relational Star Schema with 1 Central Fact Table and 5 Dimension Tables.
2. **ETL Pipeline:** Extract &rarr; Clean & Impute &rarr; Transform &rarr; Populate Dimension & Fact Tables into SQLite (`warehouse.db`).
3. **Interactive OLAP Engine:** Real-time multi-dimensional analytical queries for **Roll-Up**, **Drill-Down**, **Slice**, **Dice**, and **Pivot** with dynamic SQL generation and visual chart analytics.
4. **Data Mining Engine:** Supervised Classification (**Decision Tree**, **Random Forest**, **Logistic Regression**), live failure inference, unsupervised **K-Means Clustering** with **2D PCA projection**, and **Frequent Association Rule Mining**.
5. **Industrial Analytics Dashboard:** Dark telemetry monitor featuring real-time KPIs, power dissipation curves, thermal distribution, and correlation matrices.

---

## 🏛️ Star Schema Architecture

The warehouse is modeled as a classic **Star Schema**:

```
                       ┌─────────────────────────┐
                       │        DIM_DATE         │
                       │─────────────────────────│
                       │ PK: date_key            │
                       │ full_date, day, month   │
                       │ quarter, year, day_name │
                       └────────────┬────────────┘
                                    │ (1:N)
 ┌─────────────────────────┐        │        ┌─────────────────────────┐
 │       DIM_PRODUCT       │        │        │       DIM_MACHINE       │
 │─────────────────────────│        │        │─────────────────────────│
 │ PK: product_key         ├────────┼───────►│ PK: machine_key         │
 │ product_type (L, M, H)  │ (1:N)  │  (1:N) │ machine_id, type        │
 │ quality_variant         │        │        │ installation, status    │
 └─────────────────────────┘        │        └─────────────────────────┘
                                    ▼
                 ┌──────────────────────────────────────┐
                 │       FACT_MACHINE_MAINTENANCE       │
                 │──────────────────────────────────────│
                 │ PK: maintenance_id                   │
                 │ FK: date_key                         │
                 │ FK: machine_key                      │
                 │ FK: product_key                      │
                 │ FK: sensor_key                       │
                 │ FK: failure_key                      │
                 │--------------------------------------│
                 │ Measures:                            │
                 │ • air_temperature [K]               │
                 │ • process_temperature [K]           │
                 │ • rotational_speed [rpm]             │
                 │ • torque [Nm]                        │
                 │ • tool_wear [min]                    │
                 │ • temp_difference [K]                │
                 │ • power_output [W]                   │
                 │ • machine_failure [0 or 1]           │
                 │ • record_count [additive 1]          │
                 └──────────────────┬───────────────────┘
                                    │
                         ┌──────────┴──────────┐
                         │ (N:1)         (N:1) │
                         ▼                     ▼
          ┌─────────────────────────┐   ┌─────────────────────────┐
          │       DIM_SENSOR        │   │       DIM_FAILURE       │
          │─────────────────────────│   │─────────────────────────│
          │ PK: sensor_key          │   │ PK: failure_key         │
          │ temp_category           │   │ failure_status          │
          │ speed_category          │   │ failure_type (TWF, etc) │
          │ torque_category         │   │ severity_level          │
          │ tool_wear_category      │   │ failure_code            │
          └─────────────────────────┘   └─────────────────────────┘
```

### Table Definitions:

| Table Name | Type | Primary Key | Description & Role |
| :--- | :--- | :--- | :--- |
| **`fact_machine_maintenance`** | **FACT** | `maintenance_id` | Central grain table storing continuous sensor measures and additive metrics. |
| **`dim_date`** | **DIMENSION** | `date_key` | Calendar hierarchy: `Day -> Month -> Quarter -> Year`. |
| **`dim_product`** | **DIMENSION** | `product_key` | Product Quality variants: `L (50%)`, `M (30%)`, `H (20%)`. |
| **`dim_machine`** | **DIMENSION** | `machine_key` | Industrial asset master (machine model, ID, installation year). |
| **`dim_sensor`** | **DIMENSION** | `sensor_key` | Binned categorical sensor operating envelopes. |
| **`dim_failure`** | **DIMENSION** | `failure_key` | Fault status and failure modes: `NORMAL`, `TWF`, `HDF`, `PWF`, `OSF`, `RNF`. |

---

## ⚙️ The ETL Pipeline

1. **Extract:** Parses `data/ai4i2020.csv` (10,000 rows &times; 14 attributes).
2. **Clean & Impute:** Audits missing values, validates zero duplicate records, standardizes column syntax.
3. **Transform:**
   - Computes derived measures: $\Delta T = T_{\text{process}} - T_{\text{air}}$ and Mechanical Power $P = \frac{2\pi \cdot N}{60} \times \tau$.
   - Bins continuous attributes into descriptive categories (e.g. Critical Tool Wear $> 160\text{ min}$).
   - Assigns chronological dates across 366 days in 2020 to establish a temporal dimension.
   - Generates surrogate keys linking to dimension tables.
4. **Load:** Executes DDL in SQLite (`warehouse/warehouse.db`), populates 5 dimension tables + 1 fact table, and builds B-Tree indexes.

---

## 🔄 Interactive OLAP Operations

| Operation | Concept Description | Industrial Implementation in App |
| :--- | :--- | :--- |
| **ROLL-UP** | Summarizes data by climbing up a hierarchy (dimension reduction). | Day &rarr; Month &rarr; Quarter &rarr; Year breakdown of machine failures. |
| **DRILL-DOWN** | Navigates from summary to detailed data (increasing granularity). | Quarter (e.g. `Q2`) &rarr; Monthly breakdown or Month &rarr; Daily readings. |
| **SLICE** | Performs a selection on **1 dimension**, isolating a 2D sub-cube. | `dim_product.product_type = 'M'` or `dim_failure.failure_status = 'Machine Failure'`. |
| **DICE** | Defines a sub-cube by filtering across **2 or more dimensions** simultaneously. | `product_type = 'M' AND torque >= 50 AND tool_wear >= 100`. |
| **PIVOT** | Rotates data axes to provide an alternative cross-tabulation matrix. | Rows = `Product Type`, Columns = `Failure Status`, Cells = `Count of Machines`. |

---

## 🤖 Data Mining Module

### 1. Classification (Target: `Machine failure`)
- **Leakage Prevention:** Identifier columns (`UDI`, `Product ID`) and failure modes (`TWF`, `HDF`, `PWF`, `OSF`, `RNF`) are strictly **excluded** from features.
- **Models:**
  - **Decision Tree Classifier:** Easy-to-explain hierarchical rule splits.
  - **Random Forest Classifier:** Bagged ensemble achieving $>97\%$ accuracy and balanced F1-score.
  - **Logistic Regression:** Scaled linear baseline.
- **Evaluation:** Accuracy, Precision, Recall, F1-Score, and 4-quadrant Confusion Matrix.
- **Live Predictor:** Real-time sensor input form calculating instant failure probability and risk advisory.

### 2. Clustering (K-Means)
- Unsupervised operational regime discovery on standardized sensor attributes.
- Configurable $k \in [2, 5]$ with silhouette score validation.
- **PCA 2D Projection:** Principal Component Analysis maps 5-dimensional features to an interactive 2D coordinate plane.

### 3. Association Rules (Frequent Pattern Mining)
- Mines co-occurrence rules (Support, Confidence, Lift) from binned sensor categories.
- Example: `{Critical Tool Wear (> 160 min) AND High Torque (> 50 Nm)} -> Machine Failure` with Lift $> 8\times$.

---

## 🚀 How to Run Locally

### Prerequisites
- Python 3.10+
- Node.js v18+ and npm

### Method 1: One-Click Windows Launcher (Recommended)
Simply double-click:
```cmd
run_full_system.bat
```
This starts the backend server on `http://127.0.0.1:8000` (which automatically hosts both the REST APIs and built frontend) and opens your browser.

---

### Method 2: Manual Terminal Execution

#### 1. Backend Server
```bash
cd backend
pip install -r requirements.txt
python main.py
```
Backend runs at: **`http://127.0.0.1:8000`**  
Interactive Swagger API Docs: **`http://127.0.0.1:8000/docs`**

#### 2. Frontend Development Server (Optional for Live Hot-Reloading)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: **`http://localhost:3000`**

---

## 📑 Technical Architecture & Operational FAQ

1. **Why is Star Schema utilized instead of Snowflake Schema?**  
   *Design Rationale:* Dimension tables are completely de-normalized into single tables. This eliminates multi-level joins, maximizing query execution speed for high-throughput OLAP aggregations.

2. **What is the granularity of the Fact Table?**  
   *Design Rationale:* The grain is one row per machine sensor scan during a manufacturing operation.

3. **Why are TWF, HDF, PWF, OSF, and RNF excluded from predictive classification?**  
   *Design Rationale:* Those flags represent specific failure classifications recorded synchronously with breakdown. Using them would cause **target leakage**, artificially inflating accuracy. In production, maintenance models must forecast failure *before* it occurs using continuous operational telemetry (Air Temp, Process Temp, Speed, Torque, Tool Wear).

4. **What distinguishes the Slice and Dice operations?**  
   *Design Rationale:* **Slice** selects on a single dimension (e.g. `Product Type = 'M'`), whereas **Dice** selects on two or more dimensions simultaneously (e.g. `Product = 'M' AND Torque > 50 AND Tool Wear > 100`).

5. **How are Support, Confidence, and Lift calculated in Association Rules?**  
   *Design Rationale:* **Support** is the proportion of total records containing the rule; **Confidence** is the probability of the consequent given the antecedent; and **Lift** measures the factor by which occurrence of the antecedent increases the likelihood of the consequent relative to baseline probability.
