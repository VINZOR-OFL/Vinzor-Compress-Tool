// --- MODULE: Main Application Controller & UI State ---

let uploadedFiles = [];
let fileCounter = 0;
let currentCropper = null;
let activeCropId = null;
let deferredPrompt = null;

// Safe PWA Initialization
(function initPWA() {
  try {
    const manifest = {
      name: "Smart Image Studio Pro",
      short_name: "ImageStudio",
      description: "Govt Exam Presets, AI Background Remover & Batch Photo Resizer",
      start_url: window.location.href,
      display: "standalone",
      background_color: "#0f172a",
      theme_color: "#6366f1",
      icons: [{
        src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%236366f1'/%3E%3Ccircle cx='50' cy='50' r='24' stroke='white' stroke-width='6' fill='none'/%3E%3Ccircle cx='50' cy='50' r='12' fill='%23fcd34d'/%3E%3Cpath d='M24 38 L34 26 H66 L76 38' stroke='white' stroke-width='5' stroke-linecap='round' fill='none'/%3E%3C/svg%3E",
        sizes: "192x192 512x512",
        type: "image/svg+xml",
        purpose: "any maskable"
      }]
    };
    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = URL.createObjectURL(blob);
    document.head.appendChild(link);

    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.protocol === 'http:')) {
      const sw = `self.addEventListener('install', e=>self.skipWaiting());self.addEventListener('activate', e=>clients.claim());self.addEventListener('fetch', e=>e.respondWith(fetch(e.request).catch(()=>caches.match(e.request))));`;
      navigator.serviceWorker.register(URL.createObjectURL(new Blob([sw], {type: 'text/javascript'}))).catch(()=>{});
    }
  } catch (err) {
    console.warn("PWA registration offline/local:", err);
  }
})();

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('installAppBtn');
  if (btn) btn.style.display = 'inline-flex';
});

function triggerAppInstall() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((r) => {
      if (r.outcome === 'accepted') {
        const btn = document.getElementById('installAppBtn');
        if (btn) btn.style.display = 'none';
      }
      deferredPrompt = null;
    });
  } else {
    alert('To install this app on PC/Phone:\n\n1. Click the Install Icon (monitor with arrow) in your browser address bar at the top right.\n2. Or open browser menu (⋮) -> Select "Install Smart Image Studio Pro" / "Add to Home screen".');
  }
}

function setStatus(msg) {
  const el = document.getElementById('statusMsg');
  if (el) {
    if (msg) { el.style.display = 'block'; el.innerText = msg; }
    else { el.style.display = 'none'; }
  }
}

function switchTab(tabId, btn) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(tabId);
  if (target) target.classList.add('active');
  if (btn) btn.classList.add('active');
}

// Drag & Drop Setup
window.addEventListener("dragover", e => e.preventDefault());
window.addEventListener("drop", e => e.preventDefault());

document.addEventListener('DOMContentLoaded', () => {
  const dropzone = document.getElementById('dropzone');
  if (dropzone) {
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', (e) => { e.preventDefault(); dropzone.classList.remove('dragover'); });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) handleFiles(Array.from(e.dataTransfer.files));
    });
  }

  const fileInput = document.getElementById('fileInput');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) handleFiles(Array.from(e.target.files));
    });
  }
});

function handleFiles(files) {
  files.forEach((file) => {
    if (!file.type.startsWith('image/')) return;
    fileCounter++;
    const currentId = fileCounter;

    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        uploadedFiles.push({
          id: currentId,
          file: file,
          img: img,
          name: file.name,
          originalSize: file.size,
          src: event.target.result,
          processedBlob: null,
          downloadUrl: null
        });
        renderInitialCard(file, event.target.result, currentId);
        setStatus(`Total ${uploadedFiles.length} file(s) in queue. Choose settings and click Compress.`);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.value = '';
}

function renderInitialCard(file, src, id) {
  const list = document.getElementById('fileList');
  if (!list) return;
  const card = document.createElement('div');
  card.className = 'file-card';
  card.id = `card-${id}`;

  card.innerHTML = `
    <div class="file-info">
      <img src="${src}" class="file-thumb" id="thumb-${id}">
      <div class="file-details">
        <span class="file-name">${file.name}</span>
        <span class="file-meta">Original: ${formatBytes(file.size)}</span>
      </div>
    </div>
    <div class="action-btns">
      <button class="btn-sm btn-clear" onclick="openCropModal(${id})">✂️ Crop</button>
      <span class="badge-status badge-warn">Ready</span>
    </div>
  `;
  list.appendChild(card);
}

function resetAllOptions() {
  document.getElementById('examPreset').value = 'custom';
  document.getElementById('sizeTarget').value = '200';
  document.getElementById('customWidth').value = '';
  document.getElementById('customHeight').value = '';
  document.getElementById('dimUnit').value = 'px';
  document.getElementById('fitMode').value = 'stretch';
  document.getElementById('customKbInput').value = '';
  document.getElementById('formatSelect').value = 'image/jpeg';
  document.getElementById('bgMode').value = 'none';
  document.getElementById('customBgPicker').value = '#ffffff';
  document.getElementById('customColorGroup').style.display = 'none';
  document.getElementById('bgEngine').value = 'ai';
  document.getElementById('edgeFeather').value = '2';
  document.getElementById('featherVal').innerText = '2px';
  document.getElementById('stampName').value = '';
  document.getElementById('stampDate').value = '';
  document.getElementById('stampLabelPrefix').value = 'DOP: ';
  document.getElementById('enableStamp').value = 'no';
  document.getElementById('sigCleaner').value = 'off';
  document.getElementById('colorFilter').value = 'none';
  document.getElementById('filePrefix').value = 'optimized_doc';

  setStatus('🔄 All options reset to default values.');
}

function clearAllFiles() {
  uploadedFiles.forEach(f => { if (f.downloadUrl) URL.revokeObjectURL(f.downloadUrl); });
  uploadedFiles = [];
  const list = document.getElementById('fileList');
  if (list) list.innerHTML = '';
  setStatus('Queue cleared.');
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  if (bytes < 1024) return bytes + ' Bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(2) + ' MB';
}

function openCropModal(id) {
  activeCropId = id;
  const item = uploadedFiles.find(f => f.id === id);
  if (!item) return;

  const modal = document.getElementById('cropModal');
  const img = document.getElementById('cropTargetImage');
  img.src = item.src;
  modal.style.display = 'flex';

  if (currentCropper) currentCropper.destroy();
  currentCropper = new Cropper(img, { aspectRatio: NaN, viewMode: 1 });
}

function closeCropModal() {
  const modal = document.getElementById('cropModal');
  if (modal) modal.style.display = 'none';
  if (currentCropper) { currentCropper.destroy(); currentCropper = null; }
}

function saveCrop() {
  if (!currentCropper) return;
  const croppedCanvas = currentCropper.getCroppedCanvas();
  const croppedSrc = croppedCanvas.toDataURL('image/jpeg', 0.95);

  const item = uploadedFiles.find(f => f.id === activeCropId);
  if (item) {
    item.src = croppedSrc;
    const newImg = new Image();
    newImg.onload = () => {
      item.img = newImg;
      const thumb = document.getElementById(`thumb-${item.id}`);
      if (thumb) thumb.src = croppedSrc;
    };
    newImg.src = croppedSrc;
  }
  closeCropModal();
}
