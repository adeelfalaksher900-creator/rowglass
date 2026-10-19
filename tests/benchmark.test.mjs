import test from 'node:test';
import assert from 'node:assert/strict';
import initSqlJs from 'sql.js';
import {spawnSync} from 'node:child_process';
import {mkdtemp, readFile, readdir, rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {benchmarkManifest, compileBenchmark, manifestDigest, validateBenchmark} from '../benchmark/corpus.mjs';
import {repairVisibleCase, runRepairBenchmark} from '../benchmark/repair-harness.mjs';
import {repairLoop} from '../src/agent.mjs';

const SQL = await initSqlJs();
const frozenDigest = '9f6a815c18d181479dae1dd40960224741d8c65c2fcc45c544c8bae578f0d5ca';
const groupFor = id => benchmarkManifest.schemas.find(group => group.id === id);

test('frozen corpus has 24 changes, 6 typed schemas and independently checked positive/negative controls', () => {
  const report = validateBenchmark(SQL);
  assert.deepEqual(report.totals, {
    schemas: 6, changes: 24, wrongMutations: 18, equivalentRewrites: 6,
    referenceChecks: 24, referencePassed: 24, candidateChecks: 96,
    wrongMutationsRejected: 18, equivalentRewritesPreserved: 6,
  });
  assert.equal(report.manifestSha256, frozenDigest);
  assert.equal(report.liveEvaluation.status, 'not-run');
  for (const group of benchmarkManifest.schemas) {
    assert.equal(group.changes.length, 4);
    assert.equal(group.changes.filter(change => change.expectedClassification === 'equivalent-rewrite').length, 1);
    assert.equal(group.visibleFixtureIds.length, 2);
    assert.equal(group.heldoutFixtureIds.length, 2);
    assert.ok(group.independentExpectations.every(item => item.calculation.length > 10));
  }
  const required = ['outer-join', 'null', 'duplicates', 'aggregation-grain', 'boundaries', 'ties', 'division', 'columns'];
  assert.ok(required.every(topic => report.controls.some(control => control.taxonomy.includes(topic))));
});

test('manifest identity is stable across object key order, and content changes alter its digest', () => {
  const reordered = Object.fromEntries(Object.entries(benchmarkManifest).reverse());
  assert.equal(manifestDigest(reordered), frozenDigest);
  const changed = structuredClone(benchmarkManifest);
  changed.schemas[0].pack.fixtures[0].rows.customers[0][1] = 'Changed';
  assert.notEqual(manifestDigest(changed), frozenDigest);
  assert.throws(() => validateBenchmark(SQL, changed), /Independent expectation disagrees/);
});

test('split overlap, missing independent oracles and invalid foreign keys cannot pass validation', () => {
  let changed = structuredClone(benchmarkManifest);
  changed.schemas[0].heldoutFixtureIds[0] = changed.schemas[0].visibleFixtureIds[0];
  assert.throws(() => compileBenchmark(changed), /partition/);
  changed = structuredClone(benchmarkManifest);
  changed.schemas[0].independentExpectations.pop();
  assert.throws(() => compileBenchmark(changed), /independently calculated/);
  changed = structuredClone(benchmarkManifest);
  changed.schemas[0].pack.fixtures[0].rows.orders[0][1] = 999;
  assert.throws(() => validateBenchmark(SQL, changed), /FOREIGN KEY/);
});

test('execution-feedback repair sees only visible rows, with gold SQL and held-out rows excluded', async () => {
  const group = groupFor('retained-customers'), change = group.changes[0];
  const requests = [], events = [];
  let loopStopped = false, heldoutInsertions = 0;
  const monitoredSQL = {
    ...SQL,
    Database: class extends SQL.Database {
      prepare(sql, ...args) {
        const statement = super.prepare(sql, ...args);
        if (/^INSERT INTO "customers"/.test(sql)) {
          const originalRun = statement.run.bind(statement);
          statement.run = values => {
            if (values[0] >= 11) {
              heldoutInsertions++;
              assert.equal(loopStopped, true, 'held-out SQLite execution began before repair stopped');
            }
            return originalRun(values);
          };
        }
        return statement;
      }
    },
  };
  const report = await runRepairBenchmark({
    SQL: monitoredSQL, caseIds: [change.id], mode: 'execution-feedback',
    requestProposal: async input => {
      requests.push(structuredClone(input));
      return {sql: requests.length === 1 ? group.changes[1].candidateSQL : group.changes[3].candidateSQL, fixture: null, provenance: {mode: 'mock'}};
    },
    onEvent(event) {
      events.push(event.phase);
      if (event.phase === 'repair-stopped') loopStopped = true;
    },
  });
  assert.equal(requests.length, 2);
  assert.ok(heldoutInsertions > 0);
  assert.deepEqual(events, ['proposal', 'proposal', 'repair-stopped', 'heldout-start']);
  const serialized = JSON.stringify(requests);
  assert.equal(serialized.includes(group.pack.referenceSQL), false);
  for (const forbidden of [...group.heldoutFixtureIds, 'Cam', 'Dee', 'Eli']) assert.equal(serialized.includes(forbidden), false);
  for (const input of requests) {
    assert.deepEqual(Object.keys(input.context).sort(), ['contract', 'id', 'tables', 'title']);
    assert.equal('referenceSQL' in input.context, false);
    assert.equal('fixtures' in input.context, false);
  }
  assert.equal(report.totals.repaired, 1);
  assert.equal(report.totals.proposalCalls, 2);
  assert.equal(report.totals.evaluatedChanges, 1);
  assert.equal(report.liveProviderEvidence, false);
  assert.equal(report.mode, 'execution-feedback');
  assert.equal(report.maxRoundsPerChange, 2);
  assert.equal(requests[1].sql, group.changes[1].candidateSQL);
  const revisedFeedback = JSON.parse(requests[1].feedback);
  assert.ok(revisedFeedback.failures.some(failure => failure.actual.some(result => result.values.some(row => row[0] === 2 && row[2] === 1))));
});

test('one-shot scores its first failing proposal after stopping, without a revision or held-out leakage', async () => {
  const group = groupFor('retained-customers'), requests = [], events = [];
  let stopped = false, heldoutInsertions = 0;
  const monitoredSQL = {
    ...SQL,
    Database: class extends SQL.Database {
      prepare(sql, ...args) {
        const statement = super.prepare(sql, ...args);
        if (/^INSERT INTO "customers"/.test(sql)) {
          const originalRun = statement.run.bind(statement);
          statement.run = values => {
            if (values[0] >= 11) {
              heldoutInsertions++;
              assert.equal(stopped, true, 'one-shot ran held-out data before stopping');
            }
            return originalRun(values);
          };
        }
        return statement;
      }
    },
  };
  const report = await runRepairBenchmark({
    SQL: monitoredSQL, caseIds: [group.changes[0].id], mode: 'one-shot',
    requestProposal: async input => {
      requests.push(structuredClone(input));
      return {sql: group.changes[1].candidateSQL, fixture: null, provenance: {mode: 'mock'}};
    },
    onEvent(event) {
      events.push(event.phase);
      if (event.phase === 'repair-stopped') stopped = true;
    },
  });
  assert.equal(requests.length, 1);
  assert.ok(heldoutInsertions > 0);
  assert.deepEqual(events, ['proposal', 'repair-stopped', 'heldout-start']);
  const serialized = JSON.stringify(requests);
  for (const forbidden of [group.pack.referenceSQL, ...group.heldoutFixtureIds, 'Cam', 'Dee', 'Eli']) assert.equal(serialized.includes(forbidden), false);
  assert.deepEqual(Object.keys(requests[0].context).sort(), ['contract', 'id', 'tables', 'title']);
  assert.equal(report.mode, 'one-shot');
  assert.equal(report.maxRoundsPerChange, 1);
  assert.equal(report.totals.proposalCalls, 1);
  assert.equal(report.totals.evaluatedChanges, 1);
  assert.equal(report.totals.repaired, 0);
  assert.equal(report.cases[0].finalCorrect, false);
  assert.equal(report.cases[0].finalSQL, group.changes[1].candidateSQL);
  assert.equal(report.liveProviderEvidence, false);
});

test('unsupported modes and invalid maxRounds reject before proposal or execution', async () => {
  const group = groupFor('retained-customers');
  const mustNotRun = () => { throw new Error('Unexpected proposal or execution'); };
  for (const maxRounds of [0, 3, -1, '1', null, NaN]) {
    await assert.rejects(repairLoop({
      sql: 'SELECT 1', action: 'repair', maxRounds,
      requestProposal: mustNotRun, evaluateSQL: mustNotRun,
    }), /one or two proposal rounds/);
  }
  await assert.rejects(repairVisibleCase({
    SQL: {Database: mustNotRun}, group, change: group.changes[0],
    mode: 'unbounded', requestProposal: mustNotRun,
  }), /one-shot or execution-feedback/);
  await assert.rejects(runRepairBenchmark({
    SQL: {Database: mustNotRun}, mode: 'unbounded', requestProposal: mustNotRun,
  }), /one-shot or execution-feedback/);
});

test('visible passes do not imply held-out success, and a damaged correct rewrite is a mis-repair', async () => {
  const group = groupFor('fractional-progress');
  for (const change of [group.changes[0], group.changes[3]]) {
    const requests = [];
    const report = await runRepairBenchmark({
      SQL, caseIds: [change.id],
      requestProposal: async input => {
        requests.push(input);
        return {sql: group.changes[0].candidateSQL, fixture: null, provenance: {mode: 'mock'}};
      },
    });
    assert.equal(report.totals.proposalCalls, 1);
    assert.equal(report.totals.falseAccepted, 1);
    assert.equal(report.totals.finalCorrect, 0);
    assert.equal(report.totals.misRepaired, change.expectedClassification === 'equivalent-rewrite' ? 1 : 0);
    assert.equal(JSON.stringify(requests).includes('0.3333333333333333'), false);
  }
});

test('generated challenge fixtures stay separate from the frozen visible/held-out denominators', async () => {
  const group = groupFor('retained-customers');
  const report = await runRepairBenchmark({
    SQL, caseIds: [group.changes[0].id],
    requestProposal: async () => ({
      sql: group.changes[3].candidateSQL,
      fixture: {label: 'Injected synthetic extra', rows: {customers: [[77, 'Extra']], orders: []}},
      provenance: {mode: 'mock'},
    }),
  });
  assert.equal(report.totals.generatedFixtures, 1);
  assert.equal(report.cases[0].finalVisible.total, 2);
  assert.equal(report.cases[0].finalHeldout.total, 2);
  assert.deepEqual(report.cases[0].generatedFixtures, [{id: 'generated-1', source: 'model-generated'}]);
});

test('proposal budget exhaustion is a failure, never an accepted or fabricated evaluation', async () => {
  const group = groupFor('retained-customers');
  let calls = 0;
  const report = await runRepairBenchmark({
    SQL, caseIds: [group.changes[0].id], maxCalls: 1,
    requestProposal: async () => { calls++; return {sql: group.changes[0].candidateSQL, fixture: null}; },
  });
  assert.equal(calls, 1);
  assert.equal(report.totals.proposalCalls, 1);
  assert.equal(report.totals.loopFailures, 1);
  assert.equal(report.totals.evaluatedChanges, 0);
  const stopped = await runRepairBenchmark({SQL, caseIds: [group.changes[0].id], maxCalls: 0, requestProposal: () => { throw new Error('must not call'); }});
  assert.equal(stopped.totals.notStarted, 1);
  await assert.rejects(runRepairBenchmark({SQL, caseIds: ['unknown'], requestProposal: () => {}}), /known/);
  await assert.rejects(runRepairBenchmark({SQL, caseIds: 'not-an-array', requestProposal: () => {}}), /known/);
});

test('standalone visible repair rejects an invalid generated fixture', async () => {
  const group = groupFor('retained-customers');
  await assert.rejects(repairVisibleCase({
    SQL, group, change: group.changes[0],
    requestProposal: async () => ({sql: group.changes[3].candidateSQL, fixture: {label: 'Orphan order', rows: {customers: [], orders: [[1, 999, 'paid']]}}}),
  }), /violates schema constraints/);
});

test('offline CLI prints controls without writing files, and --out refuses overwrite', async () => {
  const temp = await mkdtemp(fileURLToPath(new URL('../benchmark/.test-', import.meta.url)));
  const script = fileURLToPath(new URL('../scripts/benchmark.mjs', import.meta.url));
  try {
    const result = spawnSync(process.execPath, [script], {cwd: temp, encoding: 'utf8'});
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).manifestSha256, frozenDigest);
    assert.deepEqual(await readdir(temp), []);
    const output = join(temp, 'controls.json');
    const written = spawnSync(process.execPath, [script, '--out', output], {cwd: temp, encoding: 'utf8'});
    assert.equal(written.status, 0, written.stderr);
    assert.equal(JSON.parse(await readFile(output, 'utf8')).totals.changes, 24);
    const repeated = spawnSync(process.execPath, [script, '--out', output], {cwd: temp, encoding: 'utf8'});
    assert.equal(repeated.status, 1);
    assert.match(repeated.stderr, /EEXIST/);
    assert.equal(JSON.parse(await readFile(output, 'utf8')).manifestSha256, frozenDigest);
  } finally {
    await rm(temp, {recursive: true, force: true});
  }
});
