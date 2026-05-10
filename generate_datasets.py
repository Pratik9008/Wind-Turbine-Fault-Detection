import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta

def generate_datasets(num_files=50, base_path='datasets', start_index=1):
    if not os.path.exists(base_path):
        os.makedirs(base_path)
    
    for i in range(start_index, start_index + num_files):
        num_samples = np.random.randint(100, 1000)
        np.random.seed(datetime.now().microsecond + i)
        
        start_time = datetime(2026, 5, 1, 0, 0, 0)
        timestamps = [start_time + timedelta(minutes=10*j) for j in range(num_samples)]
        
        # Varying characteristics per dataset - MORE REALISTIC
        noise_level = np.random.uniform(0.5, 1.5) # Increased base noise
        fault_prob = np.random.uniform(0.05, 0.15)
        
        rotor_speed = np.random.normal(15.0, 2.0, num_samples)
        gearbox_temp = np.random.normal(65.0, 8.0, num_samples)
        vibration = np.random.normal(1.2, noise_level, num_samples)
        wind_speed = np.random.normal(12.0, 3.0, num_samples)
        power_output = np.random.normal(1500, 150, num_samples)
        
        fault_labels = np.random.choice([0, 1], size=num_samples, p=[1-fault_prob, fault_prob])
        
        for j in range(num_samples):
            if fault_labels[j] == 1:
                # More subtle anomalies that overlap with normal range
                vibration[j] += np.random.uniform(0.5, 1.5) 
                gearbox_temp[j] += np.random.uniform(5.0, 15.0)
                power_output[j] -= np.random.uniform(100, 300)
                
        # Add some random noise to specific rows regardless of label
        noise_indices = np.random.choice(num_samples, size=int(num_samples * 0.1), replace=False)
        vibration[noise_indices] += np.random.normal(0, 1.0, len(noise_indices))

        df = pd.DataFrame({
            'timestamp': [t.strftime('%Y-%m-%d %H:%M:%S') for t in timestamps],
            'rotor_speed': np.round(rotor_speed, 2),
            'gearbox_temp': np.round(gearbox_temp, 2),
            'vibration': np.round(vibration, 2),
            'wind_speed': np.round(wind_speed, 2),
            'power_output': np.round(power_output, 2),
            'fault_label': fault_labels
        })
        
        filename = f'turbine_data_batch_{i:02d}.csv'
        df.to_csv(os.path.join(base_path, filename), index=False)
        print(f"Generated {filename} with {num_samples} rows.")

if __name__ == '__main__':
    generate_datasets()
