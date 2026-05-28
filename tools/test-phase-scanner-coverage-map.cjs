#!/usr/bin/env node

'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const fixtureDir = path.join(repoRoot, 'examples', 'phase-scanner');
const fixtureTestPath = path.join(repoRoot, 'tools', 'test-phase-scanner-fixtures.cjs');
const coveragePath = path.join(repoRoot, 'docs', 'PHASE_SCANNER_FIXTURE_COVERAGE_v0.md');

const fixtureTest = fs.readFileSync(fixtureTestPath, 'utf8');
const coverageMap = fs.readFileSync(coveragePath, 'utf8');

const inputFixtures = fs.readdirSync(fixtureDir)
  .filter((name) => name.endsWith('.input.json'))
  .sort();

assert.ok(inputFixtures.length > 0, 'phase scanner input fixtures exist');

for (const inputFixture of inputFixtures) {
  const outputFixture = inputFixture.replace(/\.input\.json$/, '.output.json');
  const outputPath = path.join(fixtureDir, outputFixture);

  assert.ok(fs.existsSync(outputPath), `${inputFixture}: output fixture exists`);
  assert.match(fixtureTest, new RegExp(inputFixture.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${inputFixture}: listed in fixture test`);
  assert.match(fixtureTest, new RegExp(outputFixture.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${outputFixture}: listed in fixture test`);
  assert.match(coverageMap, new RegExp(inputFixture.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${inputFixture}: listed in coverage map`);
}

process.stdout.write('phase scanner coverage map: PASS\n');
