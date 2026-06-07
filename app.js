// DOM Elements
const tickerDate = document.getElementById('ticker-date');
const tickerClock = document.getElementById('ticker-clock');
const studentNameInput = document.getElementById('student-name');
const cameraBox = document.getElementById('camera-box');
const cameraStream = document.getElementById('camera-stream');
const cameraPlaceholder = document.getElementById('camera-placeholder');
const cameraRecBadge = document.getElementById('camera-rec-badge');
const shutterFlash = document.getElementById('shutter-flash');
const btnToggleCamera = document.getElementById('btn-toggle-camera');
const btnCapture = document.getElementById('btn-capture');
const btnSubmitAttendance = document.getElementById('btn-submit-attendance');
const scriptUrlInput = document.getElementById('script-url');
const btnSaveSettings = document.getElementById('btn-save-settings');
const settingsToggle = document.getElementById('settings-toggle');
const settingsContent = document.getElementById('settings-content');
const snapshotPreviewBox = document.getElementById('snapshot-preview-box');
const snapshotPlaceholder = document.getElementById('snapshot-placeholder');
const snapshotImg = document.getElementById('snapshot-img');
const logTbody = document.getElementById('log-tbody');
const logCountBadge = document.getElementById('log-count');
const logSearch = document.getElementById('log-search');
const btnExportCsv = document.getElementById('btn-export-csv');
const imageModal = document.getElementById('image-modal');
const modalZoomImg = document.getElementById('modal-zoom-img');
const toastContainer = document.getElementById('toast-container');

// State Variables
let streamInstance = null;
let capturedBase64 = null;
let recentLogs = [];
let scriptUrl = '';

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    // Start Real-time Clock
    initClock();

    // Load Settings
    loadSettings();

    // Load Recent Attendance Logs
    loadRecentLogs();

    // Setup Event Listeners
    btnToggleCamera.addEventListener('click', toggleCamera);
    btnCapture.addEventListener('click', capturePhoto);
    document.getElementById('absensi-form').addEventListener('submit', handleAttendanceSubmit);
    settingsToggle.addEventListener('click', toggleSettingsPanel);
    btnSaveSettings.addEventListener('click', saveSettings);
    
    // Filters & Exporter listeners
    logSearch.addEventListener('input', filterLogsTable);
    btnExportCsv.addEventListener('click', exportLogsToCSV);
});

// 1. Real-time Clock & Date Ticker
function initClock() {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const updateClock = () => {
        const now = new Date();
        
        // Date formatting: Hari, DD Bulan YYYY
        const dayName = days[now.getDay()];
        const dayNum = now.getDate();
        const monthName = months[now.getMonth()];
        const year = now.getFullYear();
        tickerDate.textContent = `${dayName}, ${dayNum} ${monthName} ${year}`;

        // Clock formatting: HH:MM:SS
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        tickerClock.textContent = `${hours}:${minutes}:${seconds}`;
    };

    updateClock();
    setInterval(updateClock, 1000);
}

// 2. Camera Controls (Webcam handling)
async function toggleCamera() {
    if (streamInstance) {
        // Stop camera
        stopCamera();
        showToast('Kamera dinonaktifkan', 'info', 'Kamera ditutup secara manual.');
    } else {
        // Start camera
        btnToggleCamera.disabled = true;
        btnToggleCamera.innerHTML = `
            <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="8"></circle></svg>
            Mengaktifkan...
        `;

        try {
            const constraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            streamInstance = stream;
            cameraStream.srcObject = stream;
            cameraStream.style.display = 'block';
            cameraPlaceholder.style.display = 'none';
            cameraRecBadge.style.display = 'flex';
            cameraBox.classList.add('active');

            // Update button
            btnToggleCamera.disabled = false;
            btnToggleCamera.classList.remove('btn-secondary');
            btnToggleCamera.classList.add('btn-outline');
            btnToggleCamera.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>
                Matikan Kamera
            `;

            // Enable capture button
            btnCapture.disabled = false;
            
            showToast('Kamera Aktif', 'success', 'Preview kamera berhasil dimuat.');
        } catch (error) {
            console.error('Error accessing camera:', error);
            stopCamera();
            
            let errMsg = 'Pastikan kamera terhubung dan izin akses diberikan.';
            if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                errMsg = 'Akses kamera membutuhkan koneksi HTTPS aman.';
            }
            
            showToast('Kamera Gagal', 'error', errMsg);
        }
    }
}

function stopCamera() {
    if (streamInstance) {
        streamInstance.getTracks().forEach(track => track.stop());
        streamInstance = null;
    }
    
    cameraStream.srcObject = null;
    cameraStream.style.display = 'none';
    cameraPlaceholder.style.display = 'flex';
    cameraRecBadge.style.display = 'none';
    cameraBox.classList.remove('active');

    // Reset button
    btnToggleCamera.disabled = false;
    btnToggleCamera.classList.remove('btn-outline');
    btnToggleCamera.classList.add('btn-secondary');
    btnToggleCamera.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
        Aktifkan Kamera
    `;

    // Disable capture
    btnCapture.disabled = true;
}

// 3. Capture Photo from Video Stream
function capturePhoto() {
    if (!streamInstance) return;

    // Play Shutter Sound
    playShutterSound();

    // Create virtual canvas
    const canvas = document.createElement('canvas');
    canvas.width = cameraStream.videoWidth || 640;
    canvas.height = cameraStream.videoHeight || 480;
    const ctx = canvas.getContext('2d');

    // Mirror image drawing (matching the preview)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(cameraStream, 0, 0, canvas.width, canvas.height);

    // Convert to Base64 (JPEG format, 0.85 quality)
    capturedBase64 = canvas.toDataURL('image/jpeg', 0.85);

    // Play Shutter Flash Animation
    shutterFlash.classList.add('flash-active');
    setTimeout(() => {
        shutterFlash.classList.remove('flash-active');
    }, 400);

    // Render snapshot image preview
    snapshotImg.src = capturedBase64;
    snapshotImg.style.display = 'block';
    snapshotPlaceholder.style.display = 'none';
    snapshotPreviewBox.classList.add('has-image');

    // Enable attendance clock-in submit button
    btnSubmitAttendance.disabled = false;

    showToast('Foto Berhasil Diambil', 'info', 'Wajah berhasil ditangkap. Siap untuk absen.');
}

// 4. Submit Attendance Data
async function handleAttendanceSubmit(e) {
    e.preventDefault();

    const name = studentNameInput.value.trim();
    if (!name) {
        showToast('Validasi Gagal', 'error', 'Silakan masukkan nama mahasiswa terlebih dahulu.');
        return;
    }

    if (!capturedBase64) {
        showToast('Validasi Gagal', 'error', 'Silakan ambil foto wajah terlebih dahulu.');
        return;
    }

    // Capture Date and Time
    const now = new Date();
    const tanggalStr = now.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const jamStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    // Form data packaging
    const payload = {
        nama: name,
        tanggal: tanggalStr,
        jam: jamStr,
        foto: capturedBase64
    };

    // If Web App URL is empty, run in Simulation mode
    if (!scriptUrl) {
        showToast('Mode Simulasi', 'info', 'Merekam secara lokal. Konfigurasikan Apps Script URL untuk menyimpan ke Google Sheet.');
        
        saveLocalRecord(payload, 'Simulasi');
        resetFormAfterSubmit();
        return;
    }

    // Loading State
    setLoadingState(true);

    try {
        // Sending POST request as text/plain to avoid preflight issues
        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'text/plain'
            },
            mode: 'cors'
        });

        const result = await response.json();

        if (result.status === 'success') {
            showToast('Absensi Berhasil', 'success', `Presensi untuk ${name} berhasil disimpan.`);
            saveLocalRecord(payload, 'Sukses');
            resetFormAfterSubmit();
        } else {
            throw new Error(result.message || 'Respons gagal dari server.');
        }

    } catch (error) {
        console.warn('Google Sheet submission warning:', error);
        
        // Custom warning handling (CORS redirection opaque check)
        // If it throws TypeError on fetch response parsing but the request might have gone through,
        // we can still inform the user.
        if (error instanceof TypeError) {
            showToast('Absensi Terkirim', 'success', `Data terkirim. Jika data tidak masuk ke Google Sheet, periksa konfigurasi Apps Script Anda.`);
            saveLocalRecord(payload, 'Sukses*');
            resetFormAfterSubmit();
        } else {
            showToast('Absensi Gagal', 'error', `Gagal menghubungkan ke Google Sheet: ${error.message}`);
        }
    } finally {
        setLoadingState(false);
    }
}

// Helper: Set submit buttons loading animation
function setLoadingState(isLoading) {
    if (isLoading) {
        btnSubmitAttendance.disabled = true;
        btnSubmitAttendance.innerHTML = `
            <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite; margin-right: 0.5rem;"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="8"></circle></svg>
            Menyimpan Ke Google Sheets...
        `;
        studentNameInput.disabled = true;
        btnToggleCamera.disabled = true;
        btnCapture.disabled = true;
    } else {
        btnSubmitAttendance.disabled = false;
        btnSubmitAttendance.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Absen Masuk
        `;
        studentNameInput.disabled = false;
        btnToggleCamera.disabled = false;
        btnCapture.disabled = !streamInstance;
    }
}

// Reset form and photo selections after successful clock-in
function resetFormAfterSubmit() {
    // Clear inputs (keep the name for convenience if they have multiple scans? Usually clear is better)
    studentNameInput.value = '';
    
    // Clear snapshot
    capturedBase64 = null;
    snapshotImg.src = '';
    snapshotImg.style.display = 'none';
    snapshotPlaceholder.style.display = 'block';
    snapshotPreviewBox.classList.remove('has-image');
    
    // Disable submit
    btnSubmitAttendance.disabled = true;
}

// 5. Config/Settings Panel
function toggleSettingsPanel() {
    settingsToggle.classList.toggle('expanded');
    settingsContent.classList.toggle('expanded');
}

function loadSettings() {
    const savedUrl = localStorage.getItem('absensi_script_url');
    if (savedUrl) {
        scriptUrl = savedUrl;
        scriptUrlInput.value = savedUrl;
    }
}

function saveSettings() {
    const url = scriptUrlInput.value.trim();
    if (url && !url.startsWith('https://script.google.com/')) {
        showToast('Konfigurasi Gagal', 'error', 'URL harus mengarah ke Google Apps Script (https://script.google.com/...)');
        return;
    }
    
    scriptUrl = url;
    localStorage.setItem('absensi_script_url', url);
    showToast('Konfigurasi Disimpan', 'success', 'Google Apps Script URL berhasil diupdate.');
    
    // Automatically collapse after saving
    toggleSettingsPanel();
}

// 6. Local Storage Records & History Rendering
function loadRecentLogs() {
    const savedLogs = localStorage.getItem('absensi_recent_logs');
    if (savedLogs) {
        recentLogs = JSON.parse(savedLogs);
    }
    renderLogsTable();
}

function saveLocalRecord(payload, status) {
    const newRecord = {
        id: Date.now(),
        nama: payload.nama,
        tanggal: payload.tanggal,
        jam: payload.jam,
        foto: payload.foto,
        status: status
    };

    // Keep only last 20 logs
    recentLogs.unshift(newRecord);
    if (recentLogs.length > 20) {
        recentLogs.pop();
    }

    localStorage.setItem('absensi_recent_logs', JSON.stringify(recentLogs));
    renderLogsTable();
}

function renderLogsTable() {
    logCountBadge.textContent = recentLogs.length;
    updateStatsCounters();

    if (recentLogs.length === 0) {
        logTbody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">Belum ada absensi untuk hari ini.</td>
            </tr>
        `;
        return;
    }

    logTbody.innerHTML = '';
    recentLogs.forEach(log => {
        const tr = document.createElement('tr');
        
        // Determine badge class
        let badgeClass = 'pending';
        let statusText = log.status;
        if (log.status.startsWith('Sukses')) {
            badgeClass = 'success';
            statusText = 'Sukses';
        } else if (log.status === 'Simulasi') {
            badgeClass = 'pending';
            statusText = 'Simulasi';
        }

        tr.innerHTML = `
            <td>
                <img src="${log.foto}" alt="Wajah" class="table-thumbnail" onclick="zoomImage('${log.foto}')">
            </td>
            <td style="font-weight: 600;">${escapeHTML(log.nama)}</td>
            <td>
                <div style="font-weight: 500;">${log.jam}</div>
                <div style="font-size: 0.75rem; color: var(--color-text-muted);">${log.tanggal}</div>
            </td>
            <td>
                <span class="status-badge ${badgeClass}">${statusText}</span>
            </td>
        `;
        logTbody.appendChild(tr);
    });
}

// Helper: Escape HTML to prevent XSS
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// 7. Zoom Image in Modal
window.zoomImage = function(imgSrc) {
    modalZoomImg.src = imgSrc;
    imageModal.classList.add('show');
};

window.closeModal = function() {
    imageModal.classList.remove('show');
    // Clear src after fade transition
    setTimeout(() => {
        modalZoomImg.src = '';
    }, 300);
};

// 8. Custom Toast Notification Manager
function showToast(title, type = 'info', description = '') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Choose icon based on type
    let iconSvg = '';
    if (type === 'success') {
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    } else { // info
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
        <div class="toast-icon">${iconSvg}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            ${description ? `<div class="toast-desc">${description}</div>` : ''}
        </div>
        <button type="button" class="toast-close" aria-label="Close toast">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
    `;

    // Append to container
    toastContainer.appendChild(toast);

    // Trigger animation frame to slides in
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Close on click close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        removeToast(toast);
    });

    // Auto dismiss after 4 seconds
    setTimeout(() => {
        removeToast(toast);
    }, 4500);
}

function removeToast(toast) {
    if (!toast.parentNode) return;
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    });
}

// Spin animations style injector (for loaders)
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// 9. Premium Audio Synthesizer Shutter Sound (Web Audio API)
function playShutterSound() {
    const isSoundEnabled = document.getElementById('shutter-sound-toggle').checked;
    if (!isSoundEnabled) return;
    
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // click noise texture
        const bufferSize = audioCtx.sampleRate * 0.1;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noiseNode = audioCtx.createBufferSource();
        noiseNode.buffer = buffer;
        
        const noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 1200;
        noiseFilter.Q.value = 3;
        
        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        
        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        
        // mechanical mechanical tone
        const osc = audioCtx.createOscillator();
        const oscGain = audioCtx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.12);
        
        oscGain.gain.setValueAtTime(0.35, audioCtx.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
        
        osc.connect(oscGain);
        oscGain.connect(audioCtx.destination);
        
        // play
        noiseNode.start();
        osc.start();
        noiseNode.stop(audioCtx.currentTime + 0.12);
        osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
        console.warn('Web Audio click sound blocked by browser autoplay policy or unsupported:', e);
    }
}

// 10. Dashboard Stats counter recalculator
function updateStatsCounters() {
    const total = recentLogs.length;
    const sukses = recentLogs.filter(log => log.status.startsWith('Sukses')).length;
    const simulasi = recentLogs.filter(log => log.status === 'Simulasi').length;

    const statTotal = document.getElementById('stat-total');
    const statSukses = document.getElementById('stat-sukses');
    const statSimulasi = document.getElementById('stat-simulasi');

    if (statTotal) statTotal.textContent = total;
    if (statSukses) statSukses.textContent = sukses;
    if (statSimulasi) statSimulasi.textContent = simulasi;
}

// 11. Search query client-side filtering
function filterLogsTable() {
    const query = logSearch.value.toLowerCase().trim();
    const rows = logTbody.querySelectorAll('tr');
    
    if (recentLogs.length === 0) return;

    let matchCount = 0;
    
    // Remove old empty search indicator if exists
    const oldSearchEmpty = logTbody.querySelector('.search-empty-state');
    if (oldSearchEmpty) oldSearchEmpty.remove();

    rows.forEach(row => {
        if (row.classList.contains('search-empty-state')) return;
        
        const nameCell = row.querySelector('td:nth-child(2)');
        if (nameCell) {
            const nameText = nameCell.textContent.toLowerCase();
            if (nameText.includes(query)) {
                row.style.display = '';
                matchCount++;
            } else {
                row.style.display = 'none';
            }
        }
    });

    if (matchCount === 0 && query !== '') {
        const emptyTr = document.createElement('tr');
        emptyTr.className = 'search-empty-state';
        emptyTr.innerHTML = `<td colspan="4" class="empty-state">Nama "${escapeHTML(query)}" tidak ditemukan.</td>`;
        logTbody.appendChild(emptyTr);
    }
}

// 12. Export History logs list as CSV file
function exportLogsToCSV() {
    if (recentLogs.length === 0) {
        showToast('Ekspor Gagal', 'error', 'Tidak ada data absensi untuk diekspor.');
        return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Nama,Tanggal,Jam,Status\n';

    recentLogs.forEach(log => {
        let status = log.status.startsWith('Sukses') ? 'Sukses' : log.status;
        csvContent += `"${log.nama.replace(/"/g, '""')}","${log.tanggal}","${log.jam}","${status}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filename = `Absensi_Wajah_${new Date().toISOString().slice(0,10)}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Ekspor Berhasil', 'success', `Riwayat absensi diunduh sebagai ${filename}`);
}

