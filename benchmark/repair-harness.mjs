import {compileCasePack, modelContext} from '../src/case-pack.mjs';
import {repairLoop} from '../src/agent.mjs';
import {evaluate} from '../src/engine.mjs';
import {benchmarkManifest, compileBenchmark, manifestDigest} from './corpus.mjs';

function visibleScenario(group, candidateSQL) {
  return compileCasePack({
    ...structuredClone(group.pack), baselineSQL: candidateSQL,
    fixtures: group.pack.fixtures.filter(fixture => group.visibleFixtureIds.includes(fixture.id)).map(fixture => structuredClone(fixture)),
  });
}

function score(report) {
  return {
    passed: report.passed, total: report.total,
    invalid: report.results.filter(result => result.invalid).length,
    errors: report.results.filter(result => result.error).length,
    fixtureIds: report.results.map(result => result.id),
  };
}

function allPassed(report) {
  return report.total > 0 && report.passed === report.total;
}

function roundsFor(mode) {
  if (mode === 'one-shot') return 1;
  if (mode === 'execution-feedback') return 2;
  throw new Error('Choose one-shot or execution-feedback evaluation mode.');
}

/**
 * The caller supplies a proposal transport. This module never loads credentials or
 * creates a provider client. The only rows passed to repairLoop are visible rows.
 */
export async function repairVisibleCase({SQL, group, change, requestProposal, mode = 'execution-feedback', signal, onStep = () => {}}) {
  if (typeof requestProposal !== 'function') throw new Error('An explicit proposal function is required.');
  const maxRounds = roundsFor(mode);
  const scenario = visibleScenario(group, change.candidateSQL);
  const context = modelContext(scenario);
  const originalVisible = evaluate(SQL, scenario, change.candidateSQL);
  const steps = [];
  const output = await repairLoop({
    sql: change.candidateSQL, action: 'repair', initialReport: originalVisible, maxRounds,
    requestProposal: input => requestProposal({...input, caseId: change.id, context: structuredClone(context)}),
    evaluateSQL: async (sql, extra) => evaluate(SQL, scenario, sql, extra),
    onStep(step) {
      if (step.phase === 'checked') {
        steps.push({
          round: step.round, sql: step.candidate.sql,
          visible: score(evaluate(SQL, scenario, step.candidate.sql)),
          generatedFixtures: step.extra.map(fixture => fixture.id),
        });
      }
      onStep({caseId: change.id, ...step});
    },
    signal,
  });
  signal?.throwIfAborted();
  if (!output.candidate) throw new Error('No candidate was returned by the visible repair loop.');
  return {
    mode, maxRounds,
    finalSQL: output.candidate.sql,
    originalVisible: score(originalVisible),
    finalVisible: score(evaluate(SQL, scenario, output.candidate.sql)),
    steps, proposalCalls: output.calls.length,
    generatedFixtures: output.extra.map(fixture => ({id: fixture.id, source: 'model-generated'})),
    provenance: output.candidate.provenance ?? null,
  };
}

/**
 * Runs only when explicitly called with an injected proposal function. All held-out
 * execution, including the original control, happens after each repair loop ends.
 * Mock proposals do not become live evidence. Frozen suite totals exclude generated
 * challenge fixtures. A failed/budget-stopped loop is recorded and not accepted.
 */
export async function runRepairBenchmark({SQL, manifest = benchmarkManifest, caseIds, requestProposal, mode = 'execution-feedback', maxCalls = 48, signal, onEvent = () => {}}) {
  if (typeof requestProposal !== 'function') throw new Error('An explicit proposal function is required.');
  const maxRoundsPerChange = roundsFor(mode);
  if (!Number.isSafeInteger(maxCalls) || maxCalls < 0 || maxCalls > 48) throw new Error('Use an explicit proposal-call budget from 0 to 48.');
  if (caseIds !== undefined && (!Array.isArray(caseIds) || !caseIds.length || new Set(caseIds).size !== caseIds.length)) {
    throw new Error('Select unique, known benchmark change IDs.');
  }
  const compiled = compileBenchmark(manifest);
  const selected = compiled.flatMap(({group}) => group.changes.map(change => ({group, change})))
    .filter(({change}) => caseIds === undefined || caseIds.includes(change.id));
  if (caseIds !== undefined && selected.length !== caseIds.length) {
    throw new Error('Select unique, known benchmark change IDs.');
  }
  const cases = [];
  let proposalCalls = 0;
  for (const {group, change} of selected) {
    signal?.throwIfAborted();
    if (proposalCalls >= maxCalls) break;
    let repaired;
    try {
      repaired = await repairVisibleCase({
        SQL, group, change, signal, mode,
        requestProposal: async input => {
          if (proposalCalls >= maxCalls) throw new Error('Proposal-call budget exhausted.');
          proposalCalls++;
          onEvent({phase: 'proposal', caseId: change.id, call: proposalCalls});
          return requestProposal(input);
        },
      });
    } catch (error) {
      signal?.throwIfAborted();
      cases.push({id: change.id, schemaId: group.id, status: 'loop-failed', error: error.message});
      continue;
    }
    onEvent({phase: 'repair-stopped', caseId: change.id});
    const heldoutPack = {
      ...structuredClone(group.pack),
      fixtures: group.pack.fixtures.filter(fixture => group.heldoutFixtureIds.includes(fixture.id)).map(fixture => structuredClone(fixture)),
    };
    const heldout = compileCasePack(heldoutPack);
    onEvent({phase: 'heldout-start', caseId: change.id});
    const originalHeldout = score(evaluate(SQL, heldout, change.candidateSQL));
    const finalHeldout = score(evaluate(SQL, heldout, repaired.finalSQL));
    const originalCorrect = allPassed(repaired.originalVisible) && allPassed(originalHeldout);
    const finalCorrect = allPassed(repaired.finalVisible) && allPassed(finalHeldout);
    cases.push({
      id: change.id, schemaId: group.id, status: 'evaluated',
      expectedClassification: change.expectedClassification,
      ...repaired, originalHeldout, finalHeldout, originalCorrect, finalCorrect,
      repaired: !originalCorrect && finalCorrect,
      misRepaired: originalCorrect && !finalCorrect,
      falseAccepted: allPassed(repaired.finalVisible) && !allPassed(finalHeldout),
    });
  }
  const evaluated = cases.filter(item => item.status === 'evaluated');
  const repaired = evaluated.filter(item => item.repaired).length;
  const misRepaired = evaluated.filter(item => item.misRepaired).length;
  return {
    format: 'rowglass.benchmark.proposals.v1',
    kind: 'Injected-proposal evaluation; transport provenance must be reviewed separately',
    manifestVersion: manifest.version, manifestSha256: manifestDigest(manifest),
    mode, maxRoundsPerChange,
    protocol: mode === 'one-shot'
      ? 'One proposal per change using initial visible failures; held-out scoring after loop stop.'
      : 'At most two visible-feedback proposals per change; held-out scoring after loop stop.',
    transport: 'injected', liveProviderEvidence: false,
    totals: {
      selectedChanges: selected.length, evaluatedChanges: evaluated.length,
      loopFailures: cases.length - evaluated.length, notStarted: selected.length - cases.length,
      originalCorrect: evaluated.filter(item => item.originalCorrect).length,
      finalCorrect: evaluated.filter(item => item.finalCorrect).length,
      repaired, misRepaired, netRepairs: repaired - misRepaired,
      falseAccepted: evaluated.filter(item => item.falseAccepted).length,
      proposalCalls, proposalCallBudget: maxCalls,
      generatedFixtures: evaluated.reduce((sum, item) => sum + item.generatedFixtures.length, 0),
    },
    liveMeasurements: {status: 'not-established-by-this-harness', model: null, usage: null, providerLatency: null},
    cases,
  };
}
