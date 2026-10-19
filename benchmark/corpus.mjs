import {sha256} from '@noble/hashes/sha2.js';
import {bytesToHex} from '@noble/hashes/utils.js';
import {compileCasePack} from '../src/case-pack.mjs';
import {execute, equalResults, readOnlySql} from '../src/engine.mjs';
import {benchmarkManifest} from './manifest.mjs';

export {benchmarkManifest};

function stableJSON(value) {
  if (Array.isArray(value)) return `[${value.map(stableJSON).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJSON(value[key])}`).join(',')}}`;
  }
  const serialized = JSON.stringify(value);
  if (serialized === undefined) throw new Error('The benchmark manifest must contain JSON data only.');
  return serialized;
}

export function manifestDigest(manifest = benchmarkManifest) {
  return bytesToHex(sha256(new TextEncoder().encode(stableJSON(manifest))));
}

/** Validate the split and data envelope without running candidate or reference SQL. */
export function compileBenchmark(manifest = benchmarkManifest) {
  if (manifest?.format !== 'rowglass.benchmark.manifest.v1' || !Array.isArray(manifest.schemas)) {
    throw new Error('Expected a rowglass.benchmark.manifest.v1 manifest.');
  }
  const schemaIds = new Set(), changeIds = new Set();
  return manifest.schemas.map(group => {
    if (schemaIds.has(group.id) || group.id !== group.pack?.id) throw new Error('Benchmark schema IDs must be unique and match their case pack.');
    schemaIds.add(group.id);
    const scenario = compileCasePack(group.pack);
    const visibleIds = group.visibleFixtureIds, heldoutIds = group.heldoutFixtureIds;
    if (!Array.isArray(visibleIds) || !visibleIds.length || !Array.isArray(heldoutIds) || !heldoutIds.length) {
      throw new Error('Every schema needs explicit nonempty visible and held-out splits.');
    }
    const splitIds = [...visibleIds, ...heldoutIds];
    const fixtureIds = group.pack.fixtures.map(fixture => fixture.id);
    if (new Set(splitIds).size !== splitIds.length || splitIds.length !== fixtureIds.length || splitIds.some(id => !fixtureIds.includes(id))) {
      throw new Error('Visible and held-out IDs must partition the fixture set exactly once.');
    }
    if (!Array.isArray(group.independentExpectations) || group.independentExpectations.length !== fixtureIds.length) {
      throw new Error('Every fixture requires an independently calculated expected result.');
    }
    const expectedIds = group.independentExpectations.map(item => item.fixtureId);
    if (new Set(expectedIds).size !== expectedIds.length || expectedIds.some(id => !fixtureIds.includes(id))) {
      throw new Error('Independent expectations must cover each fixture exactly once.');
    }
    for (const item of group.independentExpectations) {
      if (typeof item.calculation !== 'string' || item.calculation.length < 10 || !Array.isArray(item.expected) || item.expected.length !== 1 || !Array.isArray(item.expected[0]?.columns) || !Array.isArray(item.expected[0]?.values)) {
        throw new Error('Expected result and its independent calculation must be recorded.');
      }
    }
    if (!Array.isArray(group.changes) || !group.changes.length) throw new Error('A benchmark schema needs candidate changes.');
    for (const change of group.changes) {
      if (typeof change.id !== 'string' || changeIds.has(change.id)) throw new Error('Benchmark change IDs must be unique.');
      changeIds.add(change.id);
      if (!['wrong-mutation', 'equivalent-rewrite'].includes(change.expectedClassification) || !Array.isArray(change.taxonomy) || !change.taxonomy.length || typeof change.provenance !== 'string') {
        throw new Error('Candidate classification, taxonomy and provenance are required.');
      }
      readOnlySql(change.candidateSQL);
    }
    return {group, scenario};
  });
}

/** Offline finite controls only. No provider, file, network or clock access. */
export function validateBenchmark(SQL, manifest = benchmarkManifest) {
  const compiled = compileBenchmark(manifest);
  const controls = [], referenceChecks = [];
  for (const {group, scenario} of compiled) {
    for (const fixture of group.pack.fixtures) {
      const independent = group.independentExpectations.find(item => item.fixtureId === fixture.id);
      const reference = execute(SQL, scenario, fixture.rows, group.pack.referenceSQL);
      if (!equalResults(reference, independent.expected)) {
        throw new Error(`Independent expectation disagrees with the trusted reference: ${group.id}/${fixture.id}.`);
      }
      referenceChecks.push({schemaId: group.id, fixtureId: fixture.id, passed: true});
    }
    for (const change of group.changes) {
      const results = group.pack.fixtures.map(fixture => {
        const independent = group.independentExpectations.find(item => item.fixtureId === fixture.id);
        const actual = execute(SQL, scenario, fixture.rows, change.candidateSQL);
        return {
          fixtureId: fixture.id,
          split: group.visibleFixtureIds.includes(fixture.id) ? 'visible' : 'heldout',
          passed: equalResults(actual, independent.expected),
        };
      });
      const observed = results.every(result => result.passed) ? 'equivalent-rewrite' : 'wrong-mutation';
      if (observed !== change.expectedClassification) {
        throw new Error(`Candidate control does not have its frozen classification: ${change.id}.`);
      }
      const split = name => {
        const checks = results.filter(result => result.split === name);
        return {passed: checks.filter(result => result.passed).length, total: checks.length};
      };
      controls.push({
        id: change.id, schemaId: group.id, taxonomy: change.taxonomy,
        expectedClassification: change.expectedClassification, observedClassification: observed,
        visible: split('visible'), heldout: split('heldout'), results,
      });
    }
  }
  return {
    format: 'rowglass.benchmark.controls.v1',
    kind: 'Offline synthetic controls, not live model evaluation',
    manifestVersion: manifest.version, manifestSha256: manifestDigest(manifest),
    oracle: manifest.provenance.oracle,
    totals: {
      schemas: compiled.length, changes: controls.length,
      wrongMutations: controls.filter(control => control.expectedClassification === 'wrong-mutation').length,
      equivalentRewrites: controls.filter(control => control.expectedClassification === 'equivalent-rewrite').length,
      referenceChecks: referenceChecks.length, referencePassed: referenceChecks.length,
      candidateChecks: controls.reduce((sum, control) => sum + control.results.length, 0),
      wrongMutationsRejected: controls.filter(control => control.observedClassification === 'wrong-mutation').length,
      equivalentRewritesPreserved: controls.filter(control => control.observedClassification === 'equivalent-rewrite').length,
    },
    referenceChecks, controls,
    liveEvaluation: {status: 'not-run', modelCalls: 0, usage: null, latency: null},
    limitations: manifest.provenance.limitations,
  };
}
