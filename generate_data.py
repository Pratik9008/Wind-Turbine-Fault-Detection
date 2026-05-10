import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_wind_turbine_data(num_samples=500):
    np.random.seed(42)
    
    # Generate timestamps
    start_time = datetime(2026, 5, 1, 0, 0, 0)
    timestamps = [start_time + timedelta(minutes=10*i) for i in range(num_samples)]
    
    # Base normal operational data
    rotor_speed = np.random.normal(15.0, 1.5, num_samples)
    gearbox_temp = np.random.normal(65.0, 5.0, num_samples)
    vibration = np.random.normal(1.2, 0.3, num_samples)
    wind_speed = np.random.normal(12.0, 2.0, num_samples)
    power_output = np.random.normal(1500, 100, num_samples)
    
    # Faults (Imbalanced, around 10-15% of data)
    fault_labels = np.random.choice([0, 1], size=num_samples, p=[0.88, 0.12])
    
    # Inject correlated anomalies where fault_label == 1
    for i in range(num_samples):
        if fault_labels[i] == 1:
            # Fault conditions: High vibration, high temp, drop in power
            vibration[i] += np.random.uniform(2.5, 5.0)
            gearbox_temp[i] += np.random.uniform(15.0, 30.0)
            power_output[i] -= np.random.uniform(300, 800)
            # Add some randomness to rotor speed
            rotor_speed[i] += np.random.uniform(2.0, 4.0)

    # Compile dataset
    df = pd.DataFrame({
        'timestamp': [t.strftime('%Y-%m-%d %H:%M:%S') for t in timestamps],
        'rotor_speed': np.round(rotor_speed, 2),
        'gearbox_temp': np.round(gearbox_temp, 2),
        'vibration': np.round(vibration, 2),
        'wind_speed': np.round(wind_speed, 2),
        'power_output': np.round(power_output, 2),
        'fault_label': fault_labels
    })
    
    df.to_csv('wind_turbine_data.csv', index=False)
    print(f"Generated wind_turbine_data.csv with {num_samples} rows.")

if __name__ == '__main__':
    generate_wind_turbine_data()
