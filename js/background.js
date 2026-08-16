// --- MODULE: AI Background Remover & Color Replacer ---

let selfieSegmenterInstance = null;

function getSegmenter() {
  if (!selfieSegmenterInstance && window.SelfieSegmentation) {
    try {
      selfieSegmenterInstance = new SelfieSegmentation({
        locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${f}`
      });
      selfieSegmenterInstance.setOptions({ modelSelection: 1 });
    } catch (e) {
      console.warn("MediaPipe initialization offline/local:", e);
    }
  }
  return selfieSegmenterInstance;
}

function toggleBgColorPicker() {
  const mode = document.getElementById('bgMode').value;
  const customGroup = document.getElementById('customColorGroup');
  if (customGroup) {
    customGroup.style.display = (mode === 'custom') ? 'flex' : 'none';
  }
}

function quickSetBg(colorValue) {
  const el = document.getElementById('bgMode');
  if (el) {
    el.value = colorValue;
    toggleBgColorPicker();
    if (typeof setStatus === 'function') {
      setStatus(`Background mode set to: ${colorValue === 'transparent' ? 'Transparent PNG' : colorValue}. Click Compress!`);
    }
  }
}

async function getAIMask(imageElem) {
  return new Promise((resolve) => {
    try {
      const seg = getSegmenter();
      if (!seg) return resolve(null);
      seg.onResults((r) => resolve(r.segmentationMask || null));
      seg.send({ image: imageElem }).catch(() => resolve(null));
    } catch (err) {
      resolve(null);
    }
  });
}

function applyColorKeying(ctx, width, height, targetHex) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const d = imgData.data;
  const corners = [0, (width - 1) * 4, (height - 1) * width * 4, ((height - 1) * width + (width - 1)) * 4];
  let bgR = 0, bgG = 0, bgB = 0;
  corners.forEach(i => { bgR += d[i]; bgG += d[i+1]; bgB += d[i+2]; });
  bgR /= 4; bgG /= 4; bgB /= 4;

  const isTrans = targetHex === 'transparent';
  const c = targetHex.replace('#', '');
  const [tR, tG, tB] = !isTrans ? [parseInt(c.substr(0,2),16), parseInt(c.substr(2,2),16), parseInt(c.substr(4,2),16)] : [255,255,255];

  for (let i = 0; i < d.length; i += 4) {
    let dist = Math.sqrt((d[i]-bgR)**2 + (d[i+1]-bgG)**2 + (d[i+2]-bgB)**2);
    if (dist < 45) {
      if (isTrans) d[i+3] = 0;
      else { d[i] = tR; d[i+1] = tG; d[i+2] = tB; }
    } else if (dist < 60) {
      let f = (dist - 45) / 15;
      if (isTrans) d[i+3] = Math.round(255 * f);
      else {
        d[i] = Math.round(d[i]*f + tR*(1-f));
        d[i+1] = Math.round(d[i+1]*f + tG*(1-f));
        d[i+2] = Math.round(d[i+2]*f + tB*(1-f));
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
}
