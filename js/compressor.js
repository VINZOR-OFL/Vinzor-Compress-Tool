// --- MODULE: Precision Compression, Batch Engine, ZIP & PDF ---

async function compressToTarget(imgItem, targetKB, mimeType) {
  return new Promise(async (resolve) => {
    let targetBytes = targetKB * 1024;
    const customKb = parseInt(document.getElementById('customKbInput').value);
    if (!isNaN(customKb) && customKb > 0) targetBytes = customKb * 1024;

    let reqW = parseFloat(document.getElementById('customWidth').value);
    let reqH = parseFloat(document.getElementById('customHeight').value);
    const unit = document.getElementById('dimUnit').value;
    const fitMode = document.getElementById('fitMode').value;
    const bgMode = document.getElementById('bgMode').value;
    const bgEngine = document.getElementById('bgEngine').value;
    const customBg = document.getElementById('customBgPicker').value;
    const feather = parseInt(document.getElementById('edgeFeather').value) || 2;

    let baseW = imgItem.img.width || 800;
    let baseH = imgItem.img.height || 600;

    if (!isNaN(reqW) && reqW > 0 && !isNaN(reqH) && reqH > 0) {
      if (unit === 'cm') { baseW = Math.round(reqW * 118.11); baseH = Math.round(reqH * 118.11); }
      else if (unit === 'mm') { baseW = Math.round(reqW * 11.811); baseH = Math.round(reqH * 11.811); }
      else if (unit === 'in') { baseW = Math.round(reqW * 300); baseH = Math.round(reqH * 300); }
      else { baseW = Math.round(reqW); baseH = Math.round(reqH); }
    }

    let aiMask = null;
    if (bgMode !== 'none' && bgEngine === 'ai' && typeof getAIMask === 'function') {
      aiMask = await getAIMask(imgItem.img);
    }

    function getBlob(w, h, quality) {
      return new Promise((res) => {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(10, Math.round(w));
        canvas.height = Math.max(10, Math.round(h));
        const ctx = canvas.getContext('2d');

        const targetBg = bgMode === 'custom' ? customBg : bgMode;

        if (targetBg !== 'transparent' && targetBg !== 'none') {
          ctx.fillStyle = targetBg;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (targetBg === 'none' && mimeType !== 'image/png') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        const origW = imgItem.img.width;
        const origH = imgItem.img.height;

        if (bgMode !== 'none' && aiMask) {
          const pCanvas = document.createElement('canvas');
          pCanvas.width = canvas.width;
          pCanvas.height = canvas.height;
          const pCtx = pCanvas.getContext('2d');

          if (fitMode === 'cover') {
            const r = Math.max(canvas.width / origW, canvas.height / origH);
            const sW = canvas.width / r, sH = canvas.height / r;
            pCtx.drawImage(imgItem.img, (origW - sW)/2, (origH - sH)/2, sW, sH, 0, 0, canvas.width, canvas.height);
          } else {
            pCtx.drawImage(imgItem.img, 0, 0, canvas.width, canvas.height);
          }

          pCtx.globalCompositeOperation = 'destination-in';
          if (feather > 0) pCtx.filter = `blur(${feather}px)`;
          pCtx.drawImage(aiMask, 0, 0, canvas.width, canvas.height);
          pCtx.filter = 'none';
          pCtx.globalCompositeOperation = 'source-over';

          ctx.drawImage(pCanvas, 0, 0);
        } else {
          if (fitMode === 'contain') {
            const ratio = Math.min(canvas.width / origW, canvas.height / origH);
            const sX = (canvas.width - origW * ratio) / 2;
            const sY = (canvas.height - origH * ratio) / 2;
            ctx.drawImage(imgItem.img, 0, 0, origW, origH, sX, sY, origW * ratio, origH * ratio);
          } else if (fitMode === 'cover') {
            const ratio = Math.max(canvas.width / origW, canvas.height / origH);
            const sW = canvas.width / ratio, sH = canvas.height / ratio;
            ctx.drawImage(imgItem.img, (origW - sW)/2, (origH - sH)/2, sW, sH, 0, 0, canvas.width, canvas.height);
          } else {
            ctx.drawImage(imgItem.img, 0, 0, canvas.width, canvas.height);
          }

          if (bgMode !== 'none' && !aiMask && typeof applyColorKeying === 'function') {
            applyColorKeying(ctx, canvas.width, canvas.height, targetBg);
          }
        }

        // Apply Signature Cleaner
        const sigMode = document.getElementById('sigCleaner').value;
        if (typeof applySignatureCleaning === 'function') {
          applySignatureCleaning(ctx, canvas.width, canvas.height, sigMode);
        }

        // Grayscale Filter
        if (document.getElementById('colorFilter').value === 'grayscale') {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imgData.data;
          for (let i = 0; i < d.length; i += 4) {
            let avg = Math.round(d[i]*0.299 + d[i+1]*0.587 + d[i+2]*0.114);
            d[i] = avg; d[i+1] = avg; d[i+2] = avg;
          }
          ctx.putImageData(imgData, 0, 0);
        }

        // Apply Name & Date Banner Stamp
        if (document.getElementById('enableStamp').value === 'yes' && typeof applyStampBanner === 'function') {
          const stampName = document.getElementById('stampName').value.trim() || 'SANDHIYA S';
          const rawDate = document.getElementById('stampDate').value;
          const prefix = document.getElementById('stampLabelPrefix').value;
          applyStampBanner(ctx, canvas.width, canvas.height, stampName, rawDate, prefix);
        }

        const outMime = (bgMode === 'transparent') ? 'image/png' : mimeType;
        canvas.toBlob((b) => res(b), outMime, quality);
      });
    }

    async function run() {
      let curW = baseW, curH = baseH;

      if (targetBytes === 0) {
        let b = await getBlob(curW, curH, 0.95);
        resolve(b);
        return;
      }

      if (mimeType === 'image/png' || bgMode === 'transparent') {
        let b = await getBlob(curW, curH, 1.0);
        while (b.size > targetBytes && curW > 120) {
          curW *= 0.85; curH *= 0.85;
          b = await getBlob(curW, curH, 1.0);
        }
        resolve(b);
        return;
      }

      let minQ = 0.05, maxQ = 0.98, bestBlob = null;
      for (let i = 0; i < 9; i++) {
        let midQ = (minQ + maxQ) / 2;
        let testBlob = await getBlob(curW, curH, midQ);
        if (testBlob.size <= targetBytes) { bestBlob = testBlob; minQ = midQ; }
        else { maxQ = midQ; }
      }

      if (!bestBlob || bestBlob.size > targetBytes) {
        let scaleQ = 0.65;
        while (curW > 100) {
          curW *= 0.85; curH *= 0.85;
          let sBlob = await getBlob(curW, curH, scaleQ);
          if (sBlob.size <= targetBytes) { bestBlob = sBlob; break; }
          if (scaleQ > 0.3) scaleQ -= 0.1;
        }
        if (!bestBlob) bestBlob = await getBlob(curW, curH, 0.30);
      }
      resolve(bestBlob);
    }
    run();
  });
}

async function processBatch() {
  if (uploadedFiles.length === 0) {
    alert('Please upload photos first!');
    return;
  }

  const targetKB = parseInt(document.getElementById('sizeTarget').value);
  const mimeType = document.getElementById('formatSelect').value;
  const prefix = document.getElementById('filePrefix').value.trim() || 'doc';
  const bgMode = document.getElementById('bgMode').value;
  const ext = (bgMode === 'transparent' || mimeType === 'image/png') ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';

  setStatus('⏳ Processing photos with AI background studio, stamp & smart compression...');

  for (let item of uploadedFiles) {
    const blob = await compressToTarget(item, targetKB, mimeType);
    item.processedBlob = blob;
    if (item.downloadUrl) URL.revokeObjectURL(item.downloadUrl);
    const downloadUrl = URL.createObjectURL(blob);
    item.downloadUrl = downloadUrl;

    const card = document.getElementById(`card-${item.id}`);
    if (!card) continue;

    const savings = Math.round(((item.originalSize - blob.size) / item.originalSize) * 100);

    card.innerHTML = `
      <div class="file-info">
        <img src="${downloadUrl}" class="file-thumb" id="thumb-${item.id}">
        <div class="file-details">
          <span class="file-name">${item.name}</span>
          <span class="file-meta">Original: ${formatBytes(item.originalSize)} ➔ <strong>Target: ${formatBytes(blob.size)}</strong></span>
        </div>
      </div>
      <div class="action-btns">
        <span class="badge-status badge-success">${savings > 0 ? '-' + savings + '%' : savings === 0 ? 'Exact' : '+' + Math.abs(savings) + '%'}</span>
        <button class="btn-sm btn-clear" onclick="openCropModal(${item.id})">✂️ Crop</button>
        <button class="btn-sm btn-copy" onclick="copyToClipboard(${item.id})">📋 Copy</button>
        <a href="${downloadUrl}" download="${prefix}_${item.id}.${ext}" class="btn-sm btn-dl">Download</a>
      </div>
    `;
  }
  setStatus('✅ Processing complete! Download individual files or export bundle below.');
}

async function downloadAllZip() {
  if (uploadedFiles.length === 0 || !uploadedFiles.some(f => f.processedBlob)) {
    alert('Please click "Compress & Apply Settings" first before downloading as ZIP!');
    return;
  }

  const zip = new JSZip();
  const prefix = document.getElementById('filePrefix').value.trim() || 'doc';
  const mimeType = document.getElementById('formatSelect').value;
  const bgMode = document.getElementById('bgMode').value;
  const ext = (bgMode === 'transparent' || mimeType === 'image/png') ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';

  uploadedFiles.forEach((item, idx) => {
    if (item.processedBlob) {
      zip.file(`${prefix}_${idx + 1}.${ext}`, item.processedBlob);
    }
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(zipBlob);
  link.download = `${prefix}_batch_bundle.zip`;
  link.click();
}

async function copyToClipboard(id) {
  const item = uploadedFiles.find(f => f.id === id);
  if (!item || !item.processedBlob) return alert('Compress the image first.');

  try {
    let pngBlob = item.processedBlob;
    if (item.processedBlob.type !== 'image/png') {
      const img = new Image();
      await new Promise((res) => {
        img.onload = res;
        img.src = item.downloadUrl || URL.createObjectURL(item.processedBlob);
      });
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      pngBlob = await new Promise(res => c.toBlob(res, 'image/png'));
    }
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
    alert('✅ Image copied to clipboard as PNG!');
  } catch (err) {
    alert('Direct clipboard copy is not supported in this browser context.');
  }
}

async function generateBatchPDF() {
  if (uploadedFiles.length === 0) return alert('Upload photos first!');
  const { jsPDF } = window.jspdf;
  let pdf = null;
  const prefix = document.getElementById('filePrefix').value.trim() || 'documents';

  for (let i = 0; i < uploadedFiles.length; i++) {
    const item = uploadedFiles[i];
    let imgData = item.src;
    if (item.processedBlob) {
      imgData = await new Promise((res) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.readAsDataURL(item.processedBlob);
      });
    }

    const tempImg = new Image();
    await new Promise((res) => { tempImg.onload = res; tempImg.src = imgData; });

    const w = tempImg.width || 800;
    const h = tempImg.height || 600;
    const isL = w > h;

    if (i === 0) {
      pdf = new jsPDF({ orientation: isL ? 'landscape' : 'portrait', unit: 'px', format: [w, h] });
    } else {
      pdf.addPage([w, h], isL ? 'landscape' : 'portrait');
    }
    pdf.addImage(imgData, 'JPEG', 0, 0, w, h);
  }
  pdf.save(`${prefix}_merged.pdf`);
}
