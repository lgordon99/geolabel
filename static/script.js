// global variables
let batch = 1;
let batchIdentifiers = [];
let currentIndex = 0;
let currentModality = 'thermal';
let currentZoom = 'in';
let batchLabels = [];
let batchInterval = 0;
let demo = false;
let imageFolderName = 'images';
const batchSize = 10;
const spans = document.getElementsByClassName('modality-span');

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

function setBatchMessage() {
    document.getElementById('starting-options').style.display = 'none';
    document.getElementById('batch-message').innerText = `Waiting for batch ${batch}...`;
    document.getElementById('batch-message').style.visibility = 'visible';
}

function getStartingBatchNumber() {
    fetch('/get-starting-batch-number')
    .then(response => response.json())
    .then(data => {
        batch = data.batch_number;
        setBatchMessage();
    });
}

function updateBatch() {
    fetch('/update-batch', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify([imageFolderName, batch, batchIdentifiers])})
        .then(response => response.json())
        .then(data => batchIdentifiers = data.batch_identifiers);
}

function checkImageExists() {
    let nextImageExists = batchIdentifiers.length > currentIndex;

    if (nextImageExists) {
        showImage();
    } else {
        setTimeout(checkImageExists, 100);
    }
}

function startLabeling() {
    fetch('/run-cnn');
    getStartingBatchNumber();
    batchInterval = setInterval(() => updateBatch(), 100);
    checkImageExists();
}

function initiate() {
    adjustButtonSize();
    adjustFontSize();

    window.addEventListener('resize', function() {
        adjustButtonSize();
        adjustFontSize();
    });

    document.getElementById('code').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
          if (this.value == 'nnjOBaem54') { // if the user enters the right code
              startLabeling();
          } else {
              document.getElementById('result').innerText = 'The code you entered is incorrect.';
          }
        }
      });
    
    window.addEventListener('beforeunload', function (e) { // upon window close
        if (!demo) {
            fetch('/stop-cnn');
        }
    });
}

function activateDemo() {
    demo = true;
    imageFolderName = 'demo-images';
    setBatchMessage();
    setTimeout(function() {
        updateBatch();
    }, 3000);
    checkImageExists();
}

function setButtonVisibility(value) {
    let buttons = document.getElementsByTagName('button');
    
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].style.visibility = value;
    }
}

function getOtherModality(){
    if (currentModality == 'thermal') {
        return 'rgb';
    }

    return 'thermal';
}

function getOtherZoom(){
    if (currentZoom == 'in') {
        return 'out';
    }

    return 'in';
}

function setModality(modality) {
    currentModality = modality;
}

function setZoom(zoom) {
    currentZoom = zoom;
}

function showImage() {
    document.getElementById('batch-message').innerText = `Batch ${batch}: Image ${currentIndex+1}/${batchSize}, ID = ${batchIdentifiers[currentIndex]}`;
    document.getElementsByTagName('img')[0].src = `static/${imageFolderName}/batch-${batch}-images/${batchIdentifiers[currentIndex]}/${currentModality}-${currentZoom}.png`;
    document.getElementsByTagName('img')[0].style.visibility = 'visible';
    document.getElementById(currentModality).style.backgroundColor = 'green';
    document.getElementById(getOtherModality()).style.backgroundColor = 'gray';
    document.getElementById(currentZoom).style.backgroundColor = 'green';
    document.getElementById(getOtherZoom()).style.backgroundColor = 'gray';
    setButtonVisibility('visible');
}

function reset() {
    batch += 1;
    batchIdentifiers = [];
    currentIndex = 0;
    batchLabels = [];
    document.getElementById('batch-message').innerText = `Waiting for batch ${batch}...`;
    setButtonVisibility('hidden');
    document.getElementsByTagName('img')[0].style.visibility = 'hidden';
}

function next() {
    currentIndex += 1;

    if (currentIndex < batchSize) { // next image
        currentModality = 'thermal';
        currentZoom = 'in';
    } else { // next batch
        if (demo) {
            reset();
            setTimeout(function() {
                updateBatch();
            }, 3000);
        } else {
            clearInterval(batchInterval);

            fetch('/save-batch-labels', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify([batch, batchIdentifiers, batchLabels])})
            .then(response => response.text())
            .then(() => {
                reset();
                batchInterval = setInterval(() => updateBatch(), 100);
            });
        }
    }

    checkImageExists();
}

function middenLabel() {
    batchLabels.push(1);
    next();
}

function emptyLabel() {
    batchLabels.push(0);
    next();
}
