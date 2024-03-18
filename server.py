# imports
import numpy as np
import os
import utils
from flask import Flask, jsonify, render_template

app = Flask('geoLABEL')

@app.route('/')
def render_index_page():
    return render_template('index.html')

@app.route('/check_batch_exists/<int:batch>')
def check_batch_exists(batch):
    print(f'Batch {batch}')
    batch_path = f'static/images/batch-{batch}-images'
    batch_exists = os.path.exists(batch_path) and len(os.listdir(batch_path)) == 40
    batch_identifiers = []

    if batch_exists:
        batch_identifiers = [int(file.split('-')[1]) for file in os.listdir(batch_path) if file.endswith('-thermal-in.png')]
    print(batch_identifiers)
    return jsonify({'batch_path_exists': batch_exists, 'batch_identifiers': batch_identifiers})

@app.route('/save_batch_labels/<int:batch>/<identifiers>/<labels>')
def save_batch_labels(batch, identifiers, labels):
    labeled_identifiers = list(map(list, zip(list(map(int, identifiers.split(','))), list(map(int, labels.split(','))))))
    print(labeled_identifiers)
    np.save(f'{utils.get_site_dir()}/batch-{batch}-labeled-identifiers', labeled_identifiers)
    print(np.load(f'{utils.get_site_dir()}/batch-{batch}-labeled-identifiers.npy'))
    return ''

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
