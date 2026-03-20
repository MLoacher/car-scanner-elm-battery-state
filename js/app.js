// app.js - Main application controller

import { t, setLanguage, getLanguage } from './i18n.js';
import { parseCSV, extractCSVFromZip, extractDateFromFilename } from './parser.js';
import { analyze } from './analyzer.js';
import { detectPlatform, getMakes, getModels, getModelSpecs } from './car-profiles.js';
import { renderReport } from './report.js';
import { renderDetails } from './details.js';
import { generatePDF, encodeShareData, decodeShareData } from './export.js';

// --- State variables ---
let parsedData = null;
let reportData = null;
let detectedPlatform = null;

// --- Helper: toggle app state ---
function setState(state) {
  document.querySelectorAll('.state').forEach((el) => {
    el.classList.toggle('active', el.id === `state-${state}`);
  });
}

// --- Apply translations to all [data-i18n] elements ---
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  // Update language button active state
  const currentLang = getLanguage();
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLang);
  });
}

// --- Toast notification ---
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, duration);
}

// --- File handling ---
async function handleFile(file) {
  try {
    let parsed;
    let filename = file.name || '';

    if (filename.endsWith('.zip')) {
      const arrayBuffer = await file.arrayBuffer();
      parsed = await extractCSVFromZip(arrayBuffer);
    } else if (filename.endsWith('.csv')) {
      const text = await file.text();
      parsed = parseCSV(text);
    } else {
      showToast(t('invalidFile'));
      return;
    }

    if (!parsed || parsed.totalPoints === 0) {
      showToast(t('noBatteryData'));
      return;
    }

    parsedData = parsed;

    // Detect platform
    detectedPlatform = detectPlatform(parsed.pidNames);

    // Show file name and summary
    const fileNameEl = document.getElementById('file-name');
    if (fileNameEl) fileNameEl.textContent = filename;

    const summaryEl = document.getElementById('parse-summary');
    if (summaryEl) {
      const cellCount = parsed.getCellCount();
      summaryEl.textContent = cellCount > 0
        ? t('foundCells', { count: cellCount })
        : `${parsed.totalPoints} data points`;
    }

    // Set date from filename
    const dateStr = extractDateFromFilename(filename);
    const dateInput = document.getElementById('reading-date');
    if (dateInput && dateStr) {
      dateInput.value = dateStr;
    }

    // Populate form
    populateMakeDropdown();

    // Switch to form state
    setState('form');
  } catch (err) {
    showToast(t('parseError', { message: err.message }));
    console.error('File handling error:', err);
  }
}

// --- Populate make dropdown ---
function populateMakeDropdown() {
  const select = document.getElementById('car-make');
  if (!select) return;

  // Clear existing options
  select.innerHTML = '<option value="">--</option>';

  if (detectedPlatform) {
    const makes = getMakes(detectedPlatform);
    for (const make of makes) {
      const opt = document.createElement('option');
      opt.value = make;
      opt.textContent = make;
      select.appendChild(opt);
    }
  }

  // Add "Other" option
  const otherOpt = document.createElement('option');
  otherOpt.value = '__other__';
  otherOpt.textContent = t('other');
  select.appendChild(otherOpt);
}

// --- Populate model dropdown ---
function populateModelDropdown(make) {
  const select = document.getElementById('car-model');
  if (!select) return;

  select.innerHTML = '<option value="">--</option>';

  if (detectedPlatform && make && make !== '__other__') {
    const models = getModels(detectedPlatform, make);
    for (const model of models) {
      const opt = document.createElement('option');
      opt.value = model;
      opt.textContent = model;
      select.appendChild(opt);
    }
  }

  // Also update capacity
  updateCapacity(make, '');
}

// --- Update battery capacity field ---
function updateCapacity(make, model) {
  const input = document.getElementById('battery-capacity');
  if (!input) return;

  if (detectedPlatform && make && model && make !== '__other__') {
    const specs = getModelSpecs(detectedPlatform, make, model);
    if (specs) {
      input.value = `${specs.grossKwh} kWh (${specs.netKwh} kWh net)`;
      return;
    }
  }

  input.value = '';
}

// --- Generate report from form ---
function generateReportFromForm() {
  if (!parsedData) return;

  const make = document.getElementById('car-make')?.value || '';
  const model = document.getElementById('car-model')?.value || '';
  const mileage = document.getElementById('car-mileage')?.value || '';
  const dateStr = document.getElementById('reading-date')?.value || null;
  const knownSoh = document.getElementById('known-soh')?.value;
  const userSoh = knownSoh ? parseFloat(knownSoh) : null;

  // Get specs for capacity
  let grossKwh = null;
  let netKwh = null;
  if (detectedPlatform && make && model && make !== '__other__') {
    const specs = getModelSpecs(detectedPlatform, make, model);
    if (specs) {
      grossKwh = specs.grossKwh;
      netKwh = specs.netKwh;
    }
  }

  const vehicleInfo = {
    make: make === '__other__' ? t('other') : make,
    model,
    mileage: mileage ? parseInt(mileage, 10) : null,
    grossKwh,
    netKwh,
    userSoh,
  };

  reportData = analyze(parsedData, vehicleInfo, dateStr);

  // Render report and details tabs
  const reportContainer = document.getElementById('report-content');
  const detailsContainer = document.getElementById('details-content');

  if (reportContainer) renderReport(reportData, reportContainer);
  if (detailsContainer) renderDetails(reportData, detailsContainer);

  // Switch to report state
  setState('report');
}

// --- Init: wire up all event listeners ---
function init() {
  // Apply initial translations
  applyTranslations();

  // --- Language toggle ---
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      setLanguage(lang);
      applyTranslations();

      // Re-render if in report state
      if (reportData) {
        const reportContainer = document.getElementById('report-content');
        const detailsContainer = document.getElementById('details-content');
        if (reportContainer) renderReport(reportData, reportContainer);
        if (detailsContainer) renderDetails(reportData, detailsContainer);
      }
    });
  });

  // --- Drop zone ---
  const dropZone = document.getElementById('drop-zone');
  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const file = e.dataTransfer?.files[0];
      if (file) handleFile(file);
    });
  }

  // --- File input ---
  const fileInput = document.getElementById('file-input');
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (file) handleFile(file);
    });
  }

  // --- Make select change ---
  const makeSelect = document.getElementById('car-make');
  if (makeSelect) {
    makeSelect.addEventListener('change', () => {
      populateModelDropdown(makeSelect.value);
    });
  }

  // --- Model select change ---
  const modelSelect = document.getElementById('car-model');
  if (modelSelect) {
    modelSelect.addEventListener('change', () => {
      const make = document.getElementById('car-make')?.value || '';
      updateCapacity(make, modelSelect.value);
    });
  }

  // --- Form submit ---
  const form = document.getElementById('car-info-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      generateReportFromForm();
    });
  }

  // --- Tab buttons ---
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');

      // Toggle active on tabs
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      // Toggle active on tab content
      document.querySelectorAll('.tab-content').forEach((tc) => tc.classList.remove('active'));
      const content = document.getElementById(`${target}-content`);
      if (content) content.classList.add('active');
    });
  });

  // --- PDF button ---
  const btnPdf = document.getElementById('btn-pdf');
  if (btnPdf) {
    btnPdf.addEventListener('click', () => {
      generatePDF(reportData);
    });
  }

  // --- Share button ---
  const btnShare = document.getElementById('btn-share');
  if (btnShare) {
    btnShare.addEventListener('click', async () => {
      const url = await encodeShareData(reportData);
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
      showToast(t('linkCopied'));
    });
  }

  // --- New upload button ---
  const btnNew = document.getElementById('btn-new');
  if (btnNew) {
    btnNew.addEventListener('click', () => {
      // Reset all state
      parsedData = null;
      reportData = null;
      detectedPlatform = null;

      // Clear form fields
      const form = document.getElementById('car-info-form');
      if (form) form.reset();

      // Clear file input
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';

      // Clear report/details containers
      const reportContainer = document.getElementById('report-content');
      const detailsContainer = document.getElementById('details-content');
      if (reportContainer) reportContainer.innerHTML = '';
      if (detailsContainer) detailsContainer.innerHTML = '';

      // Switch to upload state
      setState('upload');
    });
  }

  // --- Check URL hash for shared report data on load ---
  if (window.location.hash) {
    decodeShareData(window.location.hash).then((shared) => {
      if (shared) {
        reportData = shared;
        const reportContainer = document.getElementById('report-content');
        const detailsContainer = document.getElementById('details-content');
        if (reportContainer) renderReport(reportData, reportContainer);
        if (detailsContainer) renderDetails(reportData, detailsContainer);
        setState('report');
      }
    }).catch(() => {
      // Ignore hash decoding errors
    });
  }
}

// --- Bootstrap ---
document.addEventListener('DOMContentLoaded', init);
