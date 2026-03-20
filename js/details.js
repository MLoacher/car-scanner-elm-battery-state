// details.js - Details tab rendering

import { t } from './i18n.js';

/**
 * Format a number with fixed decimals and suffix, or return fallback.
 * @param {number|null} val
 * @param {string} suffix
 * @param {number} decimals
 * @returns {string}
 */
function fmtVal(val, suffix = '', decimals = 2) {
  if (val == null || isNaN(val)) return '\u2014';
  return val.toFixed(decimals) + suffix;
}

/**
 * Return a kv-row HTML string.
 * @param {string} label
 * @param {string} value
 * @returns {string}
 */
function kvRow(label, value) {
  return `<div class="kv-row"><span class="key">${label}</span><span class="val">${value}</span></div>`;
}

/**
 * Get cell tile background color based on deviation from average.
 * @param {number} voltage
 * @param {number} avg
 * @returns {string}
 */
function getCellColor(voltage, avg) {
  const devMv = Math.abs(voltage - avg) * 1000;
  if (devMv < 2) return '#16a34a';   // green
  if (devMv < 5) return '#86efac';   // light green
  if (devMv < 10) return '#facc15';  // yellow
  return '#dc2626';                   // red
}

/**
 * Get temperature tile background color as a blue-to-red gradient.
 * @param {number} temp
 * @param {number} minTemp
 * @param {number} maxTemp
 * @returns {string}
 */
function getTempColor(temp, minTemp, maxTemp) {
  if (maxTemp === minTemp) return '#3b82f6';
  const ratio = (temp - minTemp) / (maxTemp - minTemp);
  // Interpolate from blue (#3b82f6) to red (#ef4444)
  const r = Math.round(0x3b + (0xef - 0x3b) * ratio);
  const g = Math.round(0x82 + (0x44 - 0x82) * ratio);
  const b = Math.round(0xf6 + (0x44 - 0xf6) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Render the full Details tab into a container element.
 * @param {object} data - Full report data from analyze()
 * @param {HTMLElement} container
 */
export function renderDetails(data, container) {
  const { cells, temperatures, bms, energy, vehicle, allPids } = data;

  // --- Aux 12V battery ---
  // energy.battery12v is an object keyed by short name
  const aux12v = energy.battery12v || {};
  const hasAux = Object.keys(aux12v).length > 0;

  // Try to extract known aux values by key substrings
  function getAux(substring) {
    for (const [key, value] of Object.entries(aux12v)) {
      if (key.toLowerCase().includes(substring.toLowerCase())) return value;
    }
    return null;
  }

  const auxVoltage = getAux('spannung') ?? getAux('voltage');
  const auxSoc = getAux('ladezustand') ?? getAux('soc');
  const auxTemp = getAux('temperatur') ?? getAux('temperature');
  const auxAging = getAux('alterung') ?? getAux('aging') ?? getAux('kapazit');

  // --- Cell Voltages section ---
  const cellTiles = (cells.voltages || [])
    .map((v, i) => {
      const color = getCellColor(v, cells.avg);
      const tooltip = `${t('cell')} ${i + 1}: ${v.toFixed(3)} V`;
      return `<div class="cell-tile" style="background-color: ${color}" data-tooltip="${tooltip}">${v.toFixed(3)}</div>`;
    })
    .join('');

  // --- Temperature section ---
  const tempMin = temperatures.min;
  const tempMax = temperatures.max;
  const tempTiles = (temperatures.values || [])
    .map((v, i) => {
      const color = getTempColor(v, tempMin, tempMax);
      return `<div class="temp-tile" style="background-color: ${color}; color: #fff;"><div class="temp-label">#${i + 1}</div><div class="temp-value">${v.toFixed(1)}&deg;C</div></div>`;
    })
    .join('');

  // --- All Recorded Parameters ---
  const moduleNames = Object.keys(allPids).sort();
  const pidSections = moduleNames
    .map((moduleName) => {
      const pids = allPids[moduleName];
      const pidEntries = Object.entries(pids);
      const pidCount = pidEntries.length;

      // Clean PID name: strip module prefix [XX.YYY]
      const rows = pidEntries
        .map(([fullPid, entry]) => {
          const cleanName = fullPid.replace(/^\[[^\]]+\]\s*/, '');
          // Determine units from parsed rows - not available in analyzer output, use empty
          return `<tr>
            <td>${cleanName}</td>
            <td>${fmtVal(entry.latest, '', 3)}</td>
            <td>${fmtVal(entry.min, '', 3)}</td>
            <td>${fmtVal(entry.max, '', 3)}</td>
            <td>${fmtVal(entry.avg, '', 3)}</td>
          </tr>`;
        })
        .join('');

      return `
        <details class="pid-group">
          <summary>${moduleName} (${pidCount})</summary>
          <div class="table-wrapper">
            <table class="pid-table">
              <thead>
                <tr>
                  <th>PID</th>
                  <th>${t('lastValue')}</th>
                  <th>${t('min')}</th>
                  <th>${t('max')}</th>
                  <th>${t('avg')}</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </details>`;
    })
    .join('');

  // --- Build HTML ---
  container.innerHTML = `
    <div class="details">
      <!-- Cell Voltages -->
      <div class="detail-section">
        <div class="section-header">
          <h2>${t('cellVoltages')}</h2>
          <div class="section-sub">${cells.count} ${t('cells')} &middot; ${t('colorCodedByDeviation')}</div>
          <div class="legend">
            <span><span class="legend-dot" style="background-color: #16a34a"></span>${t('avg')}</span>
            <span><span class="legend-dot" style="background-color: #86efac"></span></span>
            <span><span class="legend-dot" style="background-color: #facc15"></span></span>
            <span><span class="legend-dot" style="background-color: #dc2626"></span>${t('high')} ${t('delta')}</span>
          </div>
        </div>
        <div class="cell-grid">${cellTiles}</div>
        <div class="stats-row" style="margin-top: 1rem;">
          <div class="stat-item">
            <div class="stat-value">${fmtVal(cells.min ? cells.min.value : null, ' V', 3)}</div>
            <div class="stat-label">${t('min')} (${t('cell')} #${cells.min ? cells.min.index : '\u2014'})</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${fmtVal(cells.max ? cells.max.value : null, ' V', 3)}</div>
            <div class="stat-label">${t('max')} (${t('cell')} #${cells.max ? cells.max.index : '\u2014'})</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${fmtVal(cells.avg, ' V', 3)}</div>
            <div class="stat-label">${t('avg')}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${fmtVal(cells.delta * 1000, ' mV', 1)}</div>
            <div class="stat-label">${t('delta')}</div>
          </div>
        </div>
      </div>

      <!-- Battery Temperature -->
      ${temperatures.count > 0 ? `
      <div class="detail-section">
        <div class="section-header">
          <h2>${t('batteryTemperature')}</h2>
          <div class="section-sub">${temperatures.count} ${t('sensors')}</div>
        </div>
        <div class="temp-grid">${tempTiles}</div>
        <div class="stats-row" style="margin-top: 1rem;">
          <div class="stat-item">
            <div class="stat-value">${fmtVal(temperatures.min, ' \u00B0C', 1)}</div>
            <div class="stat-label">${t('min')}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${fmtVal(temperatures.max, ' \u00B0C', 1)}</div>
            <div class="stat-label">${t('max')}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${fmtVal(temperatures.avg, ' \u00B0C', 1)}</div>
            <div class="stat-label">${t('avg')}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${fmtVal(temperatures.delta, ' \u00B0C', 1)}</div>
            <div class="stat-label">${t('delta')}</div>
          </div>
        </div>
      </div>` : ''}

      <!-- BMS Data -->
      <div class="detail-section">
        <div class="section-header"><h2>${t('bmsData')}</h2></div>
        <div class="kv-grid">
          ${kvRow(t('socDisplay'), fmtVal(bms.socDisplay, '%', 1))}
          ${kvRow(t('socBms'), fmtVal(bms.socBms, '%', 1))}
          ${kvRow(t('packVoltage'), fmtVal(bms.packVoltage, ' V', 1))}
          ${kvRow(t('cellSumVoltage'), fmtVal(bms.cellSumVoltage, ' V', 2))}
          ${kvRow(t('batteryCurrent'), fmtVal(bms.current, ' A', 1))}
          ${kvRow(t('batteryPower'), fmtVal(bms.power, ' kW', 2))}
          ${kvRow(t('chargeVoltageLimit'), fmtVal(bms.chargeVoltage, ' V', 1))}
          ${kvRow(t('maxChargeCurrent'), fmtVal(bms.maxChargeCurrent, ' A', 1))}
        </div>
      </div>

      <!-- Energy & Range -->
      <div class="detail-section">
        <div class="section-header"><h2>${t('energyAndRange')}</h2></div>
        <div class="kv-grid">
          ${kvRow(t('currentEnergy'), fmtVal(energy.energyContent, ' kWh', 1))}
          ${kvRow(t('maxEnergy'), fmtVal(energy.maxEnergyContent, ' kWh', 1))}
          ${kvRow(t('energyRatio'), energy.computedSoh != null ? energy.computedSoh + '%' : '\u2014')}
          ${kvRow(t('estimatedRange'), fmtVal(energy.estimatedRange, ' km', 0))}
          ${kvRow(t('odometer'), vehicle.mileage ? Number(vehicle.mileage).toLocaleString() + ' km' : '\u2014')}
        </div>
      </div>

      <!-- 12V Auxiliary Battery -->
      ${hasAux ? `
      <div class="detail-section">
        <div class="section-header"><h2>${t('auxBattery')}</h2></div>
        <div class="stats-row">
          ${auxVoltage != null ? `<div class="stat-item"><div class="stat-value">${fmtVal(auxVoltage, ' V', 1)}</div><div class="stat-label">${t('voltage')}</div></div>` : ''}
          ${auxSoc != null ? `<div class="stat-item"><div class="stat-value">${fmtVal(auxSoc, '%', 1)}</div><div class="stat-label">${t('soc')}</div></div>` : ''}
          ${auxTemp != null ? `<div class="stat-item"><div class="stat-value">${fmtVal(auxTemp, ' \u00B0C', 1)}</div><div class="stat-label">${t('temperature')}</div></div>` : ''}
          ${auxAging != null ? `<div class="stat-item"><div class="stat-value">${fmtVal(auxAging, '%', 1)}</div><div class="stat-label">${t('capacityAging')}</div></div>` : ''}
        </div>
      </div>` : ''}

      <!-- All Recorded Parameters -->
      <div class="detail-section">
        <div class="section-header">
          <h2>${t('allParameters')}</h2>
          <div class="section-sub">${t('groupedByModule')}</div>
        </div>
        ${pidSections}
      </div>
    </div>
  `;
}
