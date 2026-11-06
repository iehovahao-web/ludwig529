#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const engine = require(path.join(root, 'japan-holidays.js'));
const officialPath = path.join(root, 'assets/data/japan-holidays-official.json');
const fixturePath = path.join(root, 'tests/fixtures/syukujitsu-2026-2027.csv');
const officialData = JSON.parse(fs.readFileSync(officialPath, 'utf8'));
const calendar = engine.createOfficialCalendar(officialData);

const expected2026 = [
  ['01-01', 'newyear'], ['01-12', 'comingage'], ['02-11', 'foundation'], ['02-23', 'emperor'],
  ['03-20', 'vernal'], ['04-29', 'showa'], ['05-03', 'constitution'], ['05-04', 'greenery'],
  ['05-05', 'children'], ['05-06', 'substitute'], ['07-20', 'marine'], ['08-11', 'mountain'],
  ['09-21', 'respect'], ['09-22', 'citizens'], ['09-23', 'autumnal'], ['10-12', 'sports'],
  ['11-03', 'culture'], ['11-23', 'labor']
];
const expected2027 = [
  ['01-01', 'newyear'], ['01-11', 'comingage'], ['02-11', 'foundation'], ['02-23', 'emperor'],
  ['03-21', 'vernal'], ['03-22', 'substitute'], ['04-29', 'showa'], ['05-03', 'constitution'],
  ['05-04', 'greenery'], ['05-05', 'children'], ['07-19', 'marine'], ['08-11', 'mountain'],
  ['09-20', 'respect'], ['09-23', 'autumnal'], ['10-11', 'sports'], ['11-03', 'culture'],
  ['11-23', 'labor']
];

function compactYear(year) {
  return officialData.holidays
    .filter(item => item.date.startsWith(`${year}-`))
    .map(item => [item.date.slice(5), item.id]);
}

assert.deepEqual(compactYear(2026), expected2026, '2026 must match the complete Cabinet Office table');
assert.deepEqual(compactYear(2027), expected2027, '2027 must match the complete Cabinet Office table');
for (const year of [2026, 2027]) {
  const nationalIds = officialData.holidays
    .filter(item => item.date.startsWith(`${year}-`) && item.kind === 'national-holiday')
    .map(item => item.id)
    .sort();
  assert.deepEqual(nationalIds, [...engine.EXPECTED_NATIONAL_IDS].sort(), `${year} must contain all 16 named holidays`);
}

assert.equal(calendar.entries.get('2026-05-06').legalBasis.endsWith('第3条第2項'), true);
assert.equal(calendar.entries.get('2026-09-22').legalBasis.endsWith('第3条第3項'), true);
assert.equal(calendar.entries.get('2027-03-22').id, 'substitute');
assert.equal(engine.resolve({ year: 2026, month: 5, day: 6 }, calendar).source, 'cabinet-office-csv');
assert.equal(engine.resolve({ year: 2026, month: 5, day: 7 }, calendar), null);

const fallback2050 = engine.buildFallbackYear(2050);
assert.equal(fallback2050.get('2050-01-10').id, 'comingage', 'second Monday rule');
assert.equal(fallback2050.get('2050-03-20').id, 'vernal', 'future equinox approximation');
assert.equal(fallback2050.get('2050-03-21').id, 'substitute', 'Sunday substitute rule');
assert.equal(fallback2050.get('2050-07-18').id, 'marine', 'third Monday rule');
assert.equal(fallback2050.get('2050-09-19').id, 'respect', 'third Monday rule');
assert.equal(fallback2050.get('2050-10-10').id, 'sports', 'second Monday rule');
assert.equal(engine.resolve({ year: 2050, month: 3, day: 21 }, calendar).source, 'calculated-fallback');
assert.equal(engine.buildFallbackYear(2032).get('2032-09-21').id, 'citizens', 'holiday-sandwich rule');

const coveredEmpty = engine.createOfficialCalendar({
  schemaVersion: 1,
  coverage: { years: [2050] },
  holidays: []
});
assert.equal(
  engine.resolve({ year: 2050, month: 1, day: 1 }, coveredEmpty),
  null,
  'an officially covered year must never be filled with calculated dates'
);

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'kansai-holiday-test-'));
const generatedPath = path.join(temporaryDirectory, 'official.json');
try {
  execFileSync('python3', [
    path.join(root, 'scripts/sync-japan-holidays.py'),
    '--input', fixturePath,
    '--output', generatedPath,
    '--from-year', '2026'
  ], { cwd: root, stdio: 'pipe' });
  const fixtureGenerated = JSON.parse(fs.readFileSync(generatedPath, 'utf8'));
  assert.deepEqual(
    fixtureGenerated.holidays,
    officialData.holidays.filter(item => Number(item.date.slice(0, 4)) >= 2026 && Number(item.date.slice(0, 4)) <= 2027),
    'Shift_JIS fixture generation must reproduce the official 2026/2027 rows'
  );
  const before = fs.readFileSync(generatedPath);
  execFileSync('python3', [
    path.join(root, 'scripts/sync-japan-holidays.py'),
    '--input', fixturePath,
    '--output', generatedPath,
    '--from-year', '2026'
  ], { cwd: root, stdio: 'pipe' });
  assert.deepEqual(fs.readFileSync(generatedPath), before, 'repeated generation must be byte-for-byte deterministic');
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}

console.log('Japan holiday data and fallback rules: all checks passed.');
