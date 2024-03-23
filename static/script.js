let batch = 1;
let batch_identifiers = [];
let current_index = 0;
let current_modality = 'thermal';
let current_zoom = 'in';
let batch_labels = [];
let intervalID = setInterval(() => checkImageExists(), 5000); // poll the server every 5 seconds
const batchSize = 10;
const spans = document.getElementsByTagName('span');

function adjustButtonSize() {
    const imgDim = document.getElementsByTagName('img')[0].offsetWidth;
    const settingButtons = document.getElementsByClassName('setting-button');

    for (let i = 0; i < settingButtons.length; i++) {
        settingButtons[i].style.height = `${0.5*imgDim}px`;
    }

    for (let i = 0; i < spans.length; i++) {
        spans[i].style.width = `${0.5*imgDim}px`;
    }

    const labelButtons = document.getElementsByClassName('label-button');

    for (let i = 0; i < labelButtons.length; i++) {
        labelButtons[i].style.width = `${0.5*imgDim}px`;
    }
}

function adjustFontSize() {
    const buttons = document.getElementsByTagName('button');
    
    for (let i = 0; i < buttons.length; i++) {
        if (buttons[i].offsetHeight < buttons[i].offsetWidth) {
            const buttonHeight = buttons[i].offsetHeight;
            buttons[i].style.fontSize = `${0.6*buttonHeight}px`;    
        } else {
            const buttonWidth = buttons[i].offsetWidth;
            buttons[i].style.fontSize = `${0.6*buttonWidth}px`;    
        }
    }
    
    for (let i = 0; i < spans.length; i++) {
        const spanWidth = spans[i].offsetHeight;
        spans[i].style.fontSize = `${0.6*spanWidth}px`;
    }
}

function initiate() {
    window.addEventListener('resize', function() {
        adjustButtonSize();
        adjustFontSize();
    });    
}

function setButtonVisibility(value) {
    let buttons = document.getElementsByTagName('button');
    
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].style.visibility = value;
    }
}

function checkImageExists() {
    fetch('/check_image_exists', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify([batch, batch_identifiers])})
        .then(response => response.json())
        .then(data => {
            if (data.image_exists) {
                batch_identifiers.push(data.next_identifier);
                document.getElementById('batch message').innerText = `Batch ${batch}: Image ${current_index+1}/${batchSize}, ID = ${batch_identifiers[current_index]}`;
                document.getElementsByTagName('img')[0].style.visibility = 'visible';
                showImage();
                adjustButtonSize();
                adjustFontSize();
                setButtonVisibility('visible');
                clearInterval(intervalID); // stop checking for the path
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function getOtherModality(){
    if (current_modality == 'thermal') {
        return 'rgb';
    } 
    return 'thermal';
}

function getOtherZoom(){
    if (current_zoom == 'in') {
        return 'out';
    } 
    return 'in';
}

function setModality(modality) {
    current_modality = modality;
}

function setZoom(zoom) {
    current_zoom = zoom;
}

function showImage() {
    document.getElementsByTagName('img')[0].src = `static/images/batch-${batch}-images/${batch_identifiers[current_index]}/${current_modality}-${current_zoom}.png`;
    document.getElementById(current_modality).style.backgroundColor = 'green';
    document.getElementById(getOtherModality()).style.backgroundColor = 'gray';
    document.getElementById(current_zoom).style.backgroundColor = 'green';
    document.getElementById(getOtherZoom()).style.backgroundColor = 'gray';
}

function next() {
    current_index += 1;
    
    if (current_index < batchSize) { // next image
        current_modality = 'thermal';
        current_zoom = 'in';
        intervalID = setInterval(() => checkImageExists(), 1000); // poll the server every 1 second
    } else { // next batch
        fetch('/save_batch_labels', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify([batch, batch_identifiers, batch_labels])});

        batch += 1;
        batch_identifiers = [];
        current_index = 0;
        batch_labels = [];
        document.getElementById('batch message').innerText = `Waiting for batch ${batch}...`
        setButtonVisibility('hidden');
        document.getElementsByTagName('img')[0].style.visibility = 'hidden';
        intervalID = setInterval(() => checkImageExists(), 5000); // poll the server every 5 seconds
    }
}

function middenLabel() {
    batch_labels.push(1);
    next();
}

function emptyLabel() {
    batch_labels.push(0);
    next();
}