import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from imblearn.over_sampling import SMOTE
from sklearn.linear_model import Perceptron, RidgeClassifier
from xgboost import XGBClassifier
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler

def run_ml_pipeline(filepath):
    """
    Real Machine Learning pipeline execution for Wind Turbine Fault Detection.
    Loads CSV, applies SMOTE, extracts Tree-based features (XGBoost),
    and runs Perceptron, Ridge, XGBoost, and DBSCAN.
    """
    try:
        # 1. Load Data
        df = pd.read_csv(filepath)
        
        # Check if required columns exist, fallback to mock if not (for safety)
        features_cols = ['rotor_speed', 'gearbox_temp', 'vibration', 'wind_speed', 'power_output']
        if not all(c in df.columns for c in features_cols) or 'fault_label' not in df.columns:
            raise ValueError("Uploaded CSV does not match the expected format.")
            
        X = df[features_cols]
        y = df['fault_label']
        
        original_size = len(df)
        minority_class_size = int(y.sum())
        
        # 2. Data Balancing (SMOTE)
        smote = SMOTE(random_state=42)
        X_resampled, y_resampled = smote.fit_resample(X, y)
        size_after_smote = len(X_resampled)
        
        # Train-Test Split
        X_train, X_test, y_train, y_test = train_test_split(X_resampled, y_resampled, test_size=0.2, random_state=42)
        
        # 3. Train Models
        # Perceptron
        perc = Perceptron(random_state=42)
        perc.fit(X_train, y_train)
        perc_acc = accuracy_score(y_test, perc.predict(X_test))
        
        # Ridge Classifier
        ridge = RidgeClassifier(random_state=42)
        ridge.fit(X_train, y_train)
        ridge_acc = accuracy_score(y_test, ridge.predict(X_test))
        
        # XGBoost
        xgb = XGBClassifier(use_label_encoder=False, eval_metric='logloss', random_state=42)
        xgb.fit(X_train, y_train)
        xgb_acc = accuracy_score(y_test, xgb.predict(X_test))
        
        # 4. Feature Importance (from XGBoost)
        importances = xgb.feature_importances_
        features_out = [{"name": col, "importance": float(imp)} for col, imp in zip(features_cols, importances)]
        
        # 5. Anomaly Clustering (DBSCAN)
        # Standardize data for DBSCAN
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        dbscan = DBSCAN(eps=1.5, min_samples=5)
        clusters = dbscan.fit_predict(X_scaled)
        total_anomalies_detected = int(np.sum(clusters == -1))
        
        # 6. Time series data for plotting (last 30 points)
        last_30 = df.tail(30).reset_index()
        # Ensure we have enough data
        if len(last_30) == 0:
            last_30 = pd.DataFrame(columns=['timestamp', 'vibration', 'fault_label'])
            
        time_series = []
        for i, row in last_30.iterrows():
            time_series.append({
                "time": row['timestamp'] if 'timestamp' in row else f"T-{30-i}",
                "vibration": float(row['vibration']),
                "anomaly": bool(row['fault_label'])
            })

        # 7. Generate Insights
        top_feature = max(features_out, key=lambda x: x['importance'])['name']
        
        insights = {
            "smote": f"Original data had only {minority_class_size} fault samples. SMOTE generated {size_after_smote - original_size} new synthetic faults to balance the classes.",
            "xgboost": f"XGBoost analyzed all sensors and found that '{top_feature}' is the most critical indicator of failure in this dataset.",
            "dbscan": f"DBSCAN detected {total_anomalies_detected} unusual patterns in the vibration and temperature data that don't match normal clusters."
        }

        return {
            "dataset_stats": {
                "original_size": original_size,
                "minority_class_size": minority_class_size,
                "size_after_smote": size_after_smote
            },
            "model_performance": {
                "perceptron": float(perc_acc),
                "ridge_regression": float(ridge_acc),
                "xgboost": float(xgb_acc)
            },
            "dbscan_anomalies": total_anomalies_detected,
            "tree_features": features_out,
            "time_series_data": time_series,
            "insights": insights
        }
        
    except Exception as e:
        print(f"ML Pipeline Error: {str(e)}")
        # Fallback if file is completely invalid or algorithm fails
        import random
        return {
            "dataset_stats": { "original_size": 0, "minority_class_size": 0, "size_after_smote": 0 },
            "model_performance": { "perceptron": 0.0, "ridge_regression": 0.0, "xgboost": 0.0, "ridge_regression": 0.0 },
            "dbscan_anomalies": 0,
            "tree_features": [{"name": "Error", "importance": 0}],
            "time_series_data": [],
            "insights": {
                "smote": "Could not process dataset balance. Check file format.",
                "xgboost": "Feature extraction failed. Standard metrics shown.",
                "dbscan": "Anomaly detection skipped due to data issues."
            }
        }
