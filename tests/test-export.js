import assert from 'node:assert';
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

const compressed = await compressData(sampleReport);
assert.ok(typeof compressed === 'string', 'Compressed should be a string');
assert.ok(compressed.length > 0, 'Compressed should be non-empty');
assert.ok(compressed.length < 2000, 'Compressed should be under 2000 chars');

const decompressed = await decompressData(compressed);
assert.deepStrictEqual(decompressed.meta.date, sampleReport.meta.date);
assert.deepStrictEqual(decompressed.vehicle.make, sampleReport.vehicle.make);
assert.strictEqual(decompressed.cells.count, 96);
assert.strictEqual(decompressed.cells.voltages.length, 96);

console.log(`✓ All export tests passed (compressed size: ${compressed.length} chars)`);
