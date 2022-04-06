document.addEventListener('DOMContentLoaded', function () {

const WIDTH = 500;
const HEIGHT = 500;

const elementStart = document.querySelector('#start');
const container = document.querySelector('#container');
const inputX = document.querySelector('#x');
const inputY = document.querySelector('#y')
const valueX = document.querySelector('#x-value');
const valueY = document.querySelector('#y-value');
const inputFx = document.querySelector('#fx');
const elementError = document.querySelector('#error');
const canvas = document.querySelector('canvas');
const canvasCtx = canvas.getContext("2d");

let hash = window.location.hash.substring(1);
let sharedFx = decodeURIComponent(hash);
if (sharedFx.length > 0) {
    let parts = sharedFx.split('#');
    inputFx.value = parts[0]
    inputX.value = parseInt(parts[1] || 128);
    inputY.value = parseInt(parts[2] || 128);
}

function updateHash(fx, x, y) {
    window.location.hash = encodeURIComponent(fx + '#' + x + '#' + y);
}

const main = async function () {

    container.style.display = 'block';
    elementStart.style.display = 'none';

    const audioContext = new AudioContext()

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    let bufferLength = analyser.frequencyBinCount;
    let dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    await audioContext.audioWorklet.addModule('random-noise-processor.js')
    const processorNode = new AudioWorkletNode(audioContext, 'random-noise-processor')
    processorNode.connect(audioContext.destination)
    processorNode.connect(analyser);
    processorNode.port.onmessage = (e) => {
        const message = e.data;
        elementError.style.display = message.success ? 'none' : 'inline';
    }
    processorNode.port.postMessage(inputFx.value);

    
    processorNodeX = processorNode.parameters.get("x");
    inputXListener = function () {
        valueX.textContent = (inputX.valueAsNumber/100).toFixed(2).replace('.', '');
        processorNodeX.setValueAtTime(inputX.valueAsNumber, audioContext.currentTime);  
        updateHash(inputFx.value, inputX.valueAsNumber, inputY.valueAsNumber);  
    };
    inputX.addEventListener('input', inputXListener);
    inputXListener();

    processorNodeY = processorNode.parameters.get("y");
    inputYListener = function () {
        valueY.textContent = (inputY.valueAsNumber/100).toFixed(2).replace('.', '');
        processorNodeY.setValueAtTime(inputY.valueAsNumber, audioContext.currentTime); 
        updateHash(inputFx.value, inputX.valueAsNumber, inputY.valueAsNumber);   
    };
    inputY.addEventListener('input', inputYListener);
    inputYListener();

    inputFx.addEventListener('change', function () {
        updateHash(inputFx.value, inputX.valueAsNumber, inputY.valueAsNumber);
        processorNode.port.postMessage(inputFx.value);
    });

    function init() {
        navigator
            .mediaDevices
            .getUserMedia({audio: true})
            .then(gotStream)
            .catch(function (error) {
                console.error(error);
            });
    }
    init();

    function gotStream(stream) {
        let source = audioContext.createMediaStreamSource(stream);
        source.connect(processorNode);
    }

    function draw() {
        requestAnimationFrame(draw);

        analyser.getByteTimeDomainData(dataArray);

        canvasCtx.fillStyle = 'rgb(200, 200, 200)';
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT); 
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
        canvasCtx.beginPath();
        
        const sliceWidth = WIDTH * 1.0 / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            let v = dataArray[i] / 128.0;
            let y = v * HEIGHT / 2;

            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }
        
        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
    }
    draw();

}
elementStart.addEventListener('click', main);
});
