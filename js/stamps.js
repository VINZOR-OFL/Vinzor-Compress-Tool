// --- MODULE: Govt Name & Date Stamps + Signature Cleaner ---

// Formats YYYY-MM-DD from calendar into DD-MM-YYYY
function formatDateStamp(dateStr, prefix = "DOP: ") {
  let formattedDate = "";
  if (!dateStr) {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const mon = String(d.getMonth() + 1).padStart(2, '0');
    formattedDate = `${day}-${mon}-${d.getFullYear()}`;
  } else {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      formattedDate = `${parts}-${parts}-${parts[0]}`;
    } else {
      formattedDate = dateStr;
    }
  }
  return `${prefix}${formattedDate}`;
}

// Dynamically draws text scaled to fit canvas width so no characters are clipped
function drawFittedText(ctx, text, x, y, maxFontSize, maxWidth, isBold = false) {
  let fontSize = maxFontSize;
  ctx.font = `${isBold ? 'bold ' : '600 '}${fontSize}px Arial, system-ui, sans-serif`;
  while (ctx.measureText(text).width > maxWidth && fontSize > 8) {
    fontSize -= 1;
    ctx.font = `${isBold ? 'bold ' : '600 '}${fontSize}px Arial, system-ui, sans-serif`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

// Draws bottom banner on canvas for name & date stamp
function applyStampBanner(ctx, canvasWidth, canvasHeight, stampName, rawDate, prefix) {
  const stampDateLine = formatDateStamp(rawDate, prefix);
  const bannerHeight = Math.max(34, Math.round(canvasHeight * 0.20));
  const bannerTop = canvasHeight - bannerHeight;

  // Solid white banner base
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, bannerTop, canvasWidth, bannerHeight);

  // Divider top line
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, bannerTop);
  ctx.lineTo(canvasWidth, bannerTop);
  ctx.stroke();

  // Draw fitted name & date
  const maxTextWidth = canvasWidth - 24;
  ctx.fillStyle = '#000000';
  
  // Upper half: Candidate Name
  drawFittedText(ctx, stampName.toUpperCase(), canvasWidth / 2, bannerTop + (bannerHeight * 0.32), Math.round(bannerHeight * 0.35), maxTextWidth, true);
  
  // Lower half: Date
  drawFittedText(ctx, stampDateLine, canvasWidth / 2, bannerTop + (bannerHeight * 0.72), Math.round(bannerHeight * 0.28), maxTextWidth, false);
}

// Cleans signature scan backgrounds and boosts contrast
function applySignatureCleaning(ctx, width, height, sigMode) {
  if (sigMode === 'off') return;
  const imgData = ctx.getImageData(0, 0, width, height);
  const d = imgData.data;
  const threshold = 155;

  for (let i = 0; i < d.length; i += 4) {
    let lum = d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114;
    if (lum > threshold) {
      d[i] = 255; d[i+1] = 255; d[i+2] = 255;
    } else {
      if (sigMode === 'black') {
        let dark = Math.round((lum / threshold) * 50);
        d[i] = dark; d[i+1] = dark; d[i+2] = dark;
      } else if (sigMode === 'blue') {
        d[i] = 12; d[i+1] = 45; d[i+2] = 175;
      } else {
        let f = lum < 90 ? 0.35 : 0.65;
        d[i] = Math.round(d[i] * f);
        d[i+1] = Math.round(d[i] * f);
        d[i+2] = Math.round(d[i] * f);
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
}
