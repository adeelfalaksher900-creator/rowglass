import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import initSqlJs from 'sql.js';
import {compileCasePack} from '../src/case-pack.mjs';
import {evaluate} from '../src/engine.mjs';
import {repairLoop} from '../src/agent.mjs';
import {sealReview} from '../src/evidence.mjs';
import {replayReview} from '../src/replay.mjs';

const SQL=await initSqlJs();
const pack=JSON.parse(await readFile(new URL('../examples/inventory.case.json',import.meta.url),'utf8'));
const proposalFixture={label:'New product without reservations',rows:{products:[[91,7]],reservations:[]}};

function envelope(scenario,step){
  return sealReview({version:'0.3.0',casePack:scenario.pack,query:scenario.broken,
    candidate:step.candidate,report:step.originalReport,candidateReport:step.candidateReport,
    execution:{fixtures:step.originalReport.results.map(({id,label,rows})=>({id,label,rows})),
      original:step.originalReport,candidate:step.candidateReport}});
}

test('an interrupted second proposal leaves a complete replayable first attempt',async()=>{
  const scenario=compileCasePack(pack);let calls=0,checked;
  await assert.rejects(repairLoop({sql:scenario.broken,action:'repair',
    initialReport:evaluate(SQL,scenario,scenario.broken),
    requestProposal:async()=>{if(++calls===2)throw new Error('Provider unavailable');
      return{sql:scenario.broken,fixture:proposalFixture,provenance:{mode:'test-only'}};},
    evaluateSQL:async(sql,extra)=>evaluate(SQL,scenario,sql,extra),
    onStep:step=>{if(step.phase==='checked')checked=step;}
  }),/Provider unavailable/);
  assert.equal(checked.originalReport.total,5);
  assert.equal(checked.candidateReport.total,5);
  assert.deepEqual(checked.originalReport.results.map(r=>r.id),checked.candidateReport.results.map(r=>r.id));
  assert.equal((await replayReview(SQL,await envelope(scenario,checked))).matches,true);
});

test('imported fixture IDs cannot collide with generated fixtures or break replay',async()=>{
  const changed=structuredClone(pack);changed.fixtures[0].id='generated-1';
  const scenario=compileCasePack(changed);let checked;
  const result=await repairLoop({sql:scenario.broken,action:'repair',
    initialReport:evaluate(SQL,scenario,scenario.broken),
    requestProposal:async()=>({sql:scenario.reference,fixture:proposalFixture,provenance:{mode:'test-only'}}),
    evaluateSQL:async(sql,extra)=>evaluate(SQL,scenario,sql,extra),
    onStep:step=>{if(step.phase==='checked')checked=step;}
  });
  const ids=result.originalReport.results.map(r=>r.id);
  assert.equal(new Set(ids).size,5);
  assert.equal(result.extra[0].id,'generated-2');
  assert.equal(result.candidateReport.passed,5);
  assert.equal((await replayReview(SQL,await envelope(scenario,checked))).matches,true);
});

test('cancellation after transport returns prevents a candidate from executing or committing',async()=>{
  const scenario=compileCasePack(pack),controller=new AbortController();let executions=0,commits=0;
  await assert.rejects(repairLoop({sql:scenario.broken,action:'repair',signal:controller.signal,
    initialReport:evaluate(SQL,scenario,scenario.broken),
    requestProposal:async()=>{controller.abort();return{sql:scenario.reference,fixture:null};},
    evaluateSQL:async()=>{executions++;},onStep:step=>{if(step.phase==='checked')commits++;}
  }),{name:'AbortError'});
  assert.equal(executions,0);assert.equal(commits,0);
});
