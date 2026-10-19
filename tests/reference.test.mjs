import test from 'node:test';
import assert from 'node:assert/strict';
import {loadReferenceRepair,resetLocalReview} from '../src/review-actions.mjs';
import {sqlTokens} from '../src/sql-tokens.mjs';

test('a failed reference evaluation clears earlier passing evidence without exposing an unchecked candidate', async () => {
  let state = {candidate: {sql: 'SELECT 1'}, report: {passed: 9, total: 9}};
  const actions = [];
  await assert.rejects(loadReferenceRepair({
    clear() { state = {candidate: null, report: null}; },
    run: async (action) => { actions.push(action); if (action === 'reference') return {sql: 'SELECT 2', label: 'Reference'}; throw new Error('Worker failed'); },
    commit(candidate, report) { state = {candidate, report}; },
  }), /Worker failed/);
  assert.deepEqual(state, {candidate: null, report: null});
  assert.deepEqual(actions, ['reference', 'evaluate']);
});

test('reference commits only after evaluation and ignores an invalidated revision', async () => {
  let current = true, commits = 0;
  await loadReferenceRepair({clear() {}, isCurrent: () => current,
    run: async action => { if (action === 'reference') return {sql: 'SELECT 2'}; current = false; return {passed: 1, total: 1}; },
    commit() { commits++; },
  });
  assert.equal(commits, 0);
  current = true;
  await loadReferenceRepair({clear() {}, isCurrent: () => current,
    run: async action => action === 'reference' ? {sql: 'SELECT 2', label: 'Reviewed reference'} : {passed: 1, total: 1},
    commit(candidate, report) { commits++; assert.equal(candidate.provenance.mode, 'reference'); assert.equal(candidate.sql, 'SELECT 2'); assert.equal(report.passed, 1); },
  });
  assert.equal(commits, 1);
});

test('SQL presentation preserves Unicode, line endings, comments and literal markup exactly', () => {
  for (const sql of ["SELECT '学生 <script>&', COUNT(id)\r\nFROM users -- NULL\nWHERE x IS NULL;", '/* unfinished comment\nSELECT', 'SELECT "A""B", 12.5, \'it\'\'s safe\';', '']) {
    assert.equal(sqlTokens(sql).map(token => token.text).join(''), sql);
  }
  assert.equal(sqlTokens("'NULL'")[0].kind, 'string');
  assert.equal(sqlTokens('-- SELECT')[0].kind, 'comment');
});


test('reset failure or stale completion never associates earlier passing evidence with the broken query',async()=>{
  let state={query:'correct',report:{passed:9,total:9}},current=true;
  const clear=()=>{state={query:'broken',report:null};};
  const commit=report=>{state={...state,report};};
  await assert.rejects(resetLocalReview({clear,commit,evaluate:async()=>{throw Error('Worker failed');}}),/Worker failed/);
  assert.deepEqual(state,{query:'broken',report:null});
  await resetLocalReview({clear,commit,isCurrent:()=>current,evaluate:async()=>{current=false;return {passed:3,total:9};}});
  assert.equal(state.report,null);
  current=true;
  await resetLocalReview({clear,commit,isCurrent:()=>current,evaluate:async()=>({passed:3,total:9})});
  assert.deepEqual(state.report,{passed:3,total:9});
});
