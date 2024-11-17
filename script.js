let video = document.getElementById('video');
let userData = {};
let isExamRunning = false;

document.getElementById('userForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Collect user details
    userData = {
        name: document.getElementById('name').value,
        age: document.getElementById('age').value,
        gender: document.getElementById('gender').value
    };

    // Hide form, start exam
    document.getElementById('userForm').style.display = 'none';
    video.style.display = 'block';

    startExam();
});

function startExam() {
    isExamRunning = true;
    startFaceDetection();
    startMicrophoneMonitoring();
    
    // Monitor for tab switching
    document.addEventListener('visibilitychange', function() {
        if (document.hidden && isExamRunning) {
            terminateExam("Tab switching detected");
        }
    });
}

// Webcam and face detection
function startFaceDetection() {
    navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
        detectFace();
    }).catch(err => {
        console.log("Error accessing webcam: " + err);
    });
}

let faceCascade;
function detectFace() {
    const constraints = { video: true };
    faceCascade = new cv.CascadeClassifier();
    faceCascade.load('haarcascade_frontalface_default.xml');

    let videoCapture = new cv.VideoCapture(video);
    let frame = new cv.Mat();

    function processFrame() {
        if (!isExamRunning) return; // Stop processing if the exam is terminated

        videoCapture.read(frame);
        let faces = new cv.RectVector();
        let gray = new cv.Mat();
        cv.cvtColor(frame, gray, cv.COLOR_RGBA2GRAY, 0);
        faceCascade.detectMultiScale(gray, faces);

        if (faces.size() == 0) {
            terminateExam("No face detected");
        } else if (faces.size() > 1) {
            terminateExam("Multiple faces detected");
        }

        gray.delete();
        faces.delete();
        setTimeout(processFrame, 1000); // Check every 1 second
    }

    processFrame();
}

// Microphone monitoring
function startMicrophoneMonitoring() {
    navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);

        analyser.fftSize = 256;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        function analyzeAudio() {
            if (!isExamRunning) return;

            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            const averageNoise = sum / dataArray.length;

            if (averageNoise > 50) {
                terminateExam("Excessive noise detected");
            }

            requestAnimationFrame(analyzeAudio);
        }

        analyzeAudio();
    }).catch(err => {
        console.log("Error accessing microphone: " + err);
    });
}

// Terminate exam function
function terminateExam(reason) {
    isExamRunning = false;
    fetch('/terminate_exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason, user: userData })
    }).then(response => response.json()).then(data => {
        document.getElementById('message').innerText = data.message;
        video.style.display = 'none'; // Hide the video after termination
    });
}
