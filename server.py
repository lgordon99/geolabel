# imports
from flask import Flask, jsonify, render_template, request
from shutil import rmtree
import numpy as np
import os
import random
import signal
import subprocess
import time
import utils

app = Flask('GeoLABEL')
process = None

@app.route('/')
def render_index_page():
    return render_template('index.html')

@app.route('/get-starting-batch-number')
def get_starting_batch_number():
    labeled_identifiers_path = f'{utils.get_site_dir()}/data/labeled-ids.npy'

    if os.path.exists(labeled_identifiers_path): # if some labels are provided
        labeled_identifiers = np.load(labeled_identifiers_path) # get labeled identifiers

        return jsonify({'batch_number': int(len(labeled_identifiers)/10 + 1)})
    else:
        return jsonify({'batch_number': 1})

@app.route('/run-cnn')
def run_cnn():
    global process
    process = subprocess.Popen('python run.py --train=True --mode=a --modality=tr --query=m --starting_models=../data/firestorm-3/models/model-t,../data/firestorm-3/models/model-r', shell=True, preexec_fn=os.setsid)
    return ''

@app.route('/update-batch', methods=['POST'])
def update_batch():
    image_folder_name, batch, batch_identifiers = request.json
    print(f'Old batch {batch}: {batch_identifiers}')
    batch_path = f'static/{image_folder_name}/batch-{batch}-images'
    batch_exists = os.path.exists(batch_path)

    if batch_exists:
        identifier_folder_names = os.listdir(batch_path)
        new_batch_identifiers = [int(identifier_folder_name) for identifier_folder_name in identifier_folder_names if int(identifier_folder_name) not in batch_identifiers and len(os.listdir(f'{batch_path}/{identifier_folder_name}')) == 4]
        batch_identifiers += new_batch_identifiers
    print(f'New batch {batch}: {batch_identifiers}')
    return jsonify({'batch_identifiers': batch_identifiers})

@app.route('/save-batch-labels', methods=['POST'])
def save_batch_labels():
    batch, batch_identifiers, batch_labels = request.json
    labeled_identifiers = list(map(list, zip(batch_identifiers, batch_labels)))
    np.save(f'{utils.get_site_dir()}/batch-{batch}-labeled-identifiers', labeled_identifiers)
    print(np.load(f'{utils.get_site_dir()}/batch-{batch}-labeled-identifiers.npy'))
    return ''

@app.route('/stop-cnn')
def stop_cnn():
    global process
    os.killpg(os.getpgid(process.pid), signal.SIGTERM)
    process.wait()

    while process.poll() is None:
        time.sleep(1)

    images_folder_path = 'static/images'

    for folder in os.listdir(images_folder_path):
        rmtree(f'{images_folder_path}/{folder}')
    print('Images deleted')
    return ''

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
