// car-profiles.js - Known EV car profiles for auto-detection and spec lookup

/**
 * carProfiles structure:
 * {
 *   [platformKey]: {
 *     detect: (pidNames: string[]) => boolean,
 *     makes: {
 *       [make]: {
 *         [model]: { grossKwh: number, netKwh: number, cells: number }
 *       }
 *     }
 *   }
 * }
 */
export const carProfiles = {
  meb: {
    // MEB platform is identified by the [8C.BMS] module prefix in PID names
    detect: (pidNames) => pidNames.some((name) => name.includes('[8C.BMS]')),
    makes: {
      Skoda: {
        'Enyaq iV 60': { grossKwh: 62, netKwh: 58, cells: 96 },
        'Enyaq iV 80': { grossKwh: 82, netKwh: 77, cells: 96 },
        'Enyaq iV 80x': { grossKwh: 82, netKwh: 77, cells: 96 },
        'Enyaq Coupe iV 80': { grossKwh: 82, netKwh: 77, cells: 96 },
      },
      VW: {
        'ID.3 Pure': { grossKwh: 55, netKwh: 52, cells: 96 },
        'ID.3 Pro': { grossKwh: 62, netKwh: 58, cells: 96 },
        'ID.3 Pro S': { grossKwh: 82, netKwh: 77, cells: 96 },
        'ID.4 Pure': { grossKwh: 55, netKwh: 52, cells: 96 },
        'ID.4 Pro': { grossKwh: 82, netKwh: 77, cells: 96 },
        'ID.5 Pro': { grossKwh: 82, netKwh: 77, cells: 96 },
        'ID.7 Pro': { grossKwh: 82, netKwh: 77, cells: 96 },
        'ID.7 Pro S': { grossKwh: 91, netKwh: 86, cells: 108 },
      },
      Audi: {
        'Q4 e-tron 35': { grossKwh: 55, netKwh: 52, cells: 96 },
        'Q4 e-tron 40': { grossKwh: 82, netKwh: 77, cells: 96 },
        'Q4 e-tron 50': { grossKwh: 82, netKwh: 77, cells: 96 },
      },
      Cupra: {
        'Born 110 kW': { grossKwh: 58, netKwh: 55, cells: 96 },
        'Born 150 kW': { grossKwh: 62, netKwh: 58, cells: 96 },
        'Born 170 kW': { grossKwh: 82, netKwh: 77, cells: 96 },
      },
    },
  },
};

/**
 * Detect which platform a set of PID names belongs to.
 * @param {string[]} pidNames - Array of PID/channel names from the CSV
 * @returns {string|null} - Platform key (e.g. 'meb') or null if unrecognized
 */
export function detectPlatform(pidNames) {
  for (const [platformKey, platform] of Object.entries(carProfiles)) {
    if (platform.detect(pidNames)) {
      return platformKey;
    }
  }
  return null;
}

/**
 * Get all makes available for a given platform.
 * @param {string} platformKey
 * @returns {string[]} - Array of make names, or empty array if platform not found
 */
export function getMakes(platformKey) {
  const platform = carProfiles[platformKey];
  if (!platform) return [];
  return Object.keys(platform.makes);
}

/**
 * Get all models for a given platform and make.
 * @param {string} platformKey
 * @param {string} make
 * @returns {string[]} - Array of model names, or empty array if not found
 */
export function getModels(platformKey, make) {
  const platform = carProfiles[platformKey];
  if (!platform) return [];
  const makeData = platform.makes[make];
  if (!makeData) return [];
  return Object.keys(makeData);
}

/**
 * Get the specs for a specific model.
 * @param {string} platformKey
 * @param {string} make
 * @param {string} model
 * @returns {{ grossKwh: number, netKwh: number, cells: number }|null}
 */
export function getModelSpecs(platformKey, make, model) {
  const platform = carProfiles[platformKey];
  if (!platform) return null;
  const makeData = platform.makes[make];
  if (!makeData) return null;
  return makeData[model] ?? null;
}
