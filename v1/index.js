const WIDTH = 500;
const HEIGHT = 500;

// HTML elements
const elementStart = document.querySelector('#start');
const elementContainer = document.querySelector('#container');
const elementSliderX = document.querySelector('#x');
const elementSliderY = document.querySelector('#y')
const elementSliderVolume = document.querySelector('#volume')
const elementValueX = document.querySelector('#x-value');
const elementValueY = document.querySelector('#y-value');
const elementInputFx = document.querySelector('#fx');
const elementError = document.querySelector('#error');
const elementCanvas = document.querySelector('canvas');
const canvasContext = elementCanvas.getContext("2d");

// Load hash data
const hash = window.location.hash.substring(1);
const sharedFx = decodeURIComponent(hash);
if (sharedFx.length > 0) {
    const parts = sharedFx.split('#');
    elementInputFx.value = parts[0]
    elementSliderX.value = parseInt(parts[1] || 128);
    elementSliderY.value = parseInt(parts[2] || 128);
}

function updateHash(fx, x, y) {
    window.location.hash = encodeURIComponent(fx + '#' + x + '#' + y);
}

elementStart.addEventListener('click', async () => {

    // Start button action
    elementContainer.style.display = 'block';
    elementStart.style.display = 'none';

    const audioContext = new AudioContext()

    // Gain
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNode.gain.setValueAtTime(elementSliderVolume.valueAsNumber / 100, audioContext.currentTime)
    elementSliderVolume.addEventListener('input', () => gainNode.gain.setValueAtTime(elementSliderVolume.valueAsNumber / 100, audioContext.currentTime));

    // Analyser
    const analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 1024;
    const frequencyBufferLength = analyserNode.frequencyBinCount;
    const timeDomainDataArray = new Uint8Array(frequencyBufferLength);
    const frequencyDataArray = new Uint8Array(frequencyBufferLength)

    // Audio Worklet
    await audioContext.audioWorklet.addModule('random-noise-processor.js?v1')
    const processorNode = new AudioWorkletNode(audioContext, 'random-noise-processor')
    processorNode.connect(gainNode);
    processorNode.connect(analyserNode);
    processorNode.port.onmessage = (event) => {
        const message = event.data;
        elementError.style.display = message.success ? 'none' : 'inline';
    }
    processorNode.port.postMessage(elementInputFx.value);

    inputXListener = () => {
        elementValueX.textContent = (elementSliderX.valueAsNumber / 100).toFixed(2).replace('.', '');
        const processorNodeParamX = processorNode.parameters.get('x');
        processorNodeParamX.setValueAtTime(elementSliderX.valueAsNumber, audioContext.currentTime);
    };
    elementSliderX.addEventListener('input', inputXListener);
    elementSliderX.addEventListener('change', () => updateHash(elementInputFx.value, elementSliderX.valueAsNumber, elementSliderY.valueAsNumber));
    inputXListener();

    inputYListener = () => {
        elementValueY.textContent = (elementSliderY.valueAsNumber / 100).toFixed(2).replace('.', '');
        const processorNodeParamY = processorNode.parameters.get('y');
        processorNodeParamY.setValueAtTime(elementSliderY.valueAsNumber, audioContext.currentTime); 
    };
    elementSliderY.addEventListener('input', inputYListener);
    elementSliderY.addEventListener('change', () => updateHash(elementInputFx.value, elementSliderX.valueAsNumber, elementSliderY.valueAsNumber));
    inputYListener();

    elementInputFx.addEventListener('change', () => {
        updateHash(elementInputFx.value, elementSliderX.valueAsNumber, elementSliderY.valueAsNumber);
        processorNode.port.postMessage(elementInputFx.value);
    });

    // Microphone
    try {
        let microphoneStream = await navigator.mediaDevices.getUserMedia({audio: true});
        let microphoneSource = audioContext.createMediaStreamSource(microphoneStream);
        microphoneSource.connect(processorNode);
    } catch (error) {
        console.error(error);
    }

    // Analyser visual output
    canvasContext.fillStyle = 'rgb(0, 0, 0)';
    canvasContext.fillRect(0, 0, WIDTH, HEIGHT); 
    let frame = 0;
    function draw() {
        requestAnimationFrame(draw);
        frame++;

        analyserNode.getByteTimeDomainData(timeDomainDataArray);
        analyserNode.getByteFrequencyData(frequencyDataArray);

        canvasContext.fillStyle = 'rgba(0, 0, 0, 0.2)';
        canvasContext.fillRect(0, 0, WIDTH, HEIGHT); 

        canvasContext.lineWidth = 2;
        canvasContext.strokeStyle = 'hsl(' + (frame * 5) % 360 + ', 100%, 50%)';
        canvasContext.beginPath();
        
        // Draw the time domain chart.
        const sliceWidth = WIDTH * 1.0 / frequencyBufferLength;
        let x = 0;
        for (let i = 0; i < frequencyBufferLength; i++) {
            let v = timeDomainDataArray[i] / 128.0;
            let y = v * HEIGHT / 2;
            if (i === 0) {
                canvasContext.moveTo(x, y);
            } else {
                canvasContext.lineTo(x, y);
            }
            x += sliceWidth;
        }

        canvasContext.lineTo(elementCanvas.width, elementCanvas.height / 2);
        canvasContext.stroke();
    }
    draw();

});
