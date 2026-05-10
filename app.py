from flask import Flask, render_template, request, jsonify
import os
import time
import sqlite3
import json
from datetime import datetime
from ml_pipeline import run_ml_pipeline

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
DB_FILE = 'database.db'

if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

import subprocess
from generate_datasets import generate_datasets

@app.route('/api/generate_more', methods=['POST'])
def generate_more():
    # Find next batch number
    base_path = 'datasets'
    if not os.path.exists(base_path):
        os.makedirs(base_path)
    
    files = [f for f in os.listdir(base_path) if f.startswith('turbine_data_batch_')]
    next_num = len(files) + 1
    
    # Generate 1 new file
    generate_datasets(num_files=1, base_path=base_path, start_index=next_num)
    
    return jsonify({'success': True, 'message': f'Batch {next_num} generated!'})

@app.route('/api/open_folder')
def open_folder():
    path = os.path.abspath('datasets')
    if os.name == 'nt': # Windows
        subprocess.Popen(['explorer', path])
    return jsonify({'success': True})

app.secret_key = 'super_secret_turbine_key_123'

def get_db_connection():
    conn = sqlite3.connect(DB_FILE, timeout=10)
    conn.row_factory = sqlite3.Row
    return conn

# Initialize SQLite Database
def init_db():
    with get_db_connection() as conn:
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT,
                xgboost_accuracy REAL,
                anomalies_detected INTEGER,
                timestamp DATETIME,
                results_json TEXT
            )
        ''')
        # Users Table
        c.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT,
                full_name TEXT
            )
        ''')
        # Migrate if column missing
        try:
            c.execute('ALTER TABLE predictions ADD COLUMN results_json TEXT')
        except: pass
        try:
            c.execute('ALTER TABLE users ADD COLUMN full_name TEXT')
        except: pass
    conn.close()

init_db()

from flask import session, redirect, url_for

@app.route('/')
def index():
    if 'logged_in' not in session:
        return redirect(url_for('login'))
    
    # Get welcome info and then clear it
    is_new = session.pop('is_new_user', False)
    show_welcome = session.pop('show_welcome', False)
    
    return render_template('index.html', 
                           username=session.get('username', 'User'),
                           full_name=session.get('full_name', 'User'),
                           is_new_user=is_new,
                           show_welcome=show_welcome)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        full_name = request.form.get('full_name')
        username = request.form.get('username')
        password = request.form.get('password')
        try:
            with get_db_connection() as conn:
                c = conn.cursor()
                c.execute('INSERT INTO users (username, password, full_name) VALUES (?, ?, ?)', (username, password, full_name))
                conn.commit()
            
            # Auto-login after register
            session['logged_in'] = True
            session['username'] = username
            session['full_name'] = full_name
            session['is_new_user'] = True
            session['show_welcome'] = True
            return redirect(url_for('index'))
        except sqlite3.IntegrityError:
            return render_template('register.html', error="This email address is already registered.")
    return render_template('register.html')

@app.route('/reset-password', methods=['GET', 'POST'])
def reset_password():
    if request.method == 'POST':
        username = request.form.get('username')
        new_password = request.form.get('password')
        
        with get_db_connection() as conn:
            c = conn.cursor()
            # Check if user exists
            c.execute('SELECT * FROM users WHERE username = ?', (username,))
            user = c.fetchone()
            
            if user:
                c.execute('UPDATE users SET password = ? WHERE username = ?', (new_password, username))
                conn.commit()
                return redirect(url_for('login'))
            else:
                return render_template('reset_password.html', error="Email address not found in our system.")
            
    return render_template('reset_password.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        with get_db_connection() as conn:
            c = conn.cursor()
            c.execute('SELECT * FROM users WHERE username = ? AND password = ?', (username, password))
            user = c.fetchone()
        
        if user:
            session['logged_in'] = True
            session['username'] = username
            session['full_name'] = user['full_name'] if (user and 'full_name' in user.keys()) else username
            session['is_new_user'] = False
            session['show_welcome'] = True
            return redirect(url_for('index'))
        else:
            return render_template('login.html', error="Invalid email or password.")
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    session.pop('username', None)
    return redirect(url_for('login'))

@app.route('/history')
def history():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('SELECT * FROM predictions ORDER BY timestamp DESC')
    records = c.fetchall()
    conn.close()
    return render_template('history.html', records=records)

@app.route('/api/history')
def api_history():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('SELECT * FROM predictions ORDER BY timestamp DESC')
    records = c.fetchall()
    conn.close()
    
    # Format for JSON
    history_data = []
    for row in records:
        history_data.append({
            'id': row[0],
            'filename': row[1],
            'accuracy': row[2],
            'anomalies': row[3],
            'timestamp': row[4],
            'has_details': True if (len(row) > 5 and row[5]) else False
        })
    return jsonify(history_data)

@app.route('/api/delete_history/<int:record_id>', methods=['DELETE'])
def delete_history_item(record_id):
    with get_db_connection() as conn:
        c = conn.cursor()
        c.execute('DELETE FROM predictions WHERE id = ?', (record_id,))
        conn.commit()
    return jsonify({'success': True, 'message': f'Record #{record_id} deleted successfully'})

@app.route('/api/clear_all_history', methods=['DELETE'])
def clear_all_history():
    with get_db_connection() as conn:
        c = conn.cursor()
        c.execute('DELETE FROM predictions')
        conn.commit()
    return jsonify({'success': True, 'message': 'All history cleared successfully'})

@app.route('/api/history/<int:record_id>')
def get_history_record(record_id):
    with get_db_connection() as conn:
        c = conn.cursor()
        c.execute('SELECT results_json FROM predictions WHERE id = ?', (record_id,))
        row = c.fetchone()
    
    if row and row['results_json']:
        return jsonify({'success': True, 'results': json.loads(row['results_json'])})
    return jsonify({'success': False, 'message': 'Record not found or has no detailed data.'})

from flask import send_file

@app.route('/api/datasets')
def list_datasets():
    base_path = 'datasets'
    if not os.path.exists(base_path):
        return jsonify([])
    files = [f for f in os.listdir(base_path) if f.endswith('.csv')]
    return jsonify(files)

from flask import make_response

from flask import send_from_directory

@app.route('/api/download_dataset/<filename>')
def download_dataset(filename):
    base_path = os.path.abspath('datasets')
    return send_from_directory(base_path, filename, as_attachment=True)

@app.route('/api/run_dataset/<filename>', methods=['POST'])
def run_library_dataset(filename):
    base_path = 'datasets'
    filepath = os.path.join(base_path, filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
        
    # Simulate processing delay
    time.sleep(1)
    
    results = run_ml_pipeline(filepath)
    # Save to history
    with get_db_connection() as conn:
        c = conn.cursor()
        c.execute('INSERT INTO predictions (filename, xgboost_accuracy, anomalies_detected, timestamp, results_json) VALUES (?, ?, ?, ?, ?)',
                  (f"{filename} (Library)", results['model_performance']['xgboost'], results['dbscan_anomalies'], datetime.now().strftime("%Y-%m-%d %H:%M:%S"), json.dumps(results)))
        conn.commit()
    
    return jsonify({'message': f'Library file {filename} successfully processed', 'results': results})

@app.route('/download_sample')
def download_sample():
    try:
        with open('wind_turbine_data.csv', 'r') as f:
            content = f.read()
        return Response(content, mimetype='text/plain')
    except Exception as e:
        return str(e), 500

@app.route('/api/run_dummy', methods=['POST'])
def run_dummy():
    # Simulate processing delay
    time.sleep(1)
    
    filepath = 'wind_turbine_data.csv'
    results = run_ml_pipeline(filepath)
    
    # Save to history
    with get_db_connection() as conn:
        c = conn.cursor()
        c.execute('INSERT INTO predictions (filename, xgboost_accuracy, anomalies_detected, timestamp, results_json) VALUES (?, ?, ?, ?, ?)',
                  ("wind_turbine_data.csv (Demo)", results['model_performance']['xgboost'], results['dbscan_anomalies'], datetime.now().strftime("%Y-%m-%d %H:%M:%S"), json.dumps(results)))
        conn.commit()
    latest_results = results
    
    return jsonify({'message': 'Demo Data successfully processed', 'results': results})

# Global storage for the latest analysis (for report generation)
latest_results = {}

@app.route('/api/upload', methods=['POST'])
def upload_file():
    global latest_results
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)
        
        # Simulate processing delay
        time.sleep(1)
        
        # Run ML Pipeline
        results = run_ml_pipeline(filepath)
        
        # Save to history
        with get_db_connection() as conn:
            c = conn.cursor()
            c.execute('INSERT INTO predictions (filename, xgboost_accuracy, anomalies_detected, timestamp, results_json) VALUES (?, ?, ?, ?, ?)',
                      (file.filename + " (Upload)", results['model_performance']['xgboost'], results['dbscan_anomalies'], datetime.now().strftime("%Y-%m-%d %H:%M:%S"), json.dumps(results)))
            conn.commit()
        
        latest_results = results
        return jsonify({'message': 'File successfully processed', 'results': results})

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000, threaded=True)
