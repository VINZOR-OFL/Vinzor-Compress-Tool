// --- MODULE: Govt Exam Presets & Dimension Configurator ---

function applyExamPreset() {
  const preset = document.getElementById('examPreset').value;
  const targetSelect = document.getElementById('sizeTarget');
  const customW = document.getElementById('customWidth');
  const customH = document.getElementById('customHeight');
  const unit = document.getElementById('dimUnit');
  const format = document.getElementById('formatSelect');
  const sigCleaner = document.getElementById('sigCleaner');
  const fitMode = document.getElementById('fitMode');
  const bgMode = document.getElementById('bgMode');

  if (preset === 'upsc_photo') {
    targetSelect.value = "300"; customW.value = "350"; customH.value = "450"; unit.value = "px";
    format.value = "image/jpeg"; sigCleaner.value = "off"; fitMode.value = "cover"; bgMode.value = "#ffffff";
  } else if (preset === 'ssc_photo') {
    targetSelect.value = "50"; customW.value = "3.5"; customH.value = "4.5"; unit.value = "cm";
    format.value = "image/jpeg"; sigCleaner.value = "off"; fitMode.value = "cover"; bgMode.value = "#ffffff";
  } else if (preset === 'ssc_sig') {
    targetSelect.value = "20"; customW.value = "4.0"; customH.value = "2.0"; unit.value = "cm";
    format.value = "image/jpeg"; sigCleaner.value = "auto"; fitMode.value = "contain"; bgMode.value = "#ffffff";
  } else if (preset === 'passport') {
    targetSelect.value = "50"; customW.value = "3.5"; customH.value = "4.5"; unit.value = "cm";
    format.value = "image/jpeg"; sigCleaner.value = "off"; fitMode.value = "cover"; bgMode.value = "#ffffff";
  } else if (preset === 'neet_photo') {
    targetSelect.value = "200"; customW.value = "3.5"; customH.value = "4.5"; unit.value = "cm";
    format.value = "image/jpeg"; sigCleaner.value = "off"; fitMode.value = "cover"; bgMode.value = "#ffffff";
  } else if (preset === 'gate_photo') {
    targetSelect.value = "200"; customW.value = "3.5"; customH.value = "4.5"; unit.value = "cm";
    format.value = "image/jpeg"; sigCleaner.value = "off"; fitMode.value = "cover"; bgMode.value = "#ffffff";
  } else if (preset === 'ibps_photo') {
    targetSelect.value = "50"; customW.value = "200"; customH.value = "230"; unit.value = "px";
    format.value = "image/jpeg"; sigCleaner.value = "off"; fitMode.value = "cover"; bgMode.value = "#ffffff";
  } else if (preset === 'ibps_sig') {
    targetSelect.value = "20"; customW.value = "140"; customH.value = "60"; unit.value = "px";
    format.value = "image/jpeg"; sigCleaner.value = "auto"; fitMode.value = "contain"; bgMode.value = "none";
  }

  if (typeof toggleBgColorPicker === 'function') toggleBgColorPicker();
  if (typeof setStatus === 'function') setStatus(`Applied preset: ${preset.toUpperCase()}. Click Compress to run!`);
}

function quickApplyPreset(presetName) {
  const el = document.getElementById('examPreset');
  if (el) {
    el.value = presetName;
    applyExamPreset();
  }
}
