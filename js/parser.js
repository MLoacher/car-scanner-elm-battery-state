/**
 * CSV Parser for Car Scanner ELM export format.
 *
 * CSV format: semicolon-delimited, quoted fields, trailing semicolon per row.
 * Header row: "SECONDS";"PID";"VALUE";"UNITS";
 */

/**
 * Extract a date string (YYYY-MM-DD) from a Car Scanner export filename.
 * Matches filenames like "2026-03-20 18-31-35.csv".
 * Returns null if the pattern does not match.
 *
 * @param {string} filename
 * @returns {string|null}
 */
export function extractDateFromFilename(filename) {
  const match = filename.match(/^(\d{4}-\d{2}-\d{2})\s/);
  return match ? match[1] : null;
}

/**
 * Parse a quoted, semicolon-delimited CSV line.
 * Handles the trailing semicolon present in Car Scanner exports.
 *
 * @param {string} line
 * @returns {string[]}
 */
function parseLine(line) {
  const fields = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      // Quoted field
      let value = '';
      i++; // skip opening quote
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            // Escaped quote
            value += '"';
            i += 2;
          } else {
            i++; // skip closing quote
            break;
          }
        } else {
          value += line[i];
          i++;
        }
      }
      fields.push(value);
      // Skip the following semicolon
      if (line[i] === ';') i++;
    } else if (line[i] === ';') {
      // Empty unquoted field
      fields.push('');
      i++;
    } else {
      // Unquoted field
      let value = '';
      while (i < line.length && line[i] !== ';') {
        value += line[i];
        i++;
      }
      fields.push(value);
      if (line[i] === ';') i++;
    }
  }
  return fields;
}

/**
 * Get the latest value for each PID matching a numbered pattern, sorted numerically.
 * Uses a Set for O(1) PID lookup.
 *
 * @param {object[]} rows - Parsed data rows
 * @param {string[]} pidNames - All unique PID names
 * @param {RegExp} pattern - Pattern to match PID names; must have a capture group for the number
 * @returns {number[]} Array of latest numeric values sorted by the captured number
 */
function getNumberedPidValues(rows, pidNames, pattern) {
  // Build a Set of matching PIDs for O(1) lookup
  const matchingPids = new Set();
  const pidNumberMap = new Map(); // pid -> number
  for (const pid of pidNames) {
    const m = pid.match(pattern);
    if (m) {
      matchingPids.add(pid);
      pidNumberMap.set(pid, parseInt(m[1], 10));
    }
  }

  // Collect latest value for each matching PID (last row wins)
  const latestValues = new Map(); // pid -> value
  for (const row of rows) {
    if (matchingPids.has(row.pid)) {
      latestValues.set(row.pid, row.value);
    }
  }

  // Sort by number and return values
  const sorted = [...latestValues.entries()].sort(
    ([pidA], [pidB]) => pidNumberMap.get(pidA) - pidNumberMap.get(pidB)
  );
  return sorted.map(([, value]) => value);
}

/**
 * Parse a Car Scanner CSV export.
 *
 * @param {string} csvText - Full text content of the CSV file
 * @returns {{
 *   rows: {seconds: number, pid: string, value: number, units: string}[],
 *   pidNames: string[],
 *   totalPoints: number,
 *   getLatestValues: () => Map<string, number>,
 *   getCellVoltages: () => number[],
 *   getTemperatures: () => number[],
 *   getCellCount: () => number,
 *   getTempCount: () => number,
 * }}
 */
export function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const rows = [];
  const pidSet = new Set();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = parseLine(line);
    if (fields.length < 4) continue;

    const [secondsStr, pid, valueStr, units] = fields;

    // Skip header row
    if (secondsStr === 'SECONDS') continue;

    const seconds = parseFloat(secondsStr);
    const value = parseFloat(valueStr);

    if (isNaN(seconds) || !pid) continue;

    rows.push({ seconds, pid, value, units });
    pidSet.add(pid);
  }

  const pidNames = [...pidSet];
  const totalPoints = rows.length;

  return {
    rows,
    pidNames,
    totalPoints,

    /**
     * Returns a Map of the latest value for every PID.
     * @returns {Map<string, number>}
     */
    getLatestValues() {
      const latest = new Map();
      for (const row of rows) {
        latest.set(row.pid, row.value);
      }
      return latest;
    },

    /**
     * Returns an array of the latest cell voltages sorted by cell number (1-96).
     * @returns {number[]}
     */
    getCellVoltages() {
      return getNumberedPidValues(
        rows,
        pidNames,
        /Batteriezellspannung Zelle (\d+)/
      );
    },

    /**
     * Returns an array of the latest battery temperature values sorted by sensor number.
     * @returns {number[]}
     */
    getTemperatures() {
      return getNumberedPidValues(
        rows,
        pidNames,
        /Hochvoltbatterie Temperatur Punkt (\d+)/
      );
    },

    /**
     * Returns the number of cell voltage sensors detected.
     * @returns {number}
     */
    getCellCount() {
      return this.getCellVoltages().length;
    },

    /**
     * Returns the number of temperature sensors detected.
     * @returns {number}
     */
    getTempCount() {
      return this.getTemperatures().length;
    },
  };
}

/**
 * Extract and parse the first CSV file found inside a ZIP archive.
 * Browser-only: requires JSZip to be available as a global.
 *
 * @param {ArrayBuffer} zipArrayBuffer
 * @returns {Promise<ReturnType<typeof parseCSV>>}
 */
export async function extractCSVFromZip(zipArrayBuffer) {
  // JSZip must be available as a global in the browser environment
  const zip = await JSZip.loadAsync(zipArrayBuffer); // eslint-disable-line no-undef
  const csvFile = Object.values(zip.files).find(
    (f) => !f.dir && f.name.endsWith('.csv')
  );
  if (!csvFile) throw new Error('No CSV file found in ZIP archive');
  const text = await csvFile.async('string');
  return parseCSV(text);
}
