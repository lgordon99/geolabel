# imports
import numpy as np
import os
import random
import utils
from flask import Flask, jsonify, render_template, request

app = Flask('geoLABEL')

@app.route('/')
def render_index_page():
    return render_template('index.html')

@app.route('/check_image_exists', methods=['POST'])
def check_image_exists():
    batch, batch_identifiers = request.json
    print(f'Batch {batch}: {batch_identifiers}')
    batch_path = f'static/images/batch-{batch}-images'
    batch_exists = os.path.exists(batch_path)

    if batch_exists:
        identifier_folder_names = os.listdir(batch_path)

        if len(identifier_folder_names) > len(batch_identifiers):
            new_batch_identifiers = [int(identifier_folder_name) for identifier_folder_name in identifier_folder_names if int(identifier_folder_name) not in batch_identifiers and len(os.listdir(f'{batch_path}/{identifier_folder_name}')) == 4]
            print(new_batch_identifiers)
            if len(new_batch_identifiers) > 0:
                next_identifier = random.choice(new_batch_identifiers)
                print(next_identifier)
                return jsonify({'image_exists': True, 'next_identifier': next_identifier})
    
    return jsonify({'image_exists': False})

@app.route('/save_batch_labels', methods=['POST'])
def save_batch_labels():
    batch, batch_identifiers, batch_labels = request.json
    labeled_identifiers = list(map(list, zip(batch_identifiers, batch_labels)))
    np.save(f'{utils.get_site_dir()}/batch-{batch}-labeled-identifiers', labeled_identifiers)
    print(np.load(f'{utils.get_site_dir()}/batch-{batch}-labeled-identifiers.npy'))
    return ''

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
