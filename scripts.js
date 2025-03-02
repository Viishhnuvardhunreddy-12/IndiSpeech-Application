document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('speech-form');
    const recordBtn = document.getElementById('record-btn');
    const stopBtn = document.getElementById('stop-btn');
    const recognizedText = document.getElementById('recognized-text');
    const translatedText = document.getElementById('translated-text');
    const translatedAudio = document.getElementById('translated-audio');

    let recognition;
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;  // Stop after one phrase
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.addEventListener('start', () => {
            recordBtn.disabled = true;
            stopBtn.disabled = false;
            recognizedText.textContent = "Recording... Please speak.";
            recordBtn.classList.add('recording');
        });

        recognition.addEventListener('end', () => {
            recordBtn.disabled = false;
            stopBtn.disabled = true;
            recordBtn.classList.remove('recording');
        });

        recognition.addEventListener('error', (event) => {
            recognizedText.textContent = `Error: ${event.error}`;
            recordBtn.disabled = false;
            stopBtn.disabled = true;
        });
    } else {
        alert("Your browser does not support speech recognition!");
    }

    recordBtn.addEventListener('click', () => {
        if (recognition) {
            recognition.start();
        }
    });

    stopBtn.addEventListener('click', () => {
        if (recognition) {
            recognition.stop();
        }
    });

    recognition?.addEventListener('result', (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            finalTranscript += event.results[i][0].transcript;
        }
        recognizedText.textContent = finalTranscript;

        const formData = new FormData();
        formData.append('language', document.getElementById('language').value);
        formData.append('recognized_text', finalTranscript);

        fetch('/process_voice', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                recognizedText.textContent = `Error: ${data.error}`;
            } else {
                translatedText.textContent = data.translated_text;
                
                const audioFile = data.audio_file ? data.audio_file.split('/').pop() : null;
                if (audioFile) {
                    translatedAudio.src = `/outputs/${audioFile}?t=${new Date().getTime()}`;
                    translatedAudio.style.display = "block";
                    translatedAudio.load();
                    translatedAudio.play();
                } else {
                    recognizedText.textContent = "Error: Audio file not found!";
                }
            }
        })
        .catch(err => {
            recognizedText.textContent = `Error: ${err.message}`;
        });
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        try {
            const response = await fetch('/process', { method: 'POST', body: formData });
            const data = await response.json();

            if (data.error) {
                recognizedText.textContent = `Error: ${data.error}`;
            } else {
                recognizedText.textContent = data.recognized_text;
                translatedText.textContent = data.translated_text;

                const audioFile = data.audio_file ? data.audio_file.split('/').pop() : null;
                if (audioFile) {
                    translatedAudio.src = `/outputs/${audioFile}?t=${new Date().getTime()}`;
                    translatedAudio.style.display = "block";
                    translatedAudio.load();
                    translatedAudio.play();
                } else {
                    recognizedText.textContent = "Error: Audio file not found!";
                }
            }
        } catch (error) {
            recognizedText.textContent = `Error: ${error.message}`;
        }
    });

    const video = document.getElementById("bg-video");
    if (video) {
        video.addEventListener("timeupdate", function () {
            if (video.currentTime >= video.duration - 0.1) {
                video.currentTime = 0.01; // Skip to the beginning slightly before end
                video.play();
            }
        });
    }
});
