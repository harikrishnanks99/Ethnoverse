document.addEventListener('DOMContentLoaded', () => {
    // Helper function to set up file upload drop zone functionality
    function setupDropZone(dropZoneId, fileInputId, progressBarId, progressTextId) {
        const dropZone = document.getElementById(dropZoneId);
        const fileInput = document.getElementById(fileInputId);
        const browseButton = dropZone.querySelector('.upload-button');
        const progressBar = document.getElementById(progressBarId);
        const progressText = document.getElementById(progressTextId);

        if (!dropZone || !fileInput || !browseButton || !progressBar || !progressText) {
            console.error(`One or more elements not found for drop zone setup: ${dropZoneId}`);
            return;
        }

        // Simulate file upload progress
        const simulateUpload = (file, progressElement, textElement, callback) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                if (progress <= 100) {
                    progressElement.style.width = `${progress}%`;
                    textElement.textContent = `${progress}%`;
                } else {
                    clearInterval(interval);
                    textElement.textContent = `Upload Complete!`;
                    if (callback) callback();
                    // Reset after a short delay for next upload
                    setTimeout(() => {
                        progressElement.style.width = '0%';
                        textElement.textContent = '0%';
                    }, 2000);
                }
            }, 200); // Adjust speed of simulation
        };

        // Click to browse files
        browseButton.addEventListener('click', () => {
            fileInput.click();
        });

        // Handle file selection via input
        fileInput.addEventListener('change', (event) => {
            const files = event.target.files;
            if (files.length > 0) {
                console.log(`Selected files for ${dropZoneId}:`, files);
                simulateUpload(files[0], progressBar, progressText);
            }
        });

        // Drag and drop functionality
        dropZone.addEventListener('dragover', (event) => {
            event.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', (event) => {
            event.preventDefault();
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (event) => {
            event.preventDefault();
            dropZone.classList.remove('drag-over');
            const files = event.dataTransfer.files;
            if (files.length > 0) {
                console.log(`Dropped files for ${dropZoneId}:`, files);
                // Assign files to the hidden input for potential form submission
                fileInput.files = files;
                simulateUpload(files[0], progressBar, progressText);
            }
        });
    }

    // Setup for Audio Upload Drop Zone
    setupDropZone('audioDropZone', 'audioFileInput', 'audioProgressBar', 'audioProgressText');

    // Setup for Handwritten Notes Upload Drop Zone
    setupDropZone('notesDropZone', 'notesFileInput', 'notesProgressBar', 'notesProgressText');


    // --- Audio Recording Functionality ---
    const recordAudioButton = document.getElementById('recordAudioButton');
    const recordingStatus = document.getElementById('recordingStatus');
    const recordingTimer = document.getElementById('recordingTimer');
    const audioPlayback = document.getElementById('audioPlayback');
    const uploadRecordedAudioButton = document.getElementById('uploadRecordedAudioButton');
    const audioProgressBar = document.getElementById('audioProgressBar'); // Re-use existing progress bar
    const audioProgressText = document.getElementById('audioProgressText'); // Re-use existing progress text

    let mediaRecorder;
    let audioChunks = [];
    let audioBlob;
    let timerInterval;
    let seconds = 0;

    // Function to update the timer display
    function updateTimer() {
        seconds++;
        const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
        const remainingSeconds = String(seconds % 60).padStart(2, '0');
        recordingTimer.textContent = `${minutes}:${remainingSeconds}`;
    }

    // Start recording
    recordAudioButton.addEventListener('click', async () => {
        if (recordAudioButton.textContent.includes('Start Recording')) {
            // Request microphone access
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                seconds = 0;

                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); // Use webm for broader browser support
                    const audioUrl = URL.createObjectURL(audioBlob);
                    audioPlayback.src = audioUrl;
                    audioPlayback.style.display = 'block';
                    uploadRecordedAudioButton.style.display = 'inline-block'; // Show upload button
                    // Stop stream tracks
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();
                recordAudioButton.textContent = 'Stop Recording';
                recordAudioButton.classList.add('recording');
                recordingStatus.style.display = 'flex'; // Show recording status
                audioPlayback.style.display = 'none'; // Hide player while recording
                uploadRecordedAudioButton.style.display = 'none'; // Hide upload button
                recordingTimer.textContent = '00:00'; // Reset timer display
                timerInterval = setInterval(updateTimer, 1000); // Start timer

                console.log('Recording started...');
            } catch (err) {
                console.error('Error accessing microphone:', err);
                alert('Could not access microphone. Please ensure it is connected and permissions are granted.');
            }
        } else {
            // Stop recording
            mediaRecorder.stop();
            clearInterval(timerInterval); // Stop the timer
            recordAudioButton.textContent = 'Start Recording';
            recordAudioButton.classList.remove('recording');
            recordingStatus.style.display = 'none'; // Hide recording status
            console.log('Recording stopped.');
        }
    });

    // Upload recorded audio
    uploadRecordedAudioButton.addEventListener('click', () => {
        if (audioBlob) {
            console.log('Uploading recorded audio:', audioBlob);
            // Simulate upload with the existing progress bar
            // We create a dummy File object for the simulateUpload function
            const recordedFile = new File([audioBlob], `recorded_audio_${Date.now()}.webm`, { type: audioBlob.type });
            setupDropZone.simulateUpload(recordedFile, audioProgressBar, audioProgressText, () => {
                // Callback after simulated upload completes
                audioPlayback.style.display = 'none'; // Hide player
                uploadRecordedAudioButton.style.display = 'none'; // Hide button
                audioBlob = null; // Clear recorded audio
            });
        }
    });

    // --- Override simulateUpload for direct usage (if needed outside dropzone setup) ---
    // This allows the uploadRecordedAudioButton to use the existing simulateUpload logic
    // We need to make simulateUpload accessible or re-implement for the button.
    // For simplicity, let's make it a global-like function for this example.
    window.simulateUploadProgress = (file, progressElement, textElement, callback) => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            if (progress <= 100) {
                progressElement.style.width = `${progress}%`;
                textElement.textContent = `${progress}%`;
            } else {
                clearInterval(interval);
                textElement.textContent = `Upload Complete!`;
                if (callback) callback();
                setTimeout(() => {
                    progressElement.style.width = '0%';
                    textElement.textContent = '0%';
                }, 2000);
            }
        }, 200);
    };

    // Correcting the uploadRecordedAudioButton click listener to use the global-like function
    uploadRecordedAudioButton.addEventListener('click', () => {
        if (audioBlob) {
            console.log('Uploading recorded audio:', audioBlob);
            const recordedFile = new File([audioBlob], `recorded_audio_${Date.now()}.webm`, { type: audioBlob.type });
            window.simulateUploadProgress(recordedFile, audioProgressBar, audioProgressText, () => {
                audioPlayback.style.display = 'none';
                uploadRecordedAudioButton.style.display = 'none';
                audioBlob = null;
            });
        }
    });
});