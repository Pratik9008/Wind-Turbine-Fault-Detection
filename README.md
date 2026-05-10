# 🌀 TurbineGuard AI: Wind Turbine Fault Detection

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-v3.0.0-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![ML](https://img.shields.io/badge/Machine%20Learning-XGBoost%20|%20DBSCAN-FF6F00?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/)

**TurbineGuard AI** is a state-of-the-art predictive maintenance platform designed to detect faults in wind turbines before they lead to catastrophic failure. Using advanced Machine Learning techniques like SMOTE for data balancing, XGBoost for classification, and DBSCAN for anomaly detection, this platform provides real-time insights from sensor data.

---

## 🚀 Live Demo
Experience the platform live: **[TurbineGuard AI Dashboard](https://wind-turbine-fault-detection.onrender.com/)**

---

## ✨ Key Features

- **🧠 Triple-Layer AI Pipeline**:
  - **SMOTE**: Automatically balances datasets to handle rare failure cases.
  - **XGBoost**: High-accuracy classification of fault types.
  - **DBSCAN**: Unsupervised clustering to detect unknown anomalies.
- **📊 Interactive Dashboard**: Real-time visualization of vibration data and feature importance using Chart.js.
- **📁 Dataset Library**: Access to 50+ pre-generated sensor datasets for testing.
- **📜 Analysis History**: Track and restore all past evaluations with a single click.
- **🔒 Secure Authentication**: Integrated user login and registration system.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (Glassmorphism UI), JavaScript (ES6+), Chart.js
- **Backend**: Python 3, Flask, SQLite3
- **Machine Learning**: 
  - `scikit-learn` (Standardization & Metrics)
  - `XGBoost` (Feature Importance & Prediction)
  - `imbalanced-learn` (SMOTE)
  - `pandas` & `numpy` (Data Processing)

---

## 📦 Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Pratik9008/Wind-Turbine-Fault-Detection.git
   cd Wind-Turbine-Fault-Detection
   ```

2. **Set up Virtual Environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Application**:
   ```bash
   python app.py
   ```
   Open `http://127.0.0.1:5000` in your browser.

---

## 📈 Methodology

### 1. Data Balancing (SMOTE)
Wind turbine failures are rare. SMOTE (Synthetic Minority Over-sampling Technique) creates synthetic failure samples to ensure the AI doesn't become biased toward "normal" operation.

### 2. Feature Importance (XGBoost)
The platform identifies which sensors (Vibration, Temperature, Rotor Speed) are most critical in predicting a failure, allowing engineers to focus on the right parts.

### 3. Anomaly Detection (DBSCAN)
Unsupervised clustering finds data patterns that don't fit normal behavior, catching "weird" sensor readings that might indicate a new, unknown type of failure.

---

## 👤 Author
**Ankit Kesarwani**
- [GitHub](https://github.com/Pratik9008)
- [LinkedIn](https://www.linkedin.com/in/pratik-kumar-rajput/)

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
