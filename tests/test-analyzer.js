import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { parseCSV } from '../js/parser.js';
import { analyze, computeBalanceScore, runHealthChecks } from '../js/analyzer.js';

const csv = readFileSync(new URL('./sample.csv', import.meta.url), 'utf-8');
const parsed = parseCSV(csv);

// Test balance score computation
assert.strictEqual(computeBalanceScore(0), 100, 'Zero delta = 100%');
assert.strictEqual(computeBalanceScore(0.020), 0, '20mV delta = 0%');
assert.strictEqual(computeBalanceScore(0.010), 50, '10mV delta = 50%');
assert.ok(computeBalanceScore(0.007) > 60, '7mV delta should be > 60%');

// Test full analysis
const vehicleInfo = { make: 'Skoda', model: 'Enyaq iV 80', mileage: 56483, grossKwh: 82, netKwh: 77, userSoh: null };
const result = analyze(parsed, vehicleInfo);

assert.ok(result.meta && result.vehicle && result.cells && result.temperatures && result.bms && result.energy && result.healthChecks && result.allPids);
assert.strictEqual(result.cells.count, 96);
assert.strictEqual(result.cells.voltages.length, 96);
assert.ok(result.cells.min.value > 3.0);
assert.ok(result.cells.max.value < 4.5);
assert.ok(result.cells.delta < 0.020);
assert.ok(result.cells.balanceScore > 50);
assert.ok(result.temperatures.count > 0);
assert.ok(result.temperatures.values.length > 0);
assert.ok(result.healthChecks.cellSpreadOk);
assert.ok(Object.keys(result.allPids).length > 0);
assert.ok(result.allPids['8C.BMS']);

console.log('✓ All analyzer tests passed');
