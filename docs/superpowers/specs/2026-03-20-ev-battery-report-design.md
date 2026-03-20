# EV Battery Health Report — GitHub Pages App

## Overview

A static GitHub Pages site that lets users upload Car Scanner ELM OBD2 app exports (.zip or .csv) and generates a comprehensive battery health report for electric vehicles. All processing happens client-side in the browser — no server required.

## Goals

- Parse Car Scanner CSV exports and extract battery-relevant data
- Display a certificate-style **Report** tab summarizing battery health
- Display a **Details** tab with full cell voltages, temperatures, BMS data, and all recorded parameters
- Support Skoda Enyaq / VW MEB platform as primary target, with extensibility for other platforms
- Fully responsive (mobile-first design)
- English default with German translation option
- Export as PDF and shareable URL (data encoded in URL hash)

## Architecture

**Vanilla HTML/CSS/JS** — no build step, no framework.

- Single `index.html` entry point
- ES modules for code organization
- Chart.js for cell voltage bar chart visualization
- JSZip for client-side ZIP decompression
- jsPDF + html2canvas for PDF export
- pako (or similar) for URL hash data compression
- All dependencies loaded via CDN

### File Structure

```
index.html
css/
  style.css
js/
  app.js              — main app logic, page state management
  parser.js           — CSV parsing, ZIP extraction
  analyzer.js         — data analysis, cell balance score, health checks
  report.js           — Report tab rendering
  details.js          — Details tab rendering
  export.js           — PDF generation, shareable link encoding/decoding
  i18n.js             — translations (EN/DE)
  car-profiles.js     — known car specs (battery capacity, cell count, etc.)
```

## Data Flow

1. **Upload** — user drops or selects a .zip or .csv file
2. **Parse** — if ZIP, extract CSV via JSZip; parse CSV (semicolon-delimited, quoted fields)
3. **Analyze** — extract latest values per PID, compute cell stats, temperature stats, health checks
4. **Car Info Form** — auto-detect platform from PID patterns (e.g. `[8C.BMS]` = MEB), pre-fill battery capacity from car-profiles, auto-detect date from filename; user fills in make/model/mileage, optional SOH
5. **Render Report** — generate both tabs with analyzed data
6. **Export** — PDF via html2canvas + jsPDF; share link via pako-compressed JSON in URL hash

## Page States

### State 1: Landing / Upload

- App title: "EV Battery Health Report"
- Subtitle: "Upload your Car Scanner export to analyze your EV battery"
- Drag & drop zone with "Browse Files" button fallback
- Accepts .zip and .csv files
- Language toggle (EN | DE) in footer
- Privacy note: "All processing happens locally in your browser"

### State 2: Car Info Form

Shown after file is successfully parsed. Displays:
- Filename and parse summary (e.g. "Found 96 cells, 24 temp sensors, 3236 data points")
- Form fields:
  - Car Make (dropdown: Skoda, VW, Audi, Cupra, Other)
  - Model (dropdown, filtered by make — populated from car-profiles.js)
  - Mileage in km (text input)
  - Date of Reading (auto-detected from filename, editable)
  - Known SOH % (optional text input)
  - Battery Capacity (auto-filled from model selection, disabled)
- "Generate Report" button

### State 3: Report View

Two tabs: **Report** and **Details**, plus action buttons.

## Report Tab Design

Certificate-style summary inspired by AVILOO battery certificates. Light background (white/light gray), clean typography.

### Sections (top to bottom):

**Header**
- Title: "EV Battery Health Report"
- Subtitle: "Based on Car Scanner OBD2 Data"
- Date and auto-generated Report ID (e.g. CS-2026-0320-A7F3)

**Vehicle Info Bar**
- Horizontal bar with: Make, Model, Mileage, Battery Capacity
- Light blue background

**Cell Balance Score (main metric)**
- Large percentage number (e.g. "98.2%")
- Calculated from cell voltage uniformity: `100 - (delta_mV / threshold_mV * 100)`, capped at 100
  - Threshold: 20 mV (anything above = 0% score)
  - Color coding: green (>90%), yellow (70-90%), red (<70%)
- Subtitle: "Excellent / Good / Fair / Poor cell uniformity"
- Badge showing actual delta in mV

**Energy Info**
- Current energy content (from `[19.Gate] Hochvoltbatterie Energiegehalt`)
- Max energy content (from `[19.Gate] maximaler Energiegehalt der Traktionsbatterie`)
- Ratio (= effective SoC)
- Pack voltage
- If user provided SOH, display it labeled as "user-provided"

**Quick Checks** (pass/fail grid)
- Cell voltage spread < 20 mV
- Temperature spread < 5°C
- All cells within nominal range (3.0V–4.2V for NMC)
- Pack voltage consistent with cell sum (< 1V difference)
- No outlier cells detected (> 2 standard deviations from mean)
- BMS SoC reading available

**Cell Voltage Mini Chart**
- Compact bar chart (Chart.js) showing all cells
- Min / Avg / Max labels below

**Assessment**
- Plain-language summary based on check results
- Green/yellow/red banner
- "Excellent Battery Condition" / "Good Battery Condition" / "Attention Recommended"

**Disclaimer**
- "This report is based on a single OBD2 data snapshot from the Car Scanner app. It is not a certified battery health assessment. The Cell Balance Score reflects cell voltage uniformity, not State of Health (SOH). For certified SOH measurement, consult a professional service like AVILOO."

## Details Tab Design

Full data breakdown with interactive charts and tables.

### Sections:

**Cell Voltages**
- Color-coded grid showing each cell's voltage
- Grid layout: **20 cells per row on desktop, 5 cells per row on mobile** (responsive via CSS grid / media query)
- Each cell tile shows voltage value, colored by deviation from average (green = near avg, yellow = slight deviation, red = outlier)
- Stats row below: Min (with cell #), Max (with cell #), Average, Delta

**Battery Temperature (24 Sensors)**
- Heat-map style grid (6x4) with each sensor's temperature
- Color gradient: blue (cool) to red (hot)
- Stats row: Min, Max, Average, Delta

**BMS Data**
- Two-column key-value layout:
  - SoC Display (`[8C.BMS] Ladezustand Anzeige`)
  - SoC BMS (`[8C.BMS] Ladezustand Batteriemanagementsystem`)
  - Pack Voltage (`[8C.BMS] Batteriespannung`)
  - Cell Sum Voltage (`[8C.BMS] Batteriespannung, Summe der Zellspannungen`)
  - Battery Current (`[8C.BMS] Batteriestrom`)
  - Battery Power (`[8C.BMS] Batterieleistung`)
  - Charge Voltage Limit (`[8C.BMS] Hochvoltbatterie Ladespannung`)
  - Max Charge Current (`[8C.BMS] Dynamischer Grenzwert für das Laden in Ampere`)

**Energy & Range**
- Current Energy, Max Energy, Energy Ratio
- Estimated Range (`[19.Gate] geschätzte Reichweite (Anzeige)`)
- Odometer (`[8C.BMS] Wegstreckenzähler`)
- Average Consumption (derived from consumption PIDs if available)

**12V Auxiliary Battery**
- Voltage, SoC, Temperature, Capacity Aging
- From `[19.Gate] 12V Batterie*` PIDs

**All Recorded Parameters** (collapsible)
- Expandable table grouped by module: [8C.BMS], [19.Gate], [01.ENG], [08.HVAC], [51.ElDrive], [C6.Charger], Generic OBD
- Each PID shows: name, last value, min, max, average, unit
- Group any unlisted modules (e.g. `[03.ABS]`) into their own sections dynamically

## Responsive Design

- **Mobile-first** CSS approach
- All sections stack vertically on mobile
- Two-column grids (BMS Data, Energy & Range) collapse to single column on mobile
- Cell voltage grid: 5 per row on mobile (< 768px), 20 per row on desktop (>= 768px)
- Temperature grid: adapts proportionally
- Touch-friendly tap targets for tabs and buttons
- Vehicle info bar wraps to 2x2 grid on mobile

## Internationalization (i18n)

Simple translations object in `i18n.js`:

```js
const translations = {
  en: {
    title: "EV Battery Health Report",
    uploadPrompt: "Drop your .zip or .csv file here",
    // ...
  },
  de: {
    title: "EV Batterie Gesundheitsbericht",
    uploadPrompt: "Ziehen Sie Ihre .zip oder .csv Datei hierher",
    // ...
  }
};
```

Language toggle in footer. Preference saved to localStorage.

## Car Profiles (`car-profiles.js`)

Known vehicle configurations for auto-detection and spec lookup:

```js
const carProfiles = {
  meb: {
    detect: (pids) => pids.some(p => p.includes('[8C.BMS]')),
    makes: {
      skoda: {
        models: {
          'Enyaq iV 60': { grossKwh: 62, netKwh: 58, cells: 96 },
          'Enyaq iV 80': { grossKwh: 82, netKwh: 77, cells: 96 },
          'Enyaq Coupe iV 80': { grossKwh: 82, netKwh: 77, cells: 96 },
        }
      },
      vw: {
        models: {
          'ID.3 Pro': { grossKwh: 62, netKwh: 58, cells: 96 },
          'ID.3 Pro S': { grossKwh: 82, netKwh: 77, cells: 96 },
          'ID.4 Pro': { grossKwh: 82, netKwh: 77, cells: 96 },
          'ID.5 Pro': { grossKwh: 82, netKwh: 77, cells: 96 },
        }
      },
      audi: {
        models: {
          'Q4 e-tron 40': { grossKwh: 82, netKwh: 76.6, cells: 96 },
          'Q4 e-tron 50': { grossKwh: 82, netKwh: 76.6, cells: 96 },
        }
      },
      cupra: {
        models: {
          'Born 150 kW': { grossKwh: 62, netKwh: 58, cells: 96 },
          'Born 170 kW': { grossKwh: 82, netKwh: 77, cells: 96 },
        }
      }
    }
  }
};
```

Extensible: additional platforms (e.g. Hyundai E-GMP, Tesla) can be added later by adding new platform entries with their own `detect` function and model specs.

## CSV Parser

- Semicolon-delimited, all fields quoted, trailing semicolon on each row (tolerate empty 5th field)
- Columns: SECONDS, PID, VALUE, UNITS
- Some PIDs have platform-specific suffixes (e.g. `(Macan EV, Q6 eTron)`) — strip these for matching
- Parser extracts the **last recorded value** for each PID (latest timestamp)
- For cell voltages and temperatures: also computes min, max, average across all readings
- Auto-detects cell count from number of unique `Batteriezellspannung Zelle NNN` PIDs
- Auto-detects temperature sensor count from `Hochvoltbatterie Temperatur Punkt NNN` PIDs

## Export Features

### PDF Export
- Uses html2canvas to capture the Report tab as an image
- jsPDF to create a PDF document with the captured image
- Formatted for A4 portrait
- Includes disclaimer at bottom

### Shareable Link
- Compress essential parsed data (cell voltages, temperatures, summary values, car info) using pako
- Base64-encode and place in URL hash fragment
- On page load, check for hash data — if present, decode and render report directly (skip upload)
- Estimated URL length: 400-600 characters for a 96-cell battery

## Data Model

Design the internal data structure to support future comparison features:

```js
const reportData = {
  meta: {
    date: '2026-03-20',
    reportId: 'CS-2026-0320-A7F3',
    sourceFile: '2026-03-20 18-31-35.csv'
  },
  vehicle: {
    make: 'Skoda',
    model: 'Enyaq iV 80',
    mileage: 56483,
    grossKwh: 82,
    netKwh: 77,
    userSoh: null  // optional
  },
  cells: {
    count: 96,
    voltages: [3.681, 3.681, 3.683, ...],  // last reading per cell
    min: { value: 3.676, cell: 5 },
    max: { value: 3.683, cell: 3 },
    avg: 3.680,
    delta: 0.007,
    balanceScore: 98.2
  },
  temperatures: {
    count: 24,
    values: [24.0, 24.2, ...],
    min: 24.0,
    max: 24.6,
    avg: 24.2,
    delta: 0.6
  },
  bms: {
    socDisplay: 70,
    socBms: 72.3,
    packVoltage: 353.4,
    cellSumVoltage: 353.3,
    current: -0.8,
    power: -0.28,
    chargeVoltageLimit: 403.2,
    maxChargeCurrent: 154
  },
  energy: {
    current: 52.3,
    max: 74.1,
    ratio: 0.706,
    estimatedRange: 312
  },
  aux12v: {
    voltage: 14.2,
    soc: 92,
    temperature: 23.5,
    capacityAging: 97
  },
  healthChecks: {
    cellSpreadOk: true,
    tempSpreadOk: true,
    cellsInRange: true,
    voltageConsistent: true,
    noOutliers: true,
    socAvailable: true
  },
  allPids: { /* grouped by module, each with last/min/max/avg/unit */ }
};
```

## GitHub Pages Deployment

- Deploy directly from `main` branch (no build step needed)
- Configure in repo Settings → Pages → Source: main branch, root folder
- Add `.superpowers/` to `.gitignore`

## Non-Goals

- No server-side processing or storage
- No user accounts or authentication
- No real SOH calculation (clearly labeled as Cell Balance Score)
- No multi-upload comparison UI (data model supports it for future)
- No real-time OBD2 connection
