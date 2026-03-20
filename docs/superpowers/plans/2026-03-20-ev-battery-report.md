# EV Battery Health Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static GitHub Pages site that parses Car Scanner ELM OBD2 exports and displays an EV battery health report with cell voltage analysis, temperature mapping, and export capabilities.

**Architecture:** Vanilla HTML/CSS/JS with ES modules. No build step. Chart.js for visualizations, JSZip for ZIP handling, pako for URL compression, jsPDF + html2canvas for PDF export — all via CDN. Pure logic modules (parser, analyzer) are testable in Node.js; UI modules tested manually in browser.

**Tech Stack:** HTML5, CSS3 (Grid/Flexbox), vanilla ES modules, Chart.js, JSZip, pako, jsPDF, html2canvas

---

## File Structure

```
index.html                — single page app entry point, all 3 page states
css/
  style.css               — all styles, mobile-first responsive
js/
  app.js                  — orchestration: file upload, state management, wiring
  parser.js               — CSV parsing, ZIP extraction
  analyzer.js             — data analysis: cell stats, health checks, balance score
  report.js               — Report tab DOM rendering
  details.js              — Details tab DOM rendering
  export.js               — PDF generation, shareable link encode/decode
  i18n.js                 — EN/DE translations, language switching
  car-profiles.js         — known car specs, platform auto-detection
tests/
  test-parser.js          — Node.js tests for parser
  test-analyzer.js        — Node.js tests for analyzer
  test-car-profiles.js    — Node.js tests for car profiles
  test-export.js          — Node.js tests for encode/decode
  sample.csv              — copy of sample data for tests
```

**Testing approach:** Pure logic modules (`parser.js`, `analyzer.js`, `car-profiles.js`, `export.js` encode/decode) export functions usable in both browser and Node.js. Tests use Node.js built-in `assert` + `node --experimental-vm-modules`. UI modules tested manually by loading in browser with sample data.

---

### Task 1: Project Scaffolding + i18n + Car Profiles

**Files:**
- Create: `js/i18n.js`
- Create: `js/car-profiles.js`
- Create: `tests/test-car-profiles.js`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p css js tests
```

- [ ] **Step 2: Write `js/i18n.js`**

```js
// js/i18n.js
const translations = {
  en: {
    // General
    title: 'EV Battery Health Report',
    subtitle: 'Upload your Car Scanner export to analyze your EV battery',
    privacyNote: 'All processing happens locally in your browser',
    // Upload
    dropPrompt: 'Drop your .zip or .csv file here',
    browseFiles: 'Browse Files',
    orText: 'or',
    exportedFrom: 'Exported from Car Scanner ELM OBD2 app',
    // Car Info Form
    fileLoaded: 'File loaded',
    foundCells: 'Found {cells} cells, {temps} temp sensors, {points} data points',
    carMake: 'Car Make',
    carModel: 'Model',
    mileage: 'Mileage (km)',
    dateOfReading: 'Date of Reading',
    knownSoh: 'Known SOH % (optional)',
    batteryCapacity: 'Battery Capacity',
    generateReport: 'Generate Report',
    other: 'Other',
    // Report Tab
    reportTab: 'Report',
    detailsTab: 'Details',
    basedOn: 'Based on Car Scanner OBD2 Data',
    date: 'Date',
    reportId: 'Report ID',
    make: 'Make',
    model: 'Model',
    battery: 'Battery',
    cellBalanceScore: 'Cell Balance Score',
    excellent: 'Excellent cell uniformity',
    good: 'Good cell uniformity',
    fair: 'Fair cell uniformity',
    poor: 'Poor cell uniformity',
    delta: 'Delta',
    acrossCells: 'across {count} cells',
    energy: 'Energy',
    currentContent: 'Current Content',
    maxContent: 'Max Content',
    ratio: 'Ratio',
    packVoltage: 'Pack Voltage',
    userProvided: 'user-provided',
    quickChecks: 'Quick Checks',
    checkCellSpread: 'Cell voltage spread < 20 mV',
    checkTempSpread: 'Temperature spread < 5°C',
    checkCellsInRange: 'All cells within nominal range',
    checkVoltageConsistent: 'Pack voltage consistent with cell sum',
    checkNoOutliers: 'No outlier cells detected',
    checkSocAvailable: 'BMS SoC reading available',
    cellVoltagesOverview: 'Cell Voltages Overview',
    cells: 'Cells',
    min: 'Min',
    max: 'Max',
    avg: 'Avg',
    assessment: 'Assessment',
    excellentCondition: 'Excellent Battery Condition',
    goodCondition: 'Good Battery Condition',
    attentionRecommended: 'Attention Recommended',
    disclaimer: 'This report is based on a single OBD2 data snapshot from the Car Scanner app. It is not a certified battery health assessment. The Cell Balance Score reflects cell voltage uniformity, not State of Health (SOH). For certified SOH measurement, consult a professional service like AVILOO.',
    // Details Tab
    cellVoltages: 'Cell Voltages',
    colorCodedByDeviation: 'color-coded by deviation from average',
    low: 'Low',
    high: 'High',
    cell: 'Cell',
    batteryTemperature: 'Battery Temperature',
    sensors: 'Sensors',
    bmsData: 'BMS Data',
    socDisplay: 'SoC (Display)',
    socBms: 'SoC (BMS)',
    cellSumVoltage: 'Cell Sum Voltage',
    batteryCurrent: 'Battery Current',
    batteryPower: 'Battery Power',
    chargeVoltageLimit: 'Charge Voltage Limit',
    maxChargeCurrent: 'Max Charge Current',
    energyAndRange: 'Energy & Range',
    currentEnergy: 'Current Energy',
    maxEnergy: 'Max Energy',
    energyRatio: 'Energy Ratio',
    estimatedRange: 'Estimated Range',
    odometer: 'Odometer',
    avgConsumption: 'Avg Consumption',
    auxBattery: '12V Auxiliary Battery',
    voltage: 'Voltage',
    soc: 'SoC',
    temperature: 'Temperature',
    capacityAging: 'Capacity Aging',
    allParameters: 'All Recorded Parameters',
    groupedByModule: 'Grouped by module',
    expand: 'Expand',
    collapse: 'Collapse',
    lastValue: 'Last',
    unit: 'Unit',
    // Export
    printPdf: 'Print / PDF',
    shareLink: 'Share Link',
    newUpload: 'New Upload',
    linkCopied: 'Link copied to clipboard!',
    // Errors
    invalidFile: 'Invalid file. Please upload a .zip or .csv file exported from Car Scanner.',
    parseError: 'Could not parse the file. Please check the format.',
    noBatteryData: 'No battery cell data found in this export.',
  },
  de: {
    title: 'EV Batterie Gesundheitsbericht',
    subtitle: 'Laden Sie Ihren Car Scanner Export hoch, um Ihre EV-Batterie zu analysieren',
    privacyNote: 'Alle Verarbeitung erfolgt lokal in Ihrem Browser',
    dropPrompt: 'Ziehen Sie Ihre .zip oder .csv Datei hierher',
    browseFiles: 'Dateien durchsuchen',
    orText: 'oder',
    exportedFrom: 'Exportiert aus der Car Scanner ELM OBD2 App',
    fileLoaded: 'Datei geladen',
    foundCells: '{cells} Zellen, {temps} Temperatursensoren, {points} Datenpunkte gefunden',
    carMake: 'Hersteller',
    carModel: 'Modell',
    mileage: 'Kilometerstand (km)',
    dateOfReading: 'Datum der Messung',
    knownSoh: 'Bekannter SOH % (optional)',
    batteryCapacity: 'Batteriekapazität',
    generateReport: 'Bericht erstellen',
    other: 'Andere',
    reportTab: 'Bericht',
    detailsTab: 'Details',
    basedOn: 'Basierend auf Car Scanner OBD2-Daten',
    date: 'Datum',
    reportId: 'Berichts-ID',
    make: 'Hersteller',
    model: 'Modell',
    battery: 'Batterie',
    cellBalanceScore: 'Zellbalance-Bewertung',
    excellent: 'Ausgezeichnete Zellgleichmäßigkeit',
    good: 'Gute Zellgleichmäßigkeit',
    fair: 'Mäßige Zellgleichmäßigkeit',
    poor: 'Schlechte Zellgleichmäßigkeit',
    delta: 'Delta',
    acrossCells: 'über {count} Zellen',
    energy: 'Energie',
    currentContent: 'Aktueller Inhalt',
    maxContent: 'Max. Inhalt',
    ratio: 'Verhältnis',
    packVoltage: 'Packspannung',
    userProvided: 'vom Benutzer angegeben',
    quickChecks: 'Schnellprüfungen',
    checkCellSpread: 'Zellspannungsstreuung < 20 mV',
    checkTempSpread: 'Temperaturstreuung < 5°C',
    checkCellsInRange: 'Alle Zellen im Nennbereich',
    checkVoltageConsistent: 'Packspannung stimmt mit Zellsumme überein',
    checkNoOutliers: 'Keine Ausreißer-Zellen erkannt',
    checkSocAvailable: 'BMS SoC-Wert verfügbar',
    cellVoltagesOverview: 'Zellspannungen Übersicht',
    cells: 'Zellen',
    min: 'Min',
    max: 'Max',
    avg: 'Mittel',
    assessment: 'Bewertung',
    excellentCondition: 'Ausgezeichneter Batteriezustand',
    goodCondition: 'Guter Batteriezustand',
    attentionRecommended: 'Aufmerksamkeit empfohlen',
    disclaimer: 'Dieser Bericht basiert auf einem einzelnen OBD2-Datenschnappschuss der Car Scanner App. Er ist keine zertifizierte Batteriezustandsbewertung. Die Zellbalance-Bewertung spiegelt die Gleichmäßigkeit der Zellspannung wider, nicht den State of Health (SOH). Für eine zertifizierte SOH-Messung wenden Sie sich an einen professionellen Dienst wie AVILOO.',
    cellVoltages: 'Zellspannungen',
    colorCodedByDeviation: 'farbkodiert nach Abweichung vom Durchschnitt',
    low: 'Niedrig',
    high: 'Hoch',
    cell: 'Zelle',
    batteryTemperature: 'Batterietemperatur',
    sensors: 'Sensoren',
    bmsData: 'BMS-Daten',
    socDisplay: 'SoC (Anzeige)',
    socBms: 'SoC (BMS)',
    cellSumVoltage: 'Summe Zellspannungen',
    batteryCurrent: 'Batteriestrom',
    batteryPower: 'Batterieleistung',
    chargeVoltageLimit: 'Ladespannungsgrenze',
    maxChargeCurrent: 'Max. Ladestrom',
    energyAndRange: 'Energie & Reichweite',
    currentEnergy: 'Aktuelle Energie',
    maxEnergy: 'Max. Energie',
    energyRatio: 'Energieverhältnis',
    estimatedRange: 'Geschätzte Reichweite',
    odometer: 'Kilometerstand',
    avgConsumption: 'Durchschnittsverbrauch',
    auxBattery: '12V Hilfsbatterie',
    voltage: 'Spannung',
    soc: 'SoC',
    temperature: 'Temperatur',
    capacityAging: 'Kapazitätsalterung',
    allParameters: 'Alle aufgezeichneten Parameter',
    groupedByModule: 'Gruppiert nach Modul',
    expand: 'Erweitern',
    collapse: 'Einklappen',
    lastValue: 'Letzter',
    unit: 'Einheit',
    printPdf: 'Drucken / PDF',
    shareLink: 'Link teilen',
    newUpload: 'Neuer Upload',
    linkCopied: 'Link in die Zwischenablage kopiert!',
    invalidFile: 'Ungültige Datei. Bitte laden Sie eine .zip oder .csv Datei aus Car Scanner hoch.',
    parseError: 'Datei konnte nicht gelesen werden. Bitte prüfen Sie das Format.',
    noBatteryData: 'Keine Batteriezellendaten in diesem Export gefunden.',
  }
};

let currentLang = localStorage.getItem('ev-report-lang') || 'en';

export function t(key, replacements = {}) {
  let text = translations[currentLang]?.[key] || translations.en[key] || key;
  for (const [k, v] of Object.entries(replacements)) {
    text = text.replace(`{${k}}`, v);
  }
  return text;
}

export function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('ev-report-lang', lang);
}

export function getLanguage() {
  return currentLang;
}
```

- [ ] **Step 3: Write `js/car-profiles.js`**

```js
// js/car-profiles.js
export const carProfiles = {
  meb: {
    name: 'VW MEB',
    detect: (pids) => pids.some(p => p.includes('[8C.BMS]')),
    makes: {
      Skoda: {
        models: {
          'Enyaq iV 60': { grossKwh: 62, netKwh: 58, cells: 96 },
          'Enyaq iV 80': { grossKwh: 82, netKwh: 77, cells: 96 },
          'Enyaq iV 80x': { grossKwh: 82, netKwh: 77, cells: 96 },
          'Enyaq Coupe iV 80': { grossKwh: 82, netKwh: 77, cells: 96 },
        }
      },
      VW: {
        models: {
          'ID.3 Pure': { grossKwh: 48, netKwh: 45, cells: 96 },
          'ID.3 Pro': { grossKwh: 62, netKwh: 58, cells: 96 },
          'ID.3 Pro S': { grossKwh: 82, netKwh: 77, cells: 96 },
          'ID.4 Pure': { grossKwh: 55, netKwh: 52, cells: 96 },
          'ID.4 Pro': { grossKwh: 82, netKwh: 77, cells: 96 },
          'ID.5 Pro': { grossKwh: 82, netKwh: 77, cells: 96 },
          'ID.7 Pro': { grossKwh: 82, netKwh: 77, cells: 96 },
          'ID.7 Pro S': { grossKwh: 91, netKwh: 86, cells: 96 },
        }
      },
      Audi: {
        models: {
          'Q4 e-tron 35': { grossKwh: 55, netKwh: 51.5, cells: 96 },
          'Q4 e-tron 40': { grossKwh: 82, netKwh: 76.6, cells: 96 },
          'Q4 e-tron 50': { grossKwh: 82, netKwh: 76.6, cells: 96 },
        }
      },
      Cupra: {
        models: {
          'Born 110 kW': { grossKwh: 55, netKwh: 52, cells: 96 },
          'Born 150 kW': { grossKwh: 62, netKwh: 58, cells: 96 },
          'Born 170 kW': { grossKwh: 82, netKwh: 77, cells: 96 },
        }
      },
    }
  }
};

/**
 * Detect platform from a list of PID names.
 * Returns the platform key (e.g. 'meb') or null.
 */
export function detectPlatform(pidNames) {
  for (const [key, profile] of Object.entries(carProfiles)) {
    if (profile.detect(pidNames)) return key;
  }
  return null;
}

/**
 * Get list of makes for a platform.
 */
export function getMakes(platformKey) {
  const platform = carProfiles[platformKey];
  return platform ? Object.keys(platform.makes) : [];
}

/**
 * Get list of models for a platform + make.
 */
export function getModels(platformKey, make) {
  const platform = carProfiles[platformKey];
  if (!platform || !platform.makes[make]) return [];
  return Object.keys(platform.makes[make].models);
}

/**
 * Get specs for a specific model.
 */
export function getModelSpecs(platformKey, make, model) {
  return carProfiles[platformKey]?.makes[make]?.models[model] || null;
}
```

- [ ] **Step 4: Write test for car-profiles**

```js
// tests/test-car-profiles.js
import assert from 'node:assert';
import { detectPlatform, getMakes, getModels, getModelSpecs } from '../js/car-profiles.js';

// Test platform detection
assert.strictEqual(
  detectPlatform(['[8C.BMS] Batteriestrom', '[19.Gate] Reichweite']),
  'meb',
  'Should detect MEB platform from [8C.BMS] PID'
);
assert.strictEqual(
  detectPlatform(['Speed', 'RPM', 'Throttle']),
  null,
  'Should return null for unknown PIDs'
);

// Test getMakes
const makes = getMakes('meb');
assert.ok(makes.includes('Skoda'), 'MEB makes should include Skoda');
assert.ok(makes.includes('VW'), 'MEB makes should include VW');
assert.deepStrictEqual(getMakes('unknown'), [], 'Unknown platform returns empty array');

// Test getModels
const models = getModels('meb', 'Skoda');
assert.ok(models.includes('Enyaq iV 80'), 'Skoda models should include Enyaq iV 80');
assert.deepStrictEqual(getModels('meb', 'Unknown'), [], 'Unknown make returns empty array');

// Test getModelSpecs
const specs = getModelSpecs('meb', 'Skoda', 'Enyaq iV 80');
assert.strictEqual(specs.grossKwh, 82);
assert.strictEqual(specs.netKwh, 77);
assert.strictEqual(specs.cells, 96);
assert.strictEqual(getModelSpecs('meb', 'Skoda', 'Unknown'), null);

console.log('✓ All car-profiles tests passed');
```

- [ ] **Step 5: Run car-profiles tests**

Run: `node tests/test-car-profiles.js`
Expected: `✓ All car-profiles tests passed`

- [ ] **Step 6: Commit**

```bash
git add js/i18n.js js/car-profiles.js tests/test-car-profiles.js
git commit -m "feat: add i18n translations and car profiles with MEB platform data"
```

---

### Task 2: CSV Parser

**Files:**
- Create: `js/parser.js`
- Create: `tests/test-parser.js`
- Create: `tests/sample.csv`

- [ ] **Step 1: Copy sample CSV for tests**

```bash
cp "2026-03-20 18-31-35.csv" tests/sample.csv
```

- [ ] **Step 2: Write the failing test for CSV parsing**

```js
// tests/test-parser.js
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { parseCSV, extractDateFromFilename } from '../js/parser.js';

// Test filename date extraction
assert.strictEqual(
  extractDateFromFilename('2026-03-20 18-31-35.csv'),
  '2026-03-20',
  'Should extract date from filename'
);
assert.strictEqual(
  extractDateFromFilename('random-export.csv'),
  null,
  'Should return null for non-date filenames'
);

// Test CSV parsing with real data
const csv = readFileSync(new URL('./sample.csv', import.meta.url), 'utf-8');
const result = parseCSV(csv);

// Should have rows
assert.ok(result.rows.length > 0, 'Should parse rows');

// Each row should have seconds, pid, value, units
const firstRow = result.rows[0];
assert.ok('seconds' in firstRow, 'Row should have seconds');
assert.ok('pid' in firstRow, 'Row should have pid');
assert.ok('value' in firstRow, 'Row should have value');
assert.ok('units' in firstRow, 'Row should have units');

// Should extract unique PID names
assert.ok(result.pidNames.length > 10, 'Should have many unique PIDs');
assert.ok(
  result.pidNames.some(p => p.includes('Batteriezellspannung Zelle')),
  'Should contain cell voltage PIDs'
);

// Should count data points
assert.ok(result.totalPoints > 3000, 'Should have >3000 data points');

// Test getLatestValues
const latest = result.getLatestValues();
assert.ok(latest instanceof Map, 'getLatestValues returns a Map');
assert.ok(latest.size > 10, 'Should have many latest values');

// Test getCellVoltages — should return ordered array
const cellVoltages = result.getCellVoltages();
assert.strictEqual(cellVoltages.length, 96, 'Should have 96 cell voltages for MEB');
assert.ok(cellVoltages[0] > 3.0 && cellVoltages[0] < 4.5, 'Cell voltage should be in range');

// Test getTemperatures
const temps = result.getTemperatures();
assert.ok(temps.length > 0, 'Should have temperature readings');
assert.ok(temps.length <= 24, 'Should have at most 24 temp sensors');

console.log('✓ All parser tests passed');
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node tests/test-parser.js`
Expected: FAIL — module not found

- [ ] **Step 4: Write `js/parser.js`**

```js
// js/parser.js

/**
 * Extract date (YYYY-MM-DD) from Car Scanner filename pattern.
 * e.g. "2026-03-20 18-31-35.csv" → "2026-03-20"
 */
export function extractDateFromFilename(filename) {
  const match = filename.match(/^(\d{4}-\d{2}-\d{2})\s/);
  return match ? match[1] : null;
}

/**
 * Parse a Car Scanner CSV string.
 * Format: semicolon-delimited, all fields quoted, trailing semicolon.
 * Columns: SECONDS;PID;VALUE;UNITS;
 *
 * Returns an object with:
 *  - rows: array of { seconds, pid, value, units }
 *  - pidNames: unique PID names
 *  - totalPoints: number of data rows
 *  - getLatestValues(): Map<pid, { value, units }>
 *  - getCellVoltages(): number[] ordered by cell number
 *  - getTemperatures(): number[] ordered by sensor number
 *  - getCellCount(): number
 *  - getTempCount(): number
 */
export function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const rows = [];
  const pidSet = new Set();

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Remove quotes and split by semicolon
    // Format: "val1";"val2";"val3";"val4";
    const parts = line.split(';')
      .map(p => p.replace(/^"|"$/g, '').trim())
      .filter(p => p !== '');

    if (parts.length < 4) continue;

    const seconds = parseFloat(parts[0]);
    const pid = parts[1];
    const value = parseFloat(parts[2]);
    const units = parts[3];

    if (isNaN(seconds) || isNaN(value)) continue;

    rows.push({ seconds, pid, value, units });
    pidSet.add(pid);
  }

  const pidNames = [...pidSet].sort();

  return {
    rows,
    pidNames,
    totalPoints: rows.length,

    getLatestValues() {
      const latest = new Map();
      // Rows are roughly time-ordered; last occurrence wins
      for (const row of rows) {
        latest.set(row.pid, { value: row.value, units: row.units });
      }
      return latest;
    },

    getCellVoltages() {
      return getNumberedPidValues(
        rows, pidNames,
        /Batteriezellspannung Zelle (\d+)/
      );
    },

    getTemperatures() {
      return getNumberedPidValues(
        rows, pidNames,
        /Hochvoltbatterie Temperatur Punkt (\d+)/
      );
    },

    getCellCount() {
      return pidNames.filter(p => /Batteriezellspannung Zelle \d+/.test(p)).length;
    },

    getTempCount() {
      return pidNames.filter(p => /Hochvoltbatterie Temperatur Punkt \d+/.test(p)).length;
    },
  };
}

/**
 * Extract latest values for numbered PIDs (e.g. cell voltages, temperatures),
 * returning them ordered by their number.
 */
function getNumberedPidValues(rows, pidNames, pattern) {
  const matching = [];
  for (const pid of pidNames) {
    const m = pid.match(pattern);
    if (m) matching.push({ pid, num: parseInt(m[1], 10) });
  }
  matching.sort((a, b) => a.num - b.num);

  // Get last value for each PID (use Set for O(1) lookup)
  const matchingPids = new Set(matching.map(m => m.pid));
  const lastValues = new Map();
  for (const row of rows) {
    if (matchingPids.has(row.pid)) {
      lastValues.set(row.pid, row.value);
    }
  }

  return matching.map(m => lastValues.get(m.pid) ?? null);
}

/**
 * Extract CSV text from a ZIP file using JSZip (browser only).
 * Returns the CSV text content from the first .csv file found.
 */
export async function extractCSVFromZip(zipArrayBuffer) {
  // JSZip is loaded via CDN in the browser
  const zip = await JSZip.loadAsync(zipArrayBuffer);
  const csvFile = Object.keys(zip.files).find(name => name.endsWith('.csv'));
  if (!csvFile) throw new Error('No CSV file found in ZIP');
  return {
    text: await zip.files[csvFile].async('string'),
    filename: csvFile,
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node tests/test-parser.js`
Expected: `✓ All parser tests passed`

- [ ] **Step 6: Commit**

```bash
git add js/parser.js tests/test-parser.js tests/sample.csv
git commit -m "feat: add CSV parser with cell voltage and temperature extraction"
```

---

### Task 3: Data Analyzer

**Files:**
- Create: `js/analyzer.js`
- Create: `tests/test-analyzer.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/test-analyzer.js
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { parseCSV } from '../js/parser.js';
import { analyze, computeBalanceScore, runHealthChecks } from '../js/analyzer.js';

// Parse real sample data
const csv = readFileSync(new URL('./sample.csv', import.meta.url), 'utf-8');
const parsed = parseCSV(csv);

// Test balance score computation
assert.strictEqual(computeBalanceScore(0), 100, 'Zero delta = 100%');
assert.strictEqual(computeBalanceScore(0.020), 0, '20mV delta = 0%');
assert.strictEqual(computeBalanceScore(0.010), 50, '10mV delta = 50%');
assert.ok(computeBalanceScore(0.007) > 60, '7mV delta should be > 60%');

// Test full analysis
const vehicleInfo = {
  make: 'Skoda',
  model: 'Enyaq iV 80',
  mileage: 56483,
  grossKwh: 82,
  netKwh: 77,
  userSoh: null,
};
const result = analyze(parsed, vehicleInfo);

// Check structure
assert.ok(result.meta, 'Should have meta');
assert.ok(result.vehicle, 'Should have vehicle');
assert.ok(result.cells, 'Should have cells');
assert.ok(result.temperatures, 'Should have temperatures');
assert.ok(result.bms, 'Should have bms');
assert.ok(result.energy, 'Should have energy');
assert.ok(result.healthChecks, 'Should have healthChecks');
assert.ok(result.allPids, 'Should have allPids');

// Check cells
assert.strictEqual(result.cells.count, 96, 'Should have 96 cells');
assert.strictEqual(result.cells.voltages.length, 96, 'Should have 96 voltage values');
assert.ok(result.cells.min.value > 3.0, 'Min voltage should be > 3.0V');
assert.ok(result.cells.max.value < 4.5, 'Max voltage should be < 4.5V');
assert.ok(result.cells.delta < 0.020, 'Delta should be < 20mV for healthy battery');
assert.ok(result.cells.balanceScore > 50, 'Balance score should be > 50 for healthy battery');

// Check temperatures
assert.ok(result.temperatures.count > 0, 'Should have temp sensors');
assert.ok(result.temperatures.values.length > 0, 'Should have temp values');

// Check health checks
assert.ok(result.healthChecks.cellSpreadOk, 'Cell spread should be OK');

// Check allPids groups
assert.ok(Object.keys(result.allPids).length > 0, 'Should have PID groups');
assert.ok(result.allPids['8C.BMS'], 'Should have 8C.BMS group');

console.log('✓ All analyzer tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/test-analyzer.js`
Expected: FAIL — module not found

- [ ] **Step 3: Write `js/analyzer.js`**

```js
// js/analyzer.js

/**
 * Compute cell balance score from voltage delta.
 * 0 delta = 100%, 20mV delta = 0%, linear.
 */
export function computeBalanceScore(delta) {
  const thresholdV = 0.020; // 20 mV
  const score = Math.max(0, Math.min(100, (1 - delta / thresholdV) * 100));
  return Math.round(score * 10) / 10;
}

/**
 * Get score label from balance score.
 */
export function getScoreLabel(score) {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
}

/**
 * Get assessment level from health checks.
 * Returns 'excellent', 'good', or 'attention'.
 */
export function getAssessmentLevel(healthChecks) {
  const checks = Object.values(healthChecks);
  const failCount = checks.filter(v => v === false).length;
  if (failCount === 0) return 'excellent';
  if (failCount <= 2) return 'good';
  return 'attention';
}

/**
 * Run health checks on analyzed data.
 */
export function runHealthChecks(cells, temperatures, bms) {
  const cellDeltaMv = cells.delta * 1000;
  const tempDelta = temperatures.count > 0 ? temperatures.delta : 0;

  // Check for outlier cells (> 2 std deviations from mean)
  const voltages = cells.voltages.filter(v => v !== null);
  const mean = voltages.reduce((a, b) => a + b, 0) / voltages.length;
  const stdDev = Math.sqrt(
    voltages.reduce((sum, v) => sum + (v - mean) ** 2, 0) / voltages.length
  );
  const hasOutliers = voltages.some(v => Math.abs(v - mean) > 2 * stdDev);

  return {
    cellSpreadOk: cellDeltaMv < 20,
    tempSpreadOk: tempDelta < 5,
    cellsInRange: voltages.every(v => v >= 3.0 && v <= 4.2),
    voltageConsistent: bms.packVoltage != null && bms.cellSumVoltage != null
      ? Math.abs(bms.packVoltage - bms.cellSumVoltage) < 1.0
      : true,
    noOutliers: !hasOutliers,
    socAvailable: bms.socDisplay != null || bms.socBms != null,
  };
}

/**
 * Generate a report ID from date and a hash.
 */
function generateReportId(dateStr) {
  const hash = Math.random().toString(16).substring(2, 6).toUpperCase();
  const datePart = (dateStr || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
  return `CS-${datePart}-${hash}`;
}

/**
 * Compute stats (min, max, avg, delta) for an array of numbers.
 */
function computeStats(values) {
  const valid = values.filter(v => v !== null && !isNaN(v));
  if (valid.length === 0) return { min: null, max: null, avg: null, delta: null };

  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  return {
    min,
    max,
    avg: Math.round(avg * 1000) / 1000,
    delta: Math.round((max - min) * 1000) / 1000,
  };
}

/**
 * Group all PIDs by module prefix and compute stats for each.
 * Module prefix pattern: [XX.YYY] or generic.
 */
function groupPidsByModule(rows, pidNames) {
  const groups = {};
  const modulePattern = /^\[([^\]]+)\]/;

  for (const pid of pidNames) {
    const match = pid.match(modulePattern);
    const module = match ? match[1] : 'Generic OBD';

    if (!groups[module]) groups[module] = {};

    // Collect all values for this PID
    const values = rows
      .filter(r => r.pid === pid)
      .map(r => r.value);

    const last = values[values.length - 1];
    const units = rows.find(r => r.pid === pid)?.units || '';

    // Clean PID name (remove module prefix)
    const cleanName = match ? pid.replace(modulePattern, '').trim() : pid;

    groups[module][cleanName] = {
      fullPid: pid,
      last,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 1000) / 1000,
      units,
      count: values.length,
    };
  }

  return groups;
}

/**
 * Get a specific PID's latest value from the latest values Map.
 * Tries exact match first, then partial match (to handle platform suffixes).
 */
function getPidValue(latestValues, pidSubstring) {
  // Exact match
  if (latestValues.has(pidSubstring)) {
    return latestValues.get(pidSubstring).value;
  }
  // Partial match (handles suffixes like "(Macan EV, Q6 eTron)")
  for (const [pid, data] of latestValues) {
    if (pid.includes(pidSubstring)) return data.value;
  }
  return null;
}

/**
 * Main analysis function.
 * Takes parsed CSV data and vehicle info, returns the full reportData structure.
 */
export function analyze(parsed, vehicleInfo, dateStr = null) {
  const latestValues = parsed.getLatestValues();
  const cellVoltages = parsed.getCellVoltages();
  const temperatures = parsed.getTemperatures();

  // Cell stats
  const cellStats = computeStats(cellVoltages);
  const cellMinIndex = cellVoltages.indexOf(cellStats.min);
  const cellMaxIndex = cellVoltages.indexOf(cellStats.max);
  const balanceScore = computeBalanceScore(cellStats.delta || 0);

  // Temperature stats
  const tempStats = computeStats(temperatures);

  // BMS data
  const bms = {
    socDisplay: getPidValue(latestValues, '[8C.BMS] Ladezustand Anzeige'),
    socBms: getPidValue(latestValues, '[8C.BMS] Ladezustand Batteriemanagementsystem'),
    packVoltage: getPidValue(latestValues, '[8C.BMS] Batteriespannung'),
    cellSumVoltage: getPidValue(latestValues, '[8C.BMS] Batteriespannung, Summe der Zellspannungen'),
    current: getPidValue(latestValues, '[8C.BMS] Batteriestrom'),
    power: getPidValue(latestValues, '[8C.BMS] Batterieleistung'),
    chargeVoltageLimit: getPidValue(latestValues, '[8C.BMS] Hochvoltbatterie Ladespannung'),
    maxChargeCurrent: getPidValue(latestValues, '[8C.BMS] Dynamischer Grenzwert für das Laden in Ampere'),
  };

  // Energy data
  const energy = {
    current: getPidValue(latestValues, '[19.Gate] Hochvoltbatterie Energiegehalt'),
    max: getPidValue(latestValues, '[19.Gate] maximaler Energiegehalt der Traktionsbatterie'),
    ratio: null,
    estimatedRange: getPidValue(latestValues, '[19.Gate] geschätzte Reichweite (Anzeige)'),
  };
  if (energy.current != null && energy.max != null && energy.max > 0) {
    energy.ratio = Math.round((energy.current / energy.max) * 1000) / 1000;
  }

  // 12V auxiliary battery
  const aux12v = {
    voltage: getPidValue(latestValues, '[19.Gate] 12V Batteriespannung'),
    soc: getPidValue(latestValues, '[19.Gate] 12V Batterieladezustand'),
    temperature: getPidValue(latestValues, '[19.Gate] 12V Batterietemperatur'),
    capacityAging: getPidValue(latestValues, '[19.Gate] 12V Batteriealterung nach Kapazität'),
  };

  // Health checks
  const cells = {
    count: parsed.getCellCount(),
    voltages: cellVoltages,
    min: { value: cellStats.min, cell: cellMinIndex + 1 },
    max: { value: cellStats.max, cell: cellMaxIndex + 1 },
    avg: cellStats.avg,
    delta: cellStats.delta,
    balanceScore,
  };

  const temperaturesData = {
    count: parsed.getTempCount(),
    values: temperatures,
    min: tempStats.min,
    max: tempStats.max,
    avg: tempStats.avg,
    delta: tempStats.delta,
  };

  const healthChecks = runHealthChecks(cells, temperaturesData, bms);

  // All PIDs grouped
  const allPids = groupPidsByModule(parsed.rows, parsed.pidNames);

  return {
    meta: {
      date: dateStr || new Date().toISOString().slice(0, 10),
      reportId: generateReportId(dateStr),
      sourceFile: null, // set by caller
    },
    vehicle: { ...vehicleInfo },
    cells,
    temperatures: temperaturesData,
    bms,
    energy,
    aux12v,
    healthChecks,
    allPids,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node tests/test-analyzer.js`
Expected: `✓ All analyzer tests passed`

- [ ] **Step 5: Commit**

```bash
git add js/analyzer.js tests/test-analyzer.js
git commit -m "feat: add data analyzer with cell balance score and health checks"
```

---

### Task 4: HTML Structure + CSS

**Files:**
- Create: `index.html`
- Create: `css/style.css`

- [ ] **Step 1: Write `index.html`**

Full page with all 3 states (upload, form, report). Only one state visible at a time via CSS classes. CDN script tags for Chart.js, JSZip, pako, jsPDF, html2canvas. ES module script tags for app JS. Contains:

- **State 1 (`.state-upload`)**: header, drag & drop zone with file input, language toggle, privacy note
- **State 2 (`.state-form`)**: file summary, car info form (make/model/mileage/date/soh/capacity dropdowns and inputs), generate button
- **State 3 (`.state-report`)**: tab bar (Report / Details), report container div, details container div, action buttons (PDF, Share, New Upload)
- Footer with language toggle
- All text content uses `data-i18n` attributes for translation

The HTML should contain the structural skeleton only — no hardcoded data values. All dynamic content is rendered by JS modules.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EV Battery Health Report</title>
  <link rel="stylesheet" href="css/style.css">
  <!-- CDN dependencies -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/jszip@3/dist/jszip.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/pako@2/dist/pako.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/jspdf@2/dist/jspdf.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/html2canvas@1/dist/html2canvas.min.js"></script>
</head>
<body>
  <div id="app">
    <!-- STATE 1: Upload -->
    <section id="state-upload" class="state active">
      <div class="container">
        <h1 data-i18n="title">EV Battery Health Report</h1>
        <p class="subtitle" data-i18n="subtitle">Upload your Car Scanner export to analyze your EV battery</p>
        <div id="drop-zone" class="drop-zone">
          <div class="drop-icon">&#9889;</div>
          <p class="drop-text" data-i18n="dropPrompt">Drop your .zip or .csv file here</p>
          <p class="drop-or" data-i18n="orText">or</p>
          <label class="btn btn-primary" for="file-input">
            <span data-i18n="browseFiles">Browse Files</span>
          </label>
          <input type="file" id="file-input" accept=".zip,.csv" hidden>
          <p class="drop-hint" data-i18n="exportedFrom">Exported from Car Scanner ELM OBD2 app</p>
        </div>
        <p class="privacy-note" data-i18n="privacyNote">All processing happens locally in your browser</p>
      </div>
    </section>

    <!-- STATE 2: Car Info Form -->
    <section id="state-form" class="state">
      <div class="container">
        <h1 data-i18n="title">EV Battery Health Report</h1>
        <div class="file-summary">
          <strong data-i18n="fileLoaded">File loaded</strong>: <span id="file-name"></span>
          <p id="parse-summary" class="parse-summary"></p>
        </div>
        <form id="car-info-form" class="car-form">
          <div class="form-grid">
            <div class="form-group">
              <label data-i18n="carMake">Car Make</label>
              <select id="car-make"><option value="">--</option></select>
            </div>
            <div class="form-group">
              <label data-i18n="carModel">Model</label>
              <select id="car-model"><option value="">--</option></select>
            </div>
            <div class="form-group">
              <label data-i18n="mileage">Mileage (km)</label>
              <input type="number" id="car-mileage" placeholder="e.g. 56483">
            </div>
            <div class="form-group">
              <label data-i18n="dateOfReading">Date of Reading</label>
              <input type="date" id="reading-date">
            </div>
            <div class="form-group">
              <label data-i18n="knownSoh">Known SOH % (optional)</label>
              <input type="number" id="known-soh" step="0.1" min="0" max="100" placeholder="e.g. 96.7">
            </div>
            <div class="form-group">
              <label data-i18n="batteryCapacity">Battery Capacity</label>
              <input type="text" id="battery-capacity" disabled>
            </div>
          </div>
          <button type="submit" class="btn btn-success" data-i18n="generateReport">Generate Report</button>
        </form>
      </div>
    </section>

    <!-- STATE 3: Report -->
    <section id="state-report" class="state">
      <div class="container">
        <div class="tab-bar">
          <button class="tab active" data-tab="report" data-i18n="reportTab">Report</button>
          <button class="tab" data-tab="details" data-i18n="detailsTab">Details</button>
        </div>
        <div id="report-content" class="tab-content active"></div>
        <div id="details-content" class="tab-content"></div>
        <div class="actions">
          <button class="btn btn-secondary" id="btn-pdf" data-i18n="printPdf">Print / PDF</button>
          <button class="btn btn-secondary" id="btn-share" data-i18n="shareLink">Share Link</button>
          <button class="btn btn-secondary" id="btn-new" data-i18n="newUpload">New Upload</button>
        </div>
      </div>
    </section>

    <!-- Error toast -->
    <div id="toast" class="toast hidden"></div>
  </div>

  <footer>
    <div class="lang-toggle">
      <button class="lang-btn" data-lang="en">EN</button>
      <span>|</span>
      <button class="lang-btn" data-lang="de">DE</button>
    </div>
  </footer>

  <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write `css/style.css`**

```css
/* css/style.css — Mobile-first responsive */

/* === Reset & Base === */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #f8fafc;
  --bg-card: #ffffff;
  --bg-upload: #0f172a;
  --text: #1e293b;
  --text-muted: #64748b;
  --text-light: #94a3b8;
  --border: #e2e8f0;
  --primary: #3b82f6;
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;
  --info-bg: #e0f2fe;
  --radius: 12px;
  --radius-sm: 8px;
}

html { font-size: 16px; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.5;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* === State Visibility === */
.state { display: none; }
.state.active { display: block; }
.tab-content { display: none; }
.tab-content.active { display: block; }

/* === Container === */
.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

/* === Upload State === */
#state-upload {
  background: var(--bg-upload);
  color: white;
  min-height: 100vh;
  display: flex;
  align-items: center;
}
#state-upload .container { text-align: center; }
#state-upload h1 { font-size: 1.75rem; margin-bottom: 0.5rem; }
.subtitle { color: var(--text-light); margin-bottom: 2rem; }

.drop-zone {
  border: 2px dashed #475569;
  border-radius: var(--radius);
  padding: 3rem 1.5rem;
  max-width: 500px;
  margin: 0 auto;
  transition: border-color 0.2s, background 0.2s;
  cursor: pointer;
}
.drop-zone.drag-over {
  border-color: var(--primary);
  background: rgba(59, 130, 246, 0.1);
}
.drop-icon { font-size: 2.5rem; margin-bottom: 1rem; }
.drop-text { font-weight: 600; margin-bottom: 0.5rem; }
.drop-or { color: var(--text-light); margin-bottom: 1rem; }
.drop-hint { color: var(--text-muted); font-size: 0.8rem; margin-top: 1rem; }
.privacy-note { color: var(--text-muted); font-size: 0.85rem; margin-top: 2rem; }

/* === Form State === */
#state-form { background: var(--bg-upload); color: white; min-height: 100vh; }
#state-form h1 { font-size: 1.5rem; margin-bottom: 1rem; }
.file-summary { margin-bottom: 1.5rem; }
.parse-summary { color: var(--success); font-size: 0.9rem; margin-top: 0.25rem; }
.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.form-group label {
  display: block;
  font-size: 0.8rem;
  color: var(--text-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}
.form-group input,
.form-group select {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #475569;
  border-radius: var(--radius-sm);
  background: #1e293b;
  color: white;
  font-size: 0.95rem;
}
.form-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.form-group select option { background: #1e293b; color: white; }

/* === Buttons === */
.btn {
  display: inline-block;
  padding: 0.6rem 1.5rem;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  text-decoration: none;
}
.btn:hover { opacity: 0.85; }
.btn-primary { background: var(--primary); color: white; }
.btn-success { background: var(--success); color: white; }
.btn-secondary { background: #334155; color: white; }

/* === Report State === */
#state-report { background: var(--bg); }
.tab-bar { display: flex; gap: 0; margin-bottom: 1.5rem; }
.tab {
  padding: 0.6rem 1.5rem;
  background: #e2e8f0;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-muted);
  transition: background 0.2s, color 0.2s;
}
.tab:first-child { border-radius: var(--radius-sm) 0 0 var(--radius-sm); }
.tab:last-child { border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
.tab.active { background: var(--primary); color: white; }
.actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; flex-wrap: wrap; }

/* === Report Sections === */
.report { background: var(--bg); }
.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 3px solid var(--primary);
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}
.report-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.report-title { font-size: 1.3rem; font-weight: 700; }
.report-meta { font-size: 0.8rem; color: var(--text-muted); text-align: right; }

.vehicle-bar {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  background: var(--info-bg);
  border-radius: var(--radius-sm);
  padding: 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.85rem;
}
.vehicle-bar .label { color: var(--text-muted); display: block; font-size: 0.75rem; }

.report-section, .detail-section {
  background: var(--bg-card);
  border-radius: var(--radius);
  padding: 1.25rem;
  border: 1px solid var(--border);
  margin-bottom: 1.25rem;
}
.section-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 0.75rem;
}
.section-sub { font-size: 0.8rem; color: var(--text-light); margin-bottom: 0.75rem; }
.section-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; }

/* Score card */
.score-energy-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  margin-bottom: 1.25rem;
}
.score-card { text-align: center; }
.score-big { font-size: 3rem; font-weight: 800; line-height: 1.2; }
.score-subtitle { font-size: 0.85rem; color: var(--text-muted); }
.score-badge {
  display: inline-block;
  margin-top: 0.75rem;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.75rem;
}

/* Key-value grid */
.kv-grid { display: grid; grid-template-columns: 1fr; gap: 0.4rem; font-size: 0.85rem; }
.kv-row { display: flex; justify-content: space-between; }
.kv-row span { color: var(--text-muted); }
.soh-row strong { color: var(--warning); }

/* Health checks */
.health-check-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
  font-size: 0.85rem;
}
.check-item.fail { color: var(--danger); }

/* Stats row */
.stats-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  background: #f1f5f9;
  border-radius: var(--radius-sm);
  padding: 0.75rem;
  font-size: 0.85rem;
  margin-top: 0.75rem;
}

/* Assessment */
.assessment {
  border: 1px solid;
  border-radius: var(--radius);
  padding: 1.25rem;
  margin-bottom: 1.25rem;
  font-size: 0.9rem;
}

/* Disclaimer */
.disclaimer {
  font-size: 0.7rem;
  color: var(--text-light);
  border-top: 1px solid var(--border);
  padding-top: 0.75rem;
  margin-top: 1rem;
}

/* === Details Tab === */
.cell-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 3px;
  margin-bottom: 0.75rem;
}
.cell-tile {
  height: 32px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.55rem;
  color: white;
  font-weight: 600;
}

.temp-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  margin-bottom: 0.75rem;
}
.temp-tile {
  height: 36px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: white;
  font-weight: 600;
}

/* Legend */
.legend { font-size: 0.7rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
.legend-dot { width: 10px; height: 10px; border-radius: 2px; display: inline-block; }

/* Color helpers */
.text-green { color: var(--success); }
.text-red { color: var(--danger); }

/* All Parameters */
.pid-group { margin-bottom: 0.5rem; }
.pid-group summary {
  cursor: pointer;
  padding: 0.5rem;
  background: #f1f5f9;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 600;
}
.table-wrapper { overflow-x: auto; margin-top: 0.5rem; }
.pid-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}
.pid-table th, .pid-table td {
  padding: 0.4rem 0.6rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
.pid-table th { color: var(--text-muted); font-weight: 600; }

/* === Toast === */
.toast {
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: #334155;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  z-index: 1000;
  transition: opacity 0.3s;
}
.toast.hidden { opacity: 0; pointer-events: none; }

/* === Footer === */
footer {
  text-align: center;
  padding: 1rem;
  margin-top: auto;
}
.lang-toggle { display: flex; justify-content: center; gap: 0.5rem; align-items: center; }
.lang-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.25rem 0.5rem;
}
.lang-btn.active { color: var(--primary); font-weight: 700; }

/* === Desktop (>= 768px) === */
@media (min-width: 768px) {
  .container { padding: 2rem; }
  #state-upload h1 { font-size: 2.25rem; }
  .form-grid { grid-template-columns: 1fr 1fr; }
  .vehicle-bar { grid-template-columns: repeat(4, 1fr); }
  .score-energy-row { grid-template-columns: 1fr 1fr; }
  .health-check-grid { grid-template-columns: 1fr 1fr; }
  .stats-row { grid-template-columns: repeat(4, 1fr); }
  .cell-grid { grid-template-columns: repeat(20, 1fr); }
  .temp-grid { grid-template-columns: repeat(6, 1fr); }
  .cell-tile { font-size: 0.6rem; }
}

/* === Print === */
@media print {
  #state-upload, #state-form, footer, .tab-bar, .actions, .toast { display: none !important; }
  #state-report { display: block !important; }
  #report-content { display: block !important; }
  #details-content { display: none !important; }
  .report-section { break-inside: avoid; }
  body { background: white; }
}
```

- [ ] **Step 3: Open in browser and verify layout**

Run: open `index.html` in a browser. Verify:
- Upload state shows with drop zone centered
- Language toggle visible in footer
- Responsive: resize browser to check mobile layout

- [ ] **Step 4: Commit**

```bash
git add index.html css/style.css
git commit -m "feat: add HTML structure and responsive CSS for all page states"
```

---

### Task 5: App Controller

**Files:**
- Create: `js/app.js`

- [ ] **Step 1: Write `js/app.js`**

This is the main orchestration module. It:

1. **Initializes i18n** — applies translations to all `[data-i18n]` elements, sets up language toggle buttons
2. **Checks URL hash** — if hash data present, decodes and renders report (skip upload). Uses `decodeShareData()` from `export.js`.
3. **File upload handling**:
   - Drag & drop events on `#drop-zone` (dragover, dragleave, drop)
   - File input change event on `#file-input`
   - On file received: if `.zip`, extract CSV via `extractCSVFromZip()`; if `.csv`, read as text
   - Parse CSV via `parseCSV()`
   - Auto-detect platform via `detectPlatform()`
   - Auto-detect date from filename via `extractDateFromFilename()`
   - Populate make/model dropdowns from car-profiles
   - Show file summary (cell count, temp count, data points)
   - Switch to state-form
4. **Car info form**:
   - Make dropdown change → populate model dropdown
   - Model dropdown change → fill battery capacity from `getModelSpecs()`
   - Form submit → collect vehicle info, run `analyze()`, render report & details, switch to state-report
5. **Tab switching**: click tab buttons to toggle `.active` on tabs and tab-content divs
6. **Action buttons**:
   - PDF: call `generatePDF()` from export.js
   - Share: call `encodeShareData()` from export.js, copy URL to clipboard, show toast
   - New Upload: reset to state-upload
7. **State management**: `setState('upload' | 'form' | 'report')` toggles `.active` class on state sections
8. **Toast notifications**: show/hide `#toast` with message, auto-hide after 3 seconds

```js
// js/app.js
import { t, setLanguage, getLanguage } from './i18n.js';
import { parseCSV, extractCSVFromZip, extractDateFromFilename } from './parser.js';
import { analyze } from './analyzer.js';
import { detectPlatform, getMakes, getModels, getModelSpecs } from './car-profiles.js';
import { renderReport } from './report.js';
import { renderDetails } from './details.js';
import { generatePDF, encodeShareData, decodeShareData } from './export.js';

let parsedData = null;
let reportData = null;
let detectedPlatform = null;

// --- State Management ---
function setState(state) {
  document.querySelectorAll('.state').forEach(el => el.classList.remove('active'));
  document.getElementById(`state-${state}`).classList.add('active');
}

// --- i18n ---
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  // Update active language button
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === getLanguage());
  });
}

// --- Toast ---
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), duration);
}

// --- File Handling ---
async function handleFile(file) {
  try {
    let csvText, filename;

    if (file.name.endsWith('.zip')) {
      const buffer = await file.arrayBuffer();
      const result = await extractCSVFromZip(buffer);
      csvText = result.text;
      filename = result.filename;
    } else if (file.name.endsWith('.csv')) {
      csvText = await file.text();
      filename = file.name;
    } else {
      showToast(t('invalidFile'));
      return;
    }

    parsedData = parseCSV(csvText);

    if (parsedData.getCellCount() === 0) {
      showToast(t('noBatteryData'));
      return;
    }

    // Auto-detect platform
    detectedPlatform = detectPlatform(parsedData.pidNames);

    // Show file info
    document.getElementById('file-name').textContent = filename;
    document.getElementById('parse-summary').textContent = t('foundCells', {
      cells: parsedData.getCellCount(),
      temps: parsedData.getTempCount(),
      points: parsedData.totalPoints,
    });

    // Auto-detect date from filename
    const date = extractDateFromFilename(filename);
    if (date) {
      document.getElementById('reading-date').value = date;
    }

    // Populate make dropdown
    populateMakeDropdown();

    setState('form');
  } catch (e) {
    console.error(e);
    showToast(t('parseError'));
  }
}

function populateMakeDropdown() {
  const makeSelect = document.getElementById('car-make');
  makeSelect.innerHTML = '<option value="">--</option>';

  if (detectedPlatform) {
    const makes = getMakes(detectedPlatform);
    makes.forEach(make => {
      const opt = document.createElement('option');
      opt.value = make;
      opt.textContent = make;
      makeSelect.appendChild(opt);
    });
  }
  // Always add "Other"
  const otherOpt = document.createElement('option');
  otherOpt.value = 'Other';
  otherOpt.textContent = t('other');
  makeSelect.appendChild(otherOpt);
}

function populateModelDropdown(make) {
  const modelSelect = document.getElementById('car-model');
  modelSelect.innerHTML = '<option value="">--</option>';

  if (detectedPlatform && make && make !== 'Other') {
    const models = getModels(detectedPlatform, make);
    models.forEach(model => {
      const opt = document.createElement('option');
      opt.value = model;
      opt.textContent = model;
      modelSelect.appendChild(opt);
    });
  }
}

function updateCapacity(make, model) {
  const capacityInput = document.getElementById('battery-capacity');
  if (detectedPlatform && make && model) {
    const specs = getModelSpecs(detectedPlatform, make, model);
    if (specs) {
      capacityInput.value = `${specs.netKwh} kWh (net) / ${specs.grossKwh} kWh (gross)`;
      return specs;
    }
  }
  capacityInput.value = '';
  return null;
}

// --- Report Generation ---
function generateReportFromForm() {
  const make = document.getElementById('car-make').value;
  const model = document.getElementById('car-model').value;
  const mileage = parseInt(document.getElementById('car-mileage').value) || null;
  const date = document.getElementById('reading-date').value || null;
  const userSoh = parseFloat(document.getElementById('known-soh').value) || null;

  const specs = detectedPlatform && make && model
    ? getModelSpecs(detectedPlatform, make, model)
    : null;

  const vehicleInfo = {
    make: make || 'Unknown',
    model: model || 'Unknown',
    mileage,
    grossKwh: specs?.grossKwh || null,
    netKwh: specs?.netKwh || null,
    userSoh,
  };

  reportData = analyze(parsedData, vehicleInfo, date);
  reportData.meta.sourceFile = document.getElementById('file-name').textContent;

  // Render both tabs
  renderReport(reportData, document.getElementById('report-content'));
  renderDetails(reportData, document.getElementById('details-content'));

  setState('report');
}

// --- Event Listeners ---
function init() {
  applyTranslations();

  // Language toggle
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setLanguage(btn.dataset.lang);
      applyTranslations();
      // Re-render report if in report state
      if (reportData && document.getElementById('state-report').classList.contains('active')) {
        renderReport(reportData, document.getElementById('report-content'));
        renderDetails(reportData, document.getElementById('details-content'));
      }
    });
  });

  // Drag & drop
  const dropZone = document.getElementById('drop-zone');
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
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  // File input
  document.getElementById('file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  });

  // Make dropdown → populate models
  document.getElementById('car-make').addEventListener('change', (e) => {
    populateModelDropdown(e.target.value);
    updateCapacity(e.target.value, '');
  });

  // Model dropdown → fill capacity
  document.getElementById('car-model').addEventListener('change', (e) => {
    updateCapacity(document.getElementById('car-make').value, e.target.value);
  });

  // Form submit
  document.getElementById('car-info-form').addEventListener('submit', (e) => {
    e.preventDefault();
    generateReportFromForm();
  });

  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`${tab.dataset.tab}-content`).classList.add('active');
    });
  });

  // Action buttons
  document.getElementById('btn-pdf').addEventListener('click', () => {
    generatePDF(reportData);
  });

  document.getElementById('btn-share').addEventListener('click', async () => {
    const url = await encodeShareData(reportData);
    await navigator.clipboard.writeText(url);
    showToast(t('linkCopied'));
  });

  document.getElementById('btn-new').addEventListener('click', () => {
    parsedData = null;
    reportData = null;
    detectedPlatform = null;
    document.getElementById('file-input').value = '';
    document.getElementById('car-info-form').reset();
    document.getElementById('report-content').innerHTML = '';
    document.getElementById('details-content').innerHTML = '';
    setState('upload');
  });

  // Check URL hash for shared report
  if (window.location.hash.length > 1) {
    decodeShareData(window.location.hash.slice(1)).then(data => {
      reportData = data;
      renderReport(reportData, document.getElementById('report-content'));
      renderDetails(reportData, document.getElementById('details-content'));
      setState('report');
    }).catch(e => {
      console.error('Failed to decode shared link:', e);
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
```

- [ ] **Step 2: Commit**

```bash
git add js/app.js
git commit -m "feat: add app controller with file upload, state management, and event wiring"
```

---

### Task 6: Report Tab Rendering

**Files:**
- Create: `js/report.js`

- [ ] **Step 1: Write `js/report.js`**

Renders the certificate-style Report tab into a container element. Uses `t()` for all text. Creates DOM elements programmatically. Sections:

1. **Header** — title, subtitle, date, report ID
2. **Vehicle info bar** — make, model, mileage, battery capacity
3. **Two-column row**: Cell Balance Score (big number with color + label + delta badge) | Energy Info (current/max/ratio/packVoltage, optional user SOH)
4. **Quick Checks** — 2-column grid of pass/fail items with check/cross icons
5. **Cell Voltage Mini Chart** — Chart.js bar chart of all cell voltages, with min/avg/max below
6. **Assessment** — colored banner with assessment text based on health check results
7. **Disclaimer** — small text

```js
// js/report.js
import { t } from './i18n.js';
import { getScoreLabel, getAssessmentLevel } from './analyzer.js';

export function renderReport(data, container) {
  container.innerHTML = '';

  const report = document.createElement('div');
  report.className = 'report';

  // 1. Header
  report.innerHTML += `
    <div class="report-header">
      <div>
        <div class="report-label">${t('title')}</div>
        <div class="report-title">${t('basedOn')}</div>
      </div>
      <div class="report-meta">
        <div><strong>${t('date')}:</strong> ${data.meta.date}</div>
        <div><strong>${t('reportId')}:</strong> ${data.meta.reportId}</div>
      </div>
    </div>
  `;

  // 2. Vehicle info bar
  const cap = data.vehicle.netKwh
    ? `${data.vehicle.netKwh} kWh`
    : '—';
  report.innerHTML += `
    <div class="vehicle-bar">
      <div><span class="label">${t('make')}</span><strong>${data.vehicle.make}</strong></div>
      <div><span class="label">${t('model')}</span><strong>${data.vehicle.model}</strong></div>
      <div><span class="label">${t('mileage')}</span><strong>${data.vehicle.mileage ? data.vehicle.mileage.toLocaleString() + ' km' : '—'}</strong></div>
      <div><span class="label">${t('battery')}</span><strong>${cap}</strong></div>
    </div>
  `;

  // 3. Score + Energy row
  const scoreLabel = getScoreLabel(data.cells.balanceScore);
  const scoreColor = data.cells.balanceScore >= 90 ? '#22c55e'
    : data.cells.balanceScore >= 70 ? '#f59e0b' : '#ef4444';
  const deltaMv = Math.round(data.cells.delta * 1000);

  let energyRows = `
    <div class="kv-row"><span>${t('currentContent')}</span><strong>${data.energy.current != null ? data.energy.current.toFixed(1) + ' kWh' : '—'}</strong></div>
    <div class="kv-row"><span>${t('maxContent')}</span><strong>${data.energy.max != null ? data.energy.max.toFixed(1) + ' kWh' : '—'}</strong></div>
    <div class="kv-row"><span>${t('ratio')}</span><strong>${data.energy.ratio != null ? (data.energy.ratio * 100).toFixed(1) + '%' : '—'}</strong></div>
    <div class="kv-row"><span>${t('packVoltage')}</span><strong>${data.bms.packVoltage != null ? data.bms.packVoltage.toFixed(1) + ' V' : '—'}</strong></div>
  `;
  if (data.vehicle.userSoh != null) {
    energyRows += `<div class="kv-row soh-row"><span>SOH</span><strong>${data.vehicle.userSoh}% <small>(${t('userProvided')})</small></strong></div>`;
  }

  report.innerHTML += `
    <div class="score-energy-row">
      <div class="report-section score-card">
        <div class="section-label">${t('cellBalanceScore')}</div>
        <div class="score-big" style="color: ${scoreColor}">${data.cells.balanceScore.toFixed(1)}%</div>
        <div class="score-subtitle">${t(scoreLabel)}</div>
        <div class="score-badge" style="background: ${scoreColor}15; color: ${scoreColor}">
          ${t('delta')}: ${deltaMv} mV ${t('acrossCells', { count: data.cells.count })}
        </div>
      </div>
      <div class="report-section energy-card">
        <div class="section-label">${t('energy')}</div>
        <div class="kv-grid">${energyRows}</div>
      </div>
    </div>
  `;

  // 4. Quick Checks
  const checks = [
    { key: 'cellSpreadOk', label: t('checkCellSpread') },
    { key: 'tempSpreadOk', label: t('checkTempSpread') },
    { key: 'cellsInRange', label: t('checkCellsInRange') },
    { key: 'voltageConsistent', label: t('checkVoltageConsistent') },
    { key: 'noOutliers', label: t('checkNoOutliers') },
    { key: 'socAvailable', label: t('checkSocAvailable') },
  ];
  const checksHtml = checks.map(c => {
    const ok = data.healthChecks[c.key];
    const icon = ok ? '&#9989;' : '&#10060;';
    return `<div class="check-item ${ok ? 'pass' : 'fail'}">${icon} ${c.label}</div>`;
  }).join('');

  report.innerHTML += `
    <div class="report-section">
      <div class="section-label">${t('quickChecks')}</div>
      <div class="health-check-grid">${checksHtml}</div>
    </div>
  `;

  // 5. Cell Voltage Mini Chart
  report.innerHTML += `
    <div class="report-section">
      <div class="section-label">${t('cellVoltagesOverview')} (${data.cells.count} ${t('cells')})</div>
      <canvas id="cell-chart-mini" height="80"></canvas>
      <div class="stats-row">
        <div>${t('min')}: <strong>${data.cells.min.value?.toFixed(3)} V</strong></div>
        <div>${t('avg')}: <strong>${data.cells.avg?.toFixed(3)} V</strong></div>
        <div>${t('max')}: <strong>${data.cells.max.value?.toFixed(3)} V</strong></div>
      </div>
    </div>
  `;

  // 6. Assessment
  const level = getAssessmentLevel(data.healthChecks);
  const assessmentColor = level === 'excellent' ? '#f0fdf4'
    : level === 'good' ? '#fefce8' : '#fef2f2';
  const assessmentBorder = level === 'excellent' ? '#86efac'
    : level === 'good' ? '#fde047' : '#fca5a5';
  const assessmentTextColor = level === 'excellent' ? '#166534'
    : level === 'good' ? '#854d0e' : '#991b1b';
  const assessmentKey = level === 'excellent' ? 'excellentCondition'
    : level === 'good' ? 'goodCondition' : 'attentionRecommended';

  report.innerHTML += `
    <div class="assessment" style="background:${assessmentColor}; border-color:${assessmentBorder}; color:${assessmentTextColor}">
      <strong>${t(assessmentKey)}</strong>
    </div>
  `;

  // 7. Disclaimer
  report.innerHTML += `<div class="disclaimer">${t('disclaimer')}</div>`;

  container.appendChild(report);

  // Render Chart.js mini chart
  renderMiniChart(data.cells);
}

function renderMiniChart(cells) {
  const canvas = document.getElementById('cell-chart-mini');
  if (!canvas) return;

  const labels = cells.voltages.map((_, i) => i + 1);
  const colors = cells.voltages.map(v => {
    if (v === null) return '#94a3b8';
    const diff = Math.abs(v - cells.avg) * 1000; // mV
    if (diff < 2) return '#22c55e';
    if (diff < 5) return '#4ade80';
    if (diff < 10) return '#f59e0b';
    return '#ef4444';
  });

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: cells.voltages,
        backgroundColor: colors,
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: {
          min: cells.min.value - 0.002,
          max: cells.max.value + 0.002,
          ticks: { callback: v => v.toFixed(3) + ' V' },
        },
      },
    },
  });
}
```

- [ ] **Step 2: Open in browser with sample data and verify Report tab renders**

Load `index.html`, upload sample CSV/ZIP, fill form, verify Report tab shows all sections with correct data.

- [ ] **Step 3: Commit**

```bash
git add js/report.js
git commit -m "feat: add report tab rendering with certificate-style layout and Chart.js"
```

---

### Task 7: Details Tab Rendering

**Files:**
- Create: `js/details.js`

- [ ] **Step 1: Write `js/details.js`**

Renders the Details tab. Sections:

1. **Cell Voltages** — responsive grid (5 cols mobile / 20 cols desktop via CSS class `.cell-grid`). Each cell tile: `<div class="cell-tile" style="background:...">3.681</div>` colored by deviation. Stats row below with min (cell#), max (cell#), avg, delta.

2. **Battery Temperature** — grid (`.temp-grid`, 4 cols mobile / 6 cols desktop). Each tile colored blue gradient by temperature. Stats row.

3. **BMS Data** — `.kv-grid` with SoC Display, SoC BMS, Pack Voltage, Cell Sum Voltage, Battery Current, Power, Charge Voltage Limit, Max Charge Current. Show "—" for null values.

4. **Energy & Range** — `.kv-grid` with Current Energy, Max Energy, Energy Ratio, Estimated Range, Odometer, Avg Consumption.

5. **12V Auxiliary Battery** — `.stats-row` with Voltage, SoC, Temperature, Capacity Aging.

6. **All Recorded Parameters** — collapsible sections per module. Each module is a `<details>` element with `<summary>` showing module name and PID count. Inside: `<table>` with columns Name, Last, Min, Max, Avg, Unit.

```js
// js/details.js
import { t } from './i18n.js';

export function renderDetails(data, container) {
  container.innerHTML = '';

  const details = document.createElement('div');
  details.className = 'details';

  // 1. Cell Voltages
  const cellTiles = data.cells.voltages.map((v, i) => {
    const bg = getCellColor(v, data.cells.avg);
    const label = v !== null ? v.toFixed(3) : '—';
    return `<div class="cell-tile" style="background:${bg}" title="${t('cell')} ${i + 1}">${label}</div>`;
  }).join('');

  details.innerHTML += `
    <div class="detail-section">
      <div class="section-header">
        <div>
          <div class="section-label">${t('cellVoltages')}</div>
          <div class="section-sub">${data.cells.count} ${t('cells')} — ${t('colorCodedByDeviation')}</div>
        </div>
        <div class="legend">
          <span class="legend-dot" style="background:#ef4444"></span> ${t('low')}
          <span class="legend-dot" style="background:#f59e0b"></span>
          <span class="legend-dot" style="background:#22c55e"></span> ${t('avg')}
          <span class="legend-dot" style="background:#f59e0b"></span>
          <span class="legend-dot" style="background:#ef4444"></span> ${t('high')}
        </div>
      </div>
      <div class="cell-grid">${cellTiles}</div>
      <div class="stats-row">
        <div>${t('min')}: <strong>${data.cells.min.value?.toFixed(3)} V</strong> <small>(${t('cell')} ${data.cells.min.cell})</small></div>
        <div>${t('max')}: <strong>${data.cells.max.value?.toFixed(3)} V</strong> <small>(${t('cell')} ${data.cells.max.cell})</small></div>
        <div>${t('avg')}: <strong>${data.cells.avg?.toFixed(3)} V</strong></div>
        <div>${t('delta')}: <strong class="${data.cells.delta * 1000 < 20 ? 'text-green' : 'text-red'}">${(data.cells.delta * 1000).toFixed(1)} mV</strong></div>
      </div>
    </div>
  `;

  // 2. Battery Temperature
  if (data.temperatures.count > 0) {
    const tempTiles = data.temperatures.values.map((v, i) => {
      const bg = getTempColor(v, data.temperatures.min, data.temperatures.max);
      return `<div class="temp-tile" style="background:${bg}">${v != null ? v.toFixed(1) : '—'}°</div>`;
    }).join('');

    details.innerHTML += `
      <div class="detail-section">
        <div class="section-label">${t('batteryTemperature')} (${data.temperatures.count} ${t('sensors')})</div>
        <div class="temp-grid">${tempTiles}</div>
        <div class="stats-row">
          <div>${t('min')}: <strong>${data.temperatures.min?.toFixed(1)}°C</strong></div>
          <div>${t('max')}: <strong>${data.temperatures.max?.toFixed(1)}°C</strong></div>
          <div>${t('avg')}: <strong>${data.temperatures.avg?.toFixed(1)}°C</strong></div>
          <div>${t('delta')}: <strong class="${data.temperatures.delta < 5 ? 'text-green' : 'text-red'}">${data.temperatures.delta?.toFixed(1)}°C</strong></div>
        </div>
      </div>
    `;
  }

  // 3. BMS Data
  details.innerHTML += `
    <div class="detail-section">
      <div class="section-label">${t('bmsData')}</div>
      <div class="kv-grid">
        ${kvRow(t('socDisplay'), fmtVal(data.bms.socDisplay, '%'))}
        ${kvRow(t('socBms'), fmtVal(data.bms.socBms, '%'))}
        ${kvRow(t('packVoltage'), fmtVal(data.bms.packVoltage, ' V', 1))}
        ${kvRow(t('cellSumVoltage'), fmtVal(data.bms.cellSumVoltage, ' V', 1))}
        ${kvRow(t('batteryCurrent'), fmtVal(data.bms.current, ' A', 1))}
        ${kvRow(t('batteryPower'), fmtVal(data.bms.power, ' kW', 2))}
        ${kvRow(t('chargeVoltageLimit'), fmtVal(data.bms.chargeVoltageLimit, ' V', 1))}
        ${kvRow(t('maxChargeCurrent'), fmtVal(data.bms.maxChargeCurrent, ' A', 1))}
      </div>
    </div>
  `;

  // 4. Energy & Range
  details.innerHTML += `
    <div class="detail-section">
      <div class="section-label">${t('energyAndRange')}</div>
      <div class="kv-grid">
        ${kvRow(t('currentEnergy'), fmtVal(data.energy.current, ' kWh', 1))}
        ${kvRow(t('maxEnergy'), fmtVal(data.energy.max, ' kWh', 1))}
        ${kvRow(t('energyRatio'), data.energy.ratio != null ? (data.energy.ratio * 100).toFixed(1) + '%' : '—')}
        ${kvRow(t('estimatedRange'), fmtVal(data.energy.estimatedRange, ' km', 0))}
        ${kvRow(t('odometer'), data.vehicle?.mileage ? data.vehicle.mileage.toLocaleString() + ' km' : '—')}
      </div>
    </div>
  `;

  // 5. 12V Auxiliary Battery
  if (data.aux12v.voltage != null || data.aux12v.soc != null) {
    details.innerHTML += `
      <div class="detail-section">
        <div class="section-label">${t('auxBattery')}</div>
        <div class="stats-row">
          <div>${t('voltage')}: <strong>${fmtVal(data.aux12v.voltage, ' V', 1)}</strong></div>
          <div>${t('soc')}: <strong>${fmtVal(data.aux12v.soc, '%')}</strong></div>
          <div>${t('temperature')}: <strong>${fmtVal(data.aux12v.temperature, '°C', 1)}</strong></div>
          <div>${t('capacityAging')}: <strong>${fmtVal(data.aux12v.capacityAging, '%')}</strong></div>
        </div>
      </div>
    `;
  }

  // 6. All Recorded Parameters
  const moduleNames = Object.keys(data.allPids).sort();
  const allParamsHtml = moduleNames.map(module => {
    const pids = data.allPids[module];
    const pidEntries = Object.entries(pids);
    const rows = pidEntries.map(([name, info]) => `
      <tr>
        <td>${name}</td>
        <td>${info.last != null ? info.last : '—'}</td>
        <td>${info.min != null ? info.min : '—'}</td>
        <td>${info.max != null ? info.max : '—'}</td>
        <td>${info.avg != null ? info.avg : '—'}</td>
        <td>${info.units}</td>
      </tr>
    `).join('');

    return `
      <details class="pid-group">
        <summary>[${module}] — ${pidEntries.length} parameters</summary>
        <div class="table-wrapper">
          <table class="pid-table">
            <thead>
              <tr>
                <th>PID</th>
                <th>${t('lastValue')}</th>
                <th>${t('min')}</th>
                <th>${t('max')}</th>
                <th>${t('avg')}</th>
                <th>${t('unit')}</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </details>
    `;
  }).join('');

  details.innerHTML += `
    <div class="detail-section">
      <div class="section-label">${t('allParameters')}</div>
      <div class="section-sub">${t('groupedByModule')}</div>
      ${allParamsHtml}
    </div>
  `;

  container.appendChild(details);
}

// --- Helpers ---

function kvRow(label, value) {
  return `<div class="kv-row"><span>${label}</span><strong>${value}</strong></div>`;
}

function fmtVal(val, suffix = '', decimals = null) {
  if (val == null) return '—';
  const num = decimals != null ? val.toFixed(decimals) : val;
  return `${num}${suffix}`;
}

function getCellColor(voltage, avg) {
  if (voltage === null) return '#94a3b8';
  const diffMv = Math.abs(voltage - avg) * 1000;
  if (diffMv < 2) return '#22c55e';
  if (diffMv < 5) return '#4ade80';
  if (diffMv < 10) return '#f59e0b';
  return '#ef4444';
}

function getTempColor(temp, minTemp, maxTemp) {
  if (temp == null || minTemp == null || maxTemp == null) return '#dbeafe';
  const range = maxTemp - minTemp;
  if (range === 0) return '#93c5fd';
  const ratio = (temp - minTemp) / range;
  // Blue (#3b82f6) to Red (#ef4444) gradient via spec requirement
  const r = Math.round(59 + ratio * (239 - 59));
  const g = Math.round(130 + ratio * (68 - 130));
  const b = Math.round(246 + ratio * (68 - 246));
  return `rgb(${r},${g},${b})`;
}
```

- [ ] **Step 2: Test in browser — verify Details tab**

Load sample data, switch to Details tab. Verify:
- Cell voltage grid shows 5 per row on mobile, 20 per row on desktop
- Temperature heatmap renders
- BMS data shows values
- All Parameters sections are collapsible
- Responsive layout works

- [ ] **Step 3: Commit**

```bash
git add js/details.js
git commit -m "feat: add details tab with cell voltage grid, temperature map, and PID tables"
```

---

### Task 8: Export Features

**Files:**
- Create: `js/export.js`
- Create: `tests/test-export.js`

- [ ] **Step 1: Write the failing test for encode/decode**

```js
// tests/test-export.js
import assert from 'node:assert';

// We test only the encode/decode logic, not PDF (which needs DOM).
// Simulate pako since it's a CDN dependency in browser.
// For Node test, use built-in zlib.
import { createDeflateRaw, createInflateRaw } from 'node:zlib';

// Import the pure encode/decode helpers
import { compressData, decompressData } from '../js/export.js';

const sampleReport = {
  meta: { date: '2026-03-20', reportId: 'CS-20260320-A7F3' },
  vehicle: { make: 'Skoda', model: 'Enyaq iV 80', mileage: 56483, netKwh: 77 },
  cells: {
    count: 96,
    voltages: Array.from({ length: 96 }, (_, i) => 3.676 + (i % 8) * 0.001),
    min: { value: 3.676, cell: 1 },
    max: { value: 3.683, cell: 8 },
    avg: 3.680,
    delta: 0.007,
    balanceScore: 65.0,
  },
  temperatures: {
    count: 24,
    values: Array.from({ length: 24 }, (_, i) => 24.0 + i * 0.1),
    min: 24.0, max: 26.3, avg: 25.15, delta: 2.3,
  },
  bms: { socDisplay: 70, socBms: 72.3, packVoltage: 353.4 },
  energy: { current: 52.3, max: 74.1, ratio: 0.706 },
  healthChecks: { cellSpreadOk: true, tempSpreadOk: true },
};

// Test round-trip (async — uses top-level await)
const compressed = await compressData(sampleReport);
assert.ok(typeof compressed === 'string', 'Compressed should be a string');
assert.ok(compressed.length > 0, 'Compressed should be non-empty');
assert.ok(compressed.length < 2000, 'Compressed should be under 2000 chars for URL');

const decompressed = await decompressData(compressed);
assert.deepStrictEqual(decompressed.meta.date, sampleReport.meta.date);
assert.deepStrictEqual(decompressed.vehicle.make, sampleReport.vehicle.make);
assert.strictEqual(decompressed.cells.count, sampleReport.cells.count);
assert.strictEqual(decompressed.cells.voltages.length, 96);

console.log(`✓ All export tests passed (compressed size: ${compressed.length} chars)`);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/test-export.js`
Expected: FAIL — module not found

- [ ] **Step 3: Write `js/export.js`**

```js
// js/export.js

/**
 * Compress reportData to a URL-safe base64 string.
 * Uses pako in browser, zlib in Node.
 */
export async function compressData(reportData) {
  const json = JSON.stringify(reportData);
  let compressed;

  if (typeof pako !== 'undefined') {
    // Browser: use pako CDN
    compressed = pako.deflate(new TextEncoder().encode(json));
  } else {
    // Node.js: use zlib
    const zlib = await import('node:zlib');
    compressed = zlib.deflateSync(Buffer.from(json));
  }

  // Convert to base64url
  const base64 = btoa(String.fromCharCode(...compressed));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decompress a URL-safe base64 string back to reportData.
 */
export async function decompressData(encoded) {
  // Restore standard base64
  let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';

  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));

  let json;
  if (typeof pako !== 'undefined') {
    json = new TextDecoder().decode(pako.inflate(bytes));
  } else {
    const zlib = await import('node:zlib');
    json = zlib.inflateSync(Buffer.from(bytes)).toString();
  }

  return JSON.parse(json);
}

/**
 * Encode reportData into a shareable URL.
 */
export async function encodeShareData(reportData) {
  const compressed = await compressData(reportData);
  return `${window.location.origin}${window.location.pathname}#${compressed}`;
}

/**
 * Decode reportData from a URL hash string.
 */
export async function decodeShareData(hash) {
  return decompressData(hash);
}

/**
 * Generate a PDF of the report tab.
 * Uses html2canvas + jsPDF (loaded via CDN).
 * Handles multi-page by slicing the source canvas into page-sized chunks.
 */
export async function generatePDF(reportData) {
  const reportEl = document.getElementById('report-content');
  if (!reportEl) return;

  const sourceCanvas = await html2canvas(reportEl, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#f8fafc',
  });

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'mm', 'a4');

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const imgWidth = pageWidth - 2 * margin;
  const imgHeight = (sourceCanvas.height * imgWidth) / sourceCanvas.width;

  if (imgHeight <= pageHeight - 2 * margin) {
    // Single page — simple case
    const imgData = sourceCanvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
  } else {
    // Multi-page — slice source canvas into page-sized chunks
    const pageContentHeight = pageHeight - 2 * margin;
    const scaleFactor = sourceCanvas.width / imgWidth;
    const sliceHeightPx = pageContentHeight * scaleFactor;
    let srcY = 0;
    let page = 0;

    while (srcY < sourceCanvas.height) {
      const thisSliceHeight = Math.min(sliceHeightPx, sourceCanvas.height - srcY);
      // Create a slice canvas
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = sourceCanvas.width;
      sliceCanvas.height = thisSliceHeight;
      const ctx = sliceCanvas.getContext('2d');
      ctx.drawImage(sourceCanvas,
        0, srcY, sourceCanvas.width, thisSliceHeight,
        0, 0, sourceCanvas.width, thisSliceHeight
      );
      const sliceData = sliceCanvas.toDataURL('image/png');
      const sliceImgHeight = thisSliceHeight / scaleFactor;

      if (page > 0) pdf.addPage();
      pdf.addImage(sliceData, 'PNG', margin, margin, imgWidth, sliceImgHeight);

      srcY += thisSliceHeight;
      page++;
    }
  }

  const filename = `battery-report-${reportData.meta.date}.pdf`;
  pdf.save(filename);
}
```

**Note:** All encode/decode functions are `async` because they use dynamic `import('node:zlib')` for Node.js test compatibility. In the browser, `pako` is available globally via CDN. The test uses top-level `await`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node tests/test-export.js`
Expected: `✓ All export tests passed (compressed size: ~NNN chars)`

- [ ] **Step 5: Commit**

```bash
git add js/export.js tests/test-export.js
git commit -m "feat: add PDF export and shareable link with pako compression"
```

---

### Task 9: Integration Testing & Polish

**Files:**
- Modify: `css/style.css` (responsive fixes)
- Modify: `index.html` (any fixes found during testing)

- [ ] **Step 1: End-to-end browser test with sample ZIP**

Open `index.html` in browser. Test the full flow:
1. Upload `exported_records.zip` via drag & drop → verify file parsed, form appears
2. Select Skoda → Enyaq iV 80, enter mileage, click Generate → verify Report tab
3. Switch to Details tab → verify cell grid, temperature map, BMS data, all parameters
4. Click Share Link → verify URL is copied with hash data
5. Open the copied URL in a new tab → verify report renders from hash
6. Click Print/PDF → verify PDF downloads
7. Click New Upload → verify returns to upload state
8. Toggle language to DE → verify all text switches
9. Upload the `.csv` file directly (not ZIP) → verify same result

- [ ] **Step 2: Mobile responsiveness test**

Open browser devtools, switch to mobile viewport (375px width). Verify:
- Upload zone fits screen
- Car info form stacks to single column
- Cell voltage grid shows 5 per row
- Temperature grid adapts
- BMS/Energy sections stack vertically
- Tabs and buttons are touch-friendly
- All Parameters tables scroll horizontally

- [ ] **Step 3: Fix any issues found**

Apply CSS/HTML fixes as needed. Common issues:
- Table overflow on mobile → add `.table-wrapper { overflow-x: auto }`
- Font sizes too large/small on mobile
- Drop zone too narrow on desktop
- Chart.js canvas sizing

- [ ] **Step 4: Commit fixes**

```bash
git add -A
git commit -m "fix: responsive layout and integration fixes after end-to-end testing"
```

- [ ] **Step 5: Final verification — run all Node.js tests**

```bash
node tests/test-car-profiles.js && node tests/test-parser.js && node tests/test-analyzer.js && node tests/test-export.js
```

Expected: All 4 test files pass.

- [ ] **Step 6: Commit and verify clean state**

```bash
git status
```

Expected: working tree clean, all changes committed.
