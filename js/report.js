// report.js - Report tab rendering

import { t } from './i18n.js';
import { getScoreLabel, getAssessmentLevel } from './analyzer.js';

/**
 * Return score color class based on threshold.
 * @param {number} score
 * @returns {string}
 */
function getScoreColor(score) {
  if (score >= 90) return '#16a34a';
  if (score >= 70) return '#ca8a04';
  return '#dc2626';
}

/**
 * Return badge CSS class based on score.
 * @param {number} score
 * @returns {string}
 */
function getScoreBadgeClass(score) {
  if (score >= 90) return 'green';
  if (score >= 70) return 'yellow';
  if (score >= 50) return 'orange';
  return 'red';
}

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
 * Render the mini cell voltage bar chart using Chart.js.
 * @param {number[]} cells - Array of cell voltages
 */
function renderMiniChart(cells) {
  const canvas = document.getElementById('cell-chart-mini');
  if (!canvas || !cells || cells.length === 0) return;

  const avg = cells.reduce((a, b) => a + b, 0) / cells.length;
  const minV = Math.min(...cells);
  const maxV = Math.max(...cells);

  const colors = cells.map((v) => {
    const devMv = Math.abs(v - avg) * 1000;
    if (devMv < 2) return '#16a34a';
    if (devMv < 5) return '#86efac';
    if (devMv < 10) return '#facc15';
    return '#dc2626';
  });

  const labels = cells.map((_, i) => i + 1);

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          data: cells,
          backgroundColor: colors,
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          display: false,
        },
        y: {
          min: minV - 0.002,
          max: maxV + 0.002,
          ticks: {
            callback: (value) => value.toFixed(3) + ' V',
          },
        },
      },
    },
  });
}

/**
 * Render the Report tab into a container element.
 * @param {object} data - Full report data from analyze()
 * @param {HTMLElement} container
 */
export function renderReport(data, container) {
  const { meta, vehicle, cells, temperatures, bms, energy, healthChecks } = data;
  const score = cells.balanceScore;
  const scoreLabel = getScoreLabel(score);
  const assessmentLevel = getAssessmentLevel(healthChecks);

  // Score color
  const scoreColor = getScoreColor(score);
  const badgeClass = getScoreBadgeClass(score);

  // Delta badge text
  const deltaBadge = `${t('delta')}: ${fmtVal(cells.delta * 1000, ' mV', 1)} ${t('acrossCells', { count: cells.count })}`;

  // Assessment text mapping
  const assessmentTextMap = {
    excellent: t('excellentCondition'),
    good: t('goodCondition'),
    attention: t('attentionRecommended'),
  };

  // Assessment color mapping
  const assessmentColorMap = {
    excellent: '#dcfce7',
    good: '#fef9c3',
    attention: '#fee2e2',
  };

  const assessmentBorderMap = {
    excellent: '#16a34a',
    good: '#ca8a04',
    attention: '#dc2626',
  };

  // Health check items
  const checks = [
    { key: 'cellSpreadOk', label: t('checkCellSpread') },
    { key: 'tempSpreadOk', label: t('checkTempSpread') },
    { key: 'cellsInRange', label: t('checkCellsInRange') },
    { key: 'voltageConsistent', label: t('checkVoltageConsistent') },
    { key: 'noOutliers', label: t('checkNoOutliers') },
    { key: 'socAvailable', label: t('checkSocAvailable') },
  ];

  // Energy ratio
  const energyRatio =
    energy.energyContent != null && energy.maxEnergyContent != null && energy.maxEnergyContent > 0
      ? ((energy.energyContent / energy.maxEnergyContent) * 100).toFixed(1) + '%'
      : '\u2014';

  // User SOH row
  const userSohRow = vehicle.userSoh != null
    ? `<div class="kv-row"><span class="key">SoH (${t('userProvided')})</span><span class="val">${vehicle.userSoh}%</span></div>`
    : '';

  container.innerHTML = `
    <div class="report">
      <!-- Header -->
      <div class="report-header">
        <div class="report-label">${t('title')}</div>
        <div class="report-title">${t('cellBalanceScore')}</div>
        <div class="report-meta">
          ${t('basedOn', { count: meta.totalDataPoints })}
          &middot; ${t('date')}: ${meta.dateStr || new Date().toISOString().slice(0, 10)}
          &middot; ${t('reportId')}: ${meta.reportId}
        </div>
      </div>

      <!-- Vehicle info bar -->
      <div class="vehicle-bar">
        <div><div class="label">${t('make')}</div><div class="value">${vehicle.make || '\u2014'}</div></div>
        <div><div class="label">${t('model')}</div><div class="value">${vehicle.model || '\u2014'}</div></div>
        <div><div class="label">${t('mileage')}</div><div class="value">${vehicle.mileage ? Number(vehicle.mileage).toLocaleString() + ' km' : '\u2014'}</div></div>
        <div><div class="label">${t('battery')}</div><div class="value">${vehicle.grossKwh ? vehicle.grossKwh + ' kWh' : '\u2014'}</div></div>
      </div>

      <!-- Score + Energy row -->
      <div class="score-energy-row">
        <div class="score-card">
          <div class="section-label">${t('cellBalanceScore')}</div>
          <div class="score-big" style="color: ${scoreColor}">${score}</div>
          <div class="score-subtitle">${t(scoreLabel)}</div>
          <div class="score-badge ${badgeClass}">${deltaBadge}</div>
        </div>
        <div class="energy-card">
          <div class="section-label">${t('energy')}</div>
          <div class="kv-grid">
            <div class="kv-row"><span class="key">${t('currentContent')}</span><span class="val">${fmtVal(energy.energyContent, ' kWh', 1)}</span></div>
            <div class="kv-row"><span class="key">${t('maxContent')}</span><span class="val">${fmtVal(energy.maxEnergyContent, ' kWh', 1)}</span></div>
            <div class="kv-row"><span class="key">${t('ratio')}</span><span class="val">${energyRatio}</span></div>
            <div class="kv-row"><span class="key">${t('packVoltage')}</span><span class="val">${fmtVal(bms.packVoltage, ' V', 1)}</span></div>
            ${userSohRow}
          </div>
        </div>
      </div>

      <!-- Quick Checks -->
      <div class="report-section">
        <div class="section-header"><h2>${t('quickChecks')}</h2></div>
        <div class="health-check-grid">
          ${checks
            .map((c) => {
              const pass = healthChecks[c.key];
              const icon = pass ? '\u2705' : '\u274C';
              return `<div class="check-item"><span class="check-icon">${icon}</span><span class="check-label">${c.label}</span></div>`;
            })
            .join('')}
        </div>
      </div>

      <!-- Cell Voltage Mini Chart -->
      <div class="report-section">
        <div class="section-header">
          <h2>${t('cellVoltagesOverview')}</h2>
          <div class="section-sub">${cells.count} ${t('cells')}</div>
        </div>
        <div style="height: 200px;">
          <canvas id="cell-chart-mini"></canvas>
        </div>
      </div>

      <!-- Assessment -->
      <div class="report-section" style="background-color: ${assessmentColorMap[assessmentLevel]}; border-left: 4px solid ${assessmentBorderMap[assessmentLevel]};">
        <div class="section-header"><h2>${t('assessment')}</h2></div>
        <p class="assessment">${assessmentTextMap[assessmentLevel]}</p>
      </div>

      <!-- Disclaimer -->
      <p class="disclaimer">${t('disclaimer')}</p>
    </div>
  `;

  // Render the mini chart after the DOM is set
  renderMiniChart(cells.voltages);
}
