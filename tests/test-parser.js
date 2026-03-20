import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { parseCSV, extractDateFromFilename } from '../js/parser.js';

assert.strictEqual(extractDateFromFilename('2026-03-20 18-31-35.csv'), '2026-03-20');
assert.strictEqual(extractDateFromFilename('random-export.csv'), null);

const csv = readFileSync(new URL('./sample.csv', import.meta.url), 'utf-8');
const result = parseCSV(csv);

assert.ok(result.rows.length > 0);
const firstRow = result.rows[0];
assert.ok('seconds' in firstRow && 'pid' in firstRow && 'value' in firstRow && 'units' in firstRow);
assert.ok(result.pidNames.length > 10);
assert.ok(result.pidNames.some(p => p.includes('Batteriezellspannung Zelle')));
assert.ok(result.totalPoints > 3000);

const latest = result.getLatestValues();
assert.ok(latest instanceof Map && latest.size > 10);

const cellVoltages = result.getCellVoltages();
assert.strictEqual(cellVoltages.length, 96);
assert.ok(cellVoltages[0] > 3.0 && cellVoltages[0] < 4.5);

const temps = result.getTemperatures();
assert.ok(temps.length > 0 && temps.length <= 24);

console.log('✓ All parser tests passed');
