/**
 * Data Analyzer for Car Scanner ELM battery state reports.
 *
 * Takes parsed CSV output from parser.js and produces a full reportData
 * structure consumed by the UI rendering modules.
 */

/**
 * Generate a report ID in the form CS-YYYYMMDD-XXXX.
 *
 * @param {string|null|undefined} dateStr - ISO date string (YYYY-MM-DD), or null/undefined
 * @returns {string}
 */
function generateReportId(dateStr) {
  const datePart = dateStr ? dateStr.replace(/-/g, '') : new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0');
  return `CS-${datePart}-${randomHex}`;
}

/**
 * Compute min, max, avg, and delta statistics for a numeric array.
 *
 * @param {number[]} values
 * @returns {{ min: number, max: number, avg: number, delta: number }}
 */
function computeStats(values) {
  if (!values || values.length === 0) {
    return { min: null, max: null, avg: null, delta: null };
  }
  let min = values[0];
  let max = values[0];
  let sum = 0;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }
  const avg = sum / values.length;
  const delta = max - min;
  return { min, max, avg, delta };
}

/**
 * Group parsed rows by module prefix [XX.YYY], computing per-PID stats.
 * Returns an object keyed by module name (e.g. '8C.BMS'), where each value
 * is an object keyed by full PID name containing { values, min, max, avg, latest }.
 *
 * @param {object[]} rows - Parsed data rows
 * @param {string[]} pidNames - All unique PID names
 * @returns {Record<string, Record<string, { values: number[], min: number, max: number, avg: number, latest: number }>>}
 */
function groupPidsByModule(rows, pidNames) {
  // Build module -> pid -> values map
  const moduleMap = {};

  for (const pid of pidNames) {
    const match = pid.match(/^\[([^\]]+)\]/);
    if (!match) continue;
    const module = match[1];
    if (!moduleMap[module]) moduleMap[module] = {};
    moduleMap[module][pid] = { values: [], min: null, max: null, avg: null, latest: null };
  }

  for (const row of rows) {
    const match = row.pid.match(/^\[([^\]]+)\]/);
    if (!match) continue;
    const module = match[1];
    if (moduleMap[module] && moduleMap[module][row.pid]) {
      moduleMap[module][row.pid].values.push(row.value);
    }
  }

  // Compute stats for each PID
  for (const module of Object.keys(moduleMap)) {
    for (const pid of Object.keys(moduleMap[module])) {
      const entry = moduleMap[module][pid];
      const stats = computeStats(entry.values);
      entry.min = stats.min;
      entry.max = stats.max;
      entry.avg = stats.avg;
      entry.latest = entry.values.length > 0 ? entry.values[entry.values.length - 1] : null;
    }
  }

  return moduleMap;
}

/**
 * Get a PID value from a latestValues Map.
 * Tries exact match first, then partial match (for platform suffixes).
 *
 * @param {Map<string, number>} latestValues
 * @param {string} pidSubstring
 * @returns {number|null}
 */
function getPidValue(latestValues, pidSubstring) {
  // Exact match first
  if (latestValues.has(pidSubstring)) {
    return latestValues.get(pidSubstring);
  }
  // Partial match
  for (const [key, value] of latestValues) {
    if (key.includes(pidSubstring)) {
      return value;
    }
  }
  return null;
}

/**
 * Compute cell balance score as a percentage.
 * Score = 100 - (delta / 0.020) * 100, capped to [0, 100], rounded to 1 decimal.
 *
 * @param {number} delta - Max cell voltage spread in Volts
 * @returns {number}
 */
export function computeBalanceScore(delta) {
  const raw = 100 - (delta / 0.020) * 100;
  const capped = Math.max(0, Math.min(100, raw));
  return Math.round(capped * 10) / 10;
}

/**
 * Return a human-readable label for a balance/health score.
 *
 * @param {number} score
 * @returns {'excellent'|'good'|'fair'|'poor'}
 */
export function getScoreLabel(score) {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
}

/**
 * Derive an overall assessment level from a health check results object.
 *
 * @param {object} healthChecks
 * @returns {'excellent'|'good'|'attention'}
 */
export function getAssessmentLevel(healthChecks) {
  const failures = Object.values(healthChecks).filter((v) => v === false).length;
  if (failures === 0) return 'excellent';
  if (failures <= 2) return 'good';
  return 'attention';
}

/**
 * Run battery health checks based on cells, temperatures, and BMS data.
 *
 * @param {object} cells
 * @param {object} temperatures
 * @param {object} bms
 * @returns {{
 *   cellSpreadOk: boolean,
 *   tempSpreadOk: boolean,
 *   cellsInRange: boolean,
 *   voltageConsistent: boolean,
 *   noOutliers: boolean,
 *   socAvailable: boolean
 * }}
 */
export function runHealthChecks(cells, temperatures, bms) {
  // Cell spread: delta < 20mV
  const cellSpreadOk = cells.delta != null && cells.delta < 0.020;

  // Temperature spread: max - min < 5°C
  const tempSpreadOk =
    temperatures.count === 0 ||
    (temperatures.delta != null && temperatures.delta < 5);

  // Cells in normal operating range (3.0V–4.2V for NMC)
  const cellsInRange =
    cells.min != null &&
    cells.max != null &&
    cells.min.value >= 3.0 &&
    cells.max.value <= 4.2;

  // Voltage consistency: pack voltage vs sum of cells within 1V
  const voltageConsistent =
    bms.packVoltage == null || bms.cellSumVoltage == null ||
    Math.abs(bms.packVoltage - bms.cellSumVoltage) < 1.0;

  // No outlier cells: > 2 standard deviations from mean
  const voltages = (cells.voltages || []).filter(v => v !== null);
  const mean = voltages.length > 0 ? voltages.reduce((a, b) => a + b, 0) / voltages.length : 0;
  const stdDev = voltages.length > 0
    ? Math.sqrt(voltages.reduce((sum, v) => sum + (v - mean) ** 2, 0) / voltages.length)
    : 0;
  const noOutliers = voltages.every(v => Math.abs(v - mean) <= 2 * stdDev);

  // SOC available
  const socAvailable = bms.socDisplay != null || bms.socBms != null;

  return {
    cellSpreadOk,
    tempSpreadOk,
    cellsInRange,
    voltageConsistent,
    noOutliers,
    socAvailable,
  };
}

/**
 * Analyze parsed CSV data and produce the full reportData structure.
 *
 * @param {ReturnType<import('./parser.js').parseCSV>} parsed
 * @param {{ make: string, model: string, mileage: number, grossKwh: number, netKwh: number, userSoh: number|null }} vehicleInfo
 * @param {string|null|undefined} dateStr - ISO date string (YYYY-MM-DD)
 * @returns {object} Full report data structure
 */
export function analyze(parsed, vehicleInfo, dateStr) {
  const latestValues = parsed.getLatestValues();
  const cellVoltages = parsed.getCellVoltages();
  const temperatures = parsed.getTemperatures();

  // --- Cell voltages ---
  const cellStats = computeStats(cellVoltages);
  const cellDelta = cellStats.delta ?? 0;
  const balanceScore = computeBalanceScore(cellDelta);

  // Find min/max cell with index
  let minCell = null;
  let maxCell = null;
  for (let i = 0; i < cellVoltages.length; i++) {
    const v = cellVoltages[i];
    if (minCell === null || v < minCell.value) {
      minCell = { value: v, index: i + 1 };
    }
    if (maxCell === null || v > maxCell.value) {
      maxCell = { value: v, index: i + 1 };
    }
  }

  const cells = {
    count: cellVoltages.length,
    voltages: cellVoltages,
    min: minCell,
    max: maxCell,
    avg: cellStats.avg,
    delta: cellDelta,
    balanceScore,
    balanceLabel: getScoreLabel(balanceScore),
  };

  // --- Temperatures ---
  const tempStats = computeStats(temperatures);
  const tempData = {
    count: temperatures.length,
    values: temperatures,
    min: tempStats.min,
    max: tempStats.max,
    avg: tempStats.avg,
    delta: tempStats.delta,
  };

  // --- BMS data ---
  const socDisplay = getPidValue(latestValues, '[8C.BMS] Ladezustand Anzeige');
  const socBms = getPidValue(latestValues, '[8C.BMS] Ladezustand Batteriemanagementsystem');
  const packVoltage = getPidValue(latestValues, '[8C.BMS] Batteriespannung');
  const cellSumVoltage = getPidValue(latestValues, '[8C.BMS] Batteriespannung, Summe der Zellspannungen');
  const current = getPidValue(latestValues, '[8C.BMS] Batteriestrom');
  const power = getPidValue(latestValues, '[8C.BMS] Batterieleistung');
  const chargeVoltage = getPidValue(latestValues, '[8C.BMS] Hochvoltbatterie Ladespannung');
  const maxChargeCurrent = getPidValue(latestValues, '[8C.BMS] Dynamischer Grenzwert für das Laden in Ampere');

  const bms = {
    socDisplay,
    socBms,
    packVoltage,
    cellSumVoltage,
    current,
    power,
    chargeVoltage,
    maxChargeCurrent,
  };

  // --- Energy data ---
  const energyContent = getPidValue(latestValues, '[19.Gate] Hochvoltbatterie Energiegehalt');
  const maxEnergyContent = getPidValue(latestValues, '[19.Gate] maximaler Energiegehalt der Traktionsbatterie');
  const estimatedRange = getPidValue(latestValues, '[19.Gate] geschätzte Reichweite (Anzeige)');

  // Compute SoH from energy if available
  let computedSoh = null;
  if (energyContent != null && maxEnergyContent != null && maxEnergyContent > 0) {
    computedSoh = Math.round((energyContent / maxEnergyContent) * 1000) / 10;
  }

  // 12V battery PIDs (all [19.Gate] 12V Batterie* PIDs)
  const battery12v = {};
  for (const [key, value] of latestValues) {
    if (key.startsWith('[19.Gate] 12V Batterie')) {
      // Extract the short name after "[19.Gate] 12V Batterie"
      const shortName = key.replace('[19.Gate] 12V Batterie', '').trim();
      battery12v[shortName || key] = value;
    }
  }

  const energy = {
    energyContent,
    maxEnergyContent,
    estimatedRange,
    computedSoh,
    battery12v,
  };

  // --- Health checks ---
  const healthChecks = runHealthChecks(cells, tempData, bms);

  // --- All PIDs grouped by module ---
  const allPids = groupPidsByModule(parsed.rows, parsed.pidNames);

  // --- Report metadata ---
  const reportId = generateReportId(dateStr);
  const meta = {
    reportId,
    generatedAt: new Date().toISOString(),
    dateStr: dateStr || null,
    totalDataPoints: parsed.totalPoints,
    pidCount: parsed.pidNames.length,
  };

  // --- Vehicle info ---
  const vehicle = {
    make: vehicleInfo.make,
    model: vehicleInfo.model,
    mileage: vehicleInfo.mileage,
    grossKwh: vehicleInfo.grossKwh,
    netKwh: vehicleInfo.netKwh,
    userSoh: vehicleInfo.userSoh,
    soh: vehicleInfo.userSoh ?? computedSoh,
    assessmentLevel: getAssessmentLevel(healthChecks),
  };

  return {
    meta,
    vehicle,
    cells,
    temperatures: tempData,
    bms,
    energy,
    healthChecks,
    allPids,
  };
}
