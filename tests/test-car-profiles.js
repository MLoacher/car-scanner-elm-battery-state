import assert from 'node:assert';
import { detectPlatform, getMakes, getModels, getModelSpecs } from '../js/car-profiles.js';

// Test platform detection
assert.strictEqual(detectPlatform(['[8C.BMS] Batteriestrom', '[19.Gate] Reichweite']), 'meb');
assert.strictEqual(detectPlatform(['Speed', 'RPM', 'Throttle']), null);

// Test getMakes
const makes = getMakes('meb');
assert.ok(makes.includes('Skoda'));
assert.ok(makes.includes('VW'));
assert.deepStrictEqual(getMakes('unknown'), []);

// Test getModels
const models = getModels('meb', 'Skoda');
assert.ok(models.includes('Enyaq iV 80'));
assert.deepStrictEqual(getModels('meb', 'Unknown'), []);

// Test getModelSpecs
const specs = getModelSpecs('meb', 'Skoda', 'Enyaq iV 80');
assert.strictEqual(specs.grossKwh, 82);
assert.strictEqual(specs.netKwh, 77);
assert.strictEqual(specs.cells, 96);
assert.strictEqual(getModelSpecs('meb', 'Skoda', 'Unknown'), null);

console.log('✓ All car-profiles tests passed');
