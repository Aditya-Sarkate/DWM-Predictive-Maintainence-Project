import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score
import sqlite3
from database import get_db_connection

class DataMiningEngine:
    """
    Executes Data Mining techniques for the DWM system:
    1. Supervised Classification (Decision Tree, Random Forest, Logistic Regression)
    2. Unsupervised Clustering (K-Means with PCA projection)
    3. Association / Frequent Pattern Analysis
    """

    def __init__(self):
        self._cached_classification = None
        self._trained_models = {}
        self._scaler = None
        self._feature_names = [
            "Product Type (L/M/H)",
            "Air Temperature [K]",
            "Process Temperature [K]",
            "Rotational Speed [rpm]",
            "Torque [Nm]",
            "Tool Wear [min]"
        ]

    def _load_features_from_warehouse(self):
        """
        Load training features directly from warehouse Star Schema tables.
        Removes identifiers (UDI, machine_id) and excludes failure-modes (TWF, HDF, PWF, OSF, RNF)
        to strictly prevent target leakage.
        """
        conn = get_db_connection()
        query = """
        SELECT 
            p.product_type,
            f.air_temperature,
            f.process_temperature,
            f.rotational_speed,
            f.torque,
            f.tool_wear,
            f.machine_failure
        FROM fact_machine_maintenance f
        JOIN dim_product p ON f.product_key = p.product_key;
        """
        df = pd.read_sql_query(query, conn)
        conn.close()

        # Encode Product Type: L=0, M=1, H=2
        type_mapping = {'L': 0, 'M': 1, 'H': 2}
        df['type_encoded'] = df['product_type'].map(type_mapping).fillna(0)

        feature_cols = ['type_encoded', 'air_temperature', 'process_temperature', 'rotational_speed', 'torque', 'tool_wear']
        X = df[feature_cols]
        y = df['machine_failure']

        return X, y, df

    def run_classification(self):
        """
        Train and evaluate 3 benchmark classifiers:
        1. Decision Tree (Entropy / Gini tree)
        2. Random Forest (Ensemble bagging)
        3. Logistic Regression (Linear probabilistic boundary)
        """
        X, y, df = self._load_features_from_warehouse()

        # Split 80% train, 20% test with stratified sampling (preserving failure ratio)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.20, random_state=42, stratify=y
        )

        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        self._scaler = scaler

        models = {
            "Decision Tree": DecisionTreeClassifier(max_depth=6, random_state=42),
            "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42),
            "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42)
        }

        results = {}
        for name, model in models.items():
            if name == "Logistic Regression":
                model.fit(X_train_scaled, y_train)
                y_pred = model.predict(X_test_scaled)
                y_prob = model.predict_proba(X_test_scaled)[:, 1]
            else:
                model.fit(X_train, y_train)
                y_pred = model.predict(X_test)
                y_prob = model.predict_proba(X_test)[:, 1]

            cm = confusion_matrix(y_test, y_pred)
            # cm format: [[TN, FP], [FN, TP]]
            tn, fp, fn, tp = cm.ravel()

            acc = float(accuracy_score(y_test, y_pred))
            prec = float(precision_score(y_test, y_pred, zero_division=0))
            rec = float(recall_score(y_test, y_pred, zero_division=0))
            f1 = float(f1_score(y_test, y_pred, zero_division=0))

            # Feature importance
            feature_importance = []
            if hasattr(model, "feature_importances_"):
                for feat, imp in zip(self._feature_names, model.feature_importances_):
                    feature_importance.append({"feature": feat, "importance": round(float(imp) * 100, 2)})
                feature_importance.sort(key=lambda x: x["importance"], reverse=True)
            elif hasattr(model, "coef_"):
                coefs = np.abs(model.coef_[0])
                total_coef = sum(coefs) if sum(coefs) > 0 else 1
                for feat, imp in zip(self._feature_names, coefs):
                    feature_importance.append({"feature": feat, "importance": round(float(imp / total_coef) * 100, 2)})
                feature_importance.sort(key=lambda x: x["importance"], reverse=True)

            results[name] = {
                "name": name,
                "accuracy": round(acc * 100, 2),
                "precision": round(prec * 100, 2),
                "recall": round(rec * 100, 2),
                "f1_score": round(f1 * 100, 2),
                "confusion_matrix": {
                    "true_negative": int(tn),
                    "false_positive": int(fp),
                    "false_negative": int(fn),
                    "true_positive": int(tp)
                },
                "feature_importance": feature_importance
            }

            self._trained_models[name] = model

        # Model benchmark comparison metadata
        comparison = [
            {
                "Model": k,
                "Accuracy (%)": v["accuracy"],
                "Precision (%)": v["precision"],
                "Recall (%)": v["recall"],
                "F1 Score (%)": v["f1_score"],
                "True Positives": v["confusion_matrix"]["true_positive"],
                "False Positives": v["confusion_matrix"]["false_positive"]
            }
            for k, v in results.items()
        ]

        total_failures_in_dataset = int(y.sum())
        total_records = len(y)

        self._cached_classification = {
            "models": results,
            "comparison": comparison,
            "dataset_info": {
                "total_samples": total_records,
                "training_samples": len(X_train),
                "testing_samples": len(X_test),
                "total_failures": total_failures_in_dataset,
                "failure_rate_pct": round(total_failures_in_dataset / total_records * 100, 2),
                "target_column": "Machine failure (0 = No, 1 = Yes)",
                "features_used": self._feature_names
            },
            "technical_note": (
                "Supervised Classification: Target leakage was prevented by excluding synchronous failure-mode flags "
                "(TWF, HDF, PWF, OSF, RNF) and synthetic identifiers. The models evaluate pre-failure operational telemetry "
                "to anticipate breakdown."
            )
        }

        return self._cached_classification

    def predict_single(self, product_type: str, air_temp: float, proc_temp: float, rot_speed: int, torque: float, tool_wear: int):
        """
        Interactive Real-time Failure Prediction for live machine condition monitoring.
        """
        if not self._trained_models:
            self.run_classification()

        model = self._trained_models.get("Random Forest")
        type_mapping = {'L': 0, 'M': 1, 'H': 2}
        p_enc = type_mapping.get(product_type.upper(), 0)

        input_data = pd.DataFrame([{
            'type_encoded': p_enc,
            'air_temperature': air_temp,
            'process_temperature': proc_temp,
            'rotational_speed': rot_speed,
            'torque': torque,
            'tool_wear': tool_wear
        }])

        pred = int(model.predict(input_data)[0])
        prob = float(model.predict_proba(input_data)[0][1])

        # Evaluate risk level
        if prob > 0.65:
            risk = "CRITICAL ALERT"
            action = "Immediate shutdown and mechanical inspection required. High probability of catastrophic tool/power failure."
        elif prob > 0.35:
            risk = "ELEVATED RISK"
            action = "Schedule preventive tool changeover and recalibrate spindle load within next operational shift."
        else:
            risk = "NORMAL - HEALTHY"
            action = "Machine parameters are within nominal operational safety tolerances. Continue standard monitoring."

        return {
            "prediction": pred,
            "predicted_label": "Machine Failure Likely" if pred == 1 else "Normal Safe Operation",
            "failure_probability_pct": round(prob * 100, 1),
            "risk_level": risk,
            "recommended_action": action,
            "inputs": {
                "product_type": product_type,
                "air_temperature": air_temp,
                "process_temperature": proc_temp,
                "rotational_speed": rot_speed,
                "torque": torque,
                "tool_wear": tool_wear
            }
        }

    def run_clustering(self, k: int = 3):
        """
        Unsupervised Clustering (K-Means):
        Discovers natural operational machine operating profiles without target labels.
        Uses PCA (Principal Component Analysis) to reduce 5D sensor space to 2D for interactive plotting.
        """
        k = max(2, min(k, 5))
        conn = get_db_connection()
        query = """
        SELECT 
            air_temperature,
            process_temperature,
            rotational_speed,
            torque,
            tool_wear,
            machine_failure
        FROM fact_machine_maintenance;
        """
        df = pd.read_sql_query(query, conn)
        conn.close()

        features = ['air_temperature', 'process_temperature', 'rotational_speed', 'torque', 'tool_wear']
        X = df[features]

        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        cluster_labels = kmeans.fit_predict(X_scaled)
        df['cluster'] = cluster_labels

        # Calculate silhouette score on sample for speed
        sample_indices = np.random.RandomState(42).choice(len(X_scaled), size=min(1500, len(X_scaled)), replace=False)
        sil_score = round(float(silhouette_score(X_scaled[sample_indices], cluster_labels[sample_indices])), 3)

        # 2D PCA projection for visual scatter diagram
        pca = PCA(n_components=2, random_state=42)
        X_pca = pca.fit_transform(X_scaled)
        df['pca_x'] = np.round(X_pca[:, 0], 2)
        df['pca_y'] = np.round(X_pca[:, 1], 2)

        # Cluster Summaries & Profiles
        cluster_profiles = []
        cluster_descriptions = {
            0: "High Speed / Low Torque Operation (Standard high-rpm light milling regime)",
            1: "High Stress / Heavy Torque Regime (Heavy roughing cuts with heightened failure risk)",
            2: "Moderate Balanced Operational Regime (Optimal thermal & mechanical balance)",
            3: "Elevated Thermal & High Tool Wear Profile (Near-end-of-life cutting regime)",
            4: "Extreme Overstrain Anomaly Cluster (Boundary operating conditions)"
        }

        for c_id in range(k):
            c_data = df[df['cluster'] == c_id]
            size = len(c_data)
            failures = int(c_data['machine_failure'].sum())
            fail_rate = round((failures / size) * 100, 2) if size > 0 else 0

            cluster_profiles.append({
                "cluster_id": c_id,
                "cluster_name": f"Cluster {c_id}",
                "description": cluster_descriptions.get(c_id, f"Operational Segment {c_id}"),
                "size": size,
                "percentage": round((size / len(df)) * 100, 1),
                "total_failures": failures,
                "failure_rate_pct": fail_rate,
                "avg_air_temp": round(float(c_data['air_temperature'].mean()), 1),
                "avg_process_temp": round(float(c_data['process_temperature'].mean()), 1),
                "avg_speed": round(float(c_data['rotational_speed'].mean()), 0),
                "avg_torque": round(float(c_data['torque'].mean()), 1),
                "avg_tool_wear": round(float(c_data['tool_wear'].mean()), 1)
            })

        # Sample points for the 2D frontend chart (downsampled to 300 points for fast SVG render)
        scatter_sample = df[['pca_x', 'pca_y', 'cluster', 'machine_failure', 'torque', 'rotational_speed']].sample(n=350, random_state=42)
        scatter_points = scatter_sample.to_dict(orient="records")

        return {
            "k": k,
            "silhouette_score": sil_score,
            "pca_explained_variance_ratio": [round(float(v) * 100, 1) for v in pca.explained_variance_ratio_],
            "cluster_profiles": cluster_profiles,
            "scatter_points": scatter_points,
            "features_used": features,
            "technical_note": (
                "Unsupervised Clustering: K-Means partitions the operational feature space into "
                "k clusters by minimizing within-cluster sum of squares (WCSS). PCA projection provides a 2D coordinate "
                "plane that clearly separates mechanical operational clusters."
            )
        }

    def run_association_rules(self):
        """
        Association / Frequent Pattern Analysis:
        Evaluates support, confidence, and lift for actionable industrial failure rules.
        """
        conn = get_db_connection()
        query = """
        SELECT 
            p.product_type,
            s.temp_category,
            s.speed_category,
            s.torque_category,
            s.tool_wear_category,
            f.machine_failure
        FROM fact_machine_maintenance f
        JOIN dim_product p ON f.product_key = p.product_key
        JOIN dim_sensor s ON f.sensor_key = s.sensor_key;
        """
        df = pd.read_sql_query(query, conn)
        conn.close()

        total = len(df)
        base_failure_prob = df['machine_failure'].mean()

        patterns = [
            {
                "antecedent": "Critical Tool Wear (> 160 min) AND High Torque (> 50 Nm)",
                "consequent": "Machine Failure",
                "condition": (df['tool_wear_category'].str.contains('Critical')) & (df['torque_category'].str.contains('High'))
            },
            {
                "antecedent": "High Torque (> 50 Nm) AND Low Speed (< 1400 rpm)",
                "consequent": "Machine Failure",
                "condition": (df['torque_category'].str.contains('High')) & (df['speed_category'].str.contains('Low'))
            },
            {
                "antecedent": "High Temperature (> 302 K) AND Critical Tool Wear (> 160 min)",
                "consequent": "Machine Failure",
                "condition": (df['temp_category'].str.contains('High')) & (df['tool_wear_category'].str.contains('Critical'))
            },
            {
                "antecedent": "Low Quality Type L AND Critical Tool Wear (> 160 min)",
                "consequent": "Machine Failure",
                "condition": (df['product_type'] == 'L') & (df['tool_wear_category'].str.contains('Critical'))
            },
            {
                "antecedent": "Optimal Speed (1400-1600 rpm) AND Low Tool Wear (< 80 min)",
                "consequent": "Normal Operation (No Failure)",
                "condition": (df['speed_category'].str.contains('Optimal')) & (df['tool_wear_category'].str.contains('Low')),
                "target_val": 0
            },
            {
                "antecedent": "Low Torque (< 35 Nm) AND Low Tool Wear (< 80 min)",
                "consequent": "Normal Operation (No Failure)",
                "condition": (df['torque_category'].str.contains('Low')) & (df['tool_wear_category'].str.contains('Low')),
                "target_val": 0
            }
        ]

        rules = []
        for p in patterns:
            cond = p["condition"]
            target_val = p.get("target_val", 1)
            target_mask = (df['machine_failure'] == target_val)

            count_ant = int(cond.sum())
            count_ant_and_cons = int((cond & target_mask).sum())
            base_cons_prob = target_mask.mean()

            support = round((count_ant_and_cons / total) * 100, 2)
            confidence = round((count_ant_and_cons / count_ant * 100), 2) if count_ant > 0 else 0
            lift = round((confidence / 100.0) / base_cons_prob, 2) if base_cons_prob > 0 else 1.0

            rules.append({
                "rule_id": len(rules) + 1,
                "antecedent": p["antecedent"],
                "consequent": p["consequent"],
                "support_pct": support,
                "confidence_pct": confidence,
                "lift": lift,
                "sample_count": count_ant,
                "target_count": count_ant_and_cons,
                "interpretation": (
                    f"When {p['antecedent']} occurs, {p['consequent']} happens {confidence}% of the time "
                    f"({lift}x more likely than random baseline)."
                )
            })

        return {
            "rules": rules,
            "disclaimer": "Engineering Note: These rules represent empirical co-occurrence patterns observed in historical telemetry, distinguishing statistical correlation from absolute physical causality.",
            "metrics_guide": {
                "support": "P(A ∩ B): Proportion of total transactions containing both antecedent and consequent.",
                "confidence": "P(B | A): Probability that the consequent occurs given the antecedent.",
                "lift": "P(B | A) / P(B): How many times more likely B is when A is present compared to baseline."
            }
        }
