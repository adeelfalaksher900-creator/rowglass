import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import initSqlJs from 'sql.js';
import {compileCasePack,modelContext,toCasePack} from '../src/case-pack.mjs';
import {evaluate,sqlVolatilityWarnings,validateReferenceCheck} from '../src/engine.mjs';
import {resultDelta,reviewMarkdown} from '../src/review.mjs';
import {createRegressionCase} from '../src/regression.mjs';
import {createReviewRecord} from '../src/review-record.mjs';
import {sealReview} from '../src/evidence.mjs';
import {replayReview} from '../src/replay.mjs';
import {api} from '../server/api.mjs';

const SQL=await initSqlJs();
const pack={
  format:'rowglass.case.v1',id:'row-order',title:'Rows in order',
  contract:'Return item IDs in the required stable order.',
  tables:[{name:'items',columns:[{name:'id',type:'integer',primaryKey:true}]}],
  referenceSQL:'SELECT id FROM items ORDER BY id ASC',
  baselineSQL:'SELECT id FROM items ORDER BY id DESC',
  fixtures:[{id:'two',label:'Two items',rows:{items:[[1],[2]]}}]
};

test('ordering is optional and backward compatible, with ordered difference explained',()=>{
  const unordered=compileCasePack(pack),ordered=compileCasePack({...pack,comparison:'ordered'});
  assert.equal(unordered.comparison,'unordered');
  assert.equal(evaluate(SQL,unordered,unordered.broken).passed,1);
  const result=evaluate(SQL,ordered,ordered.broken);
  assert.equal(result.passed,0);assert.equal(result.comparison,'ordered');
  const delta=resultDelta(result.results[0].expected,result.results[0].actual,ordered.comparison);
  assert.equal(delta.orderDiffers,true);assert.deepEqual(delta.missing,[]);assert.deepEqual(delta.unexpected,[]);
  assert.equal(toCasePack(ordered).comparison,'ordered');
  assert.equal(modelContext(ordered).comparison,'ordered');
  assert.equal('referenceSQL' in modelContext(ordered),false);
  assert.throws(()=>compileCasePack({...pack,comparison:'other'}));
});

test('ordered regression export keeps the contract and reproduces the mismatch',()=>{
  const scenario=compileCasePack({...pack,comparison:'ordered'});
  const report=evaluate(SQL,scenario,scenario.broken);
  assert.ok(report.witness);
  const exported=createRegressionCase(scenario,scenario.broken,report.witness);
  assert.equal(exported.comparison,'ordered');
  assert.equal(evaluate(SQL,compileCasePack(exported),exported.baselineSQL).passed,0);
  assert.equal(evaluate(SQL,compileCasePack(exported),exported.referenceSQL).passed,1);
});

test('ordered custom case reaches the mocked model prompt without the oracle',async()=>{
  const scenario=compileCasePack({...pack,comparison:'ordered'});
  const req=new Request('https://example.test/api/agent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scenarioId:scenario.id,scenarioContext:modelContext(scenario),sql:scenario.broken,action:'repair'})});
  let called=false;
  const response=await api(req,{NEBIUS_API_KEY:'test-only',ROWGLASS_PROVIDER_MODE:'private'},async(url,options)=>{
    called=true;
    const payload=JSON.parse(options.body),task=JSON.parse(payload.messages[1].content);
    assert.equal(task.scenario.comparison,'ordered');
    assert.equal('reference' in task.scenario,false);
    assert.equal(JSON.stringify(task).includes(pack.referenceSQL),false);
    return Response.json({id:'mock-order',choices:[{message:{content:JSON.stringify({sql:pack.baselineSQL,explanation:'Mock test.',cautions:[],fixture:null})}}]});
  });
  assert.equal(response.status,200);assert.equal(called,true);
  assert.equal((await response.json()).provenance.mode,'test-only');
});

test('review replay preserves order and detects a reordered snapshot even with a new digest',async()=>{
  const scenario=compileCasePack({...pack,comparison:'ordered'});
  const report=evaluate(SQL,scenario,scenario.broken);
  const record=createReviewRecord({scenario,query:scenario.broken,report});
  const envelope=await sealReview(record);
  assert.equal((await replayReview(SQL,envelope)).matches,true);
  assert.match(reviewMarkdown(record),/Row order: significant/);
  const changed=structuredClone(record);
  changed.execution.original.results[0].actual[0].values.reverse();
  assert.equal((await replayReview(SQL,await sealReview(changed))).matches,false);
});

test('volatility warnings detect obvious functions without flagging comments or literals',()=>{
  assert.match(sqlVolatilityWarnings('SELECT random()')[0],/RANDOM/);
  assert.match(sqlVolatilityWarnings("SELECT datetime('now')")[0],/current time/);
  assert.match(sqlVolatilityWarnings('SELECT CURRENT_TIMESTAMP')[0],/current time/);
  assert.match(sqlVolatilityWarnings('SELECT date()')[0],/current time/);
  assert.deepEqual(sqlVolatilityWarnings("SELECT 'random()', 'now' -- random()\n"),[]);
  assert.deepEqual(sqlVolatilityWarnings("SELECT date('2024-01-01')"),[]);
  const scenario=compileCasePack({...pack,baselineSQL:'SELECT random() AS id FROM items'});
  const report=evaluate(SQL,scenario,scenario.broken);
  assert.ok(report.warnings.length);assert.equal(report.witness,null);
});

test('CLI prints volatility warning before reporting invalid references',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'rowglass-warning-'));
  try{
    const input=join(dir,'case.json'),prefix=join(dir,'review');
    await writeFile(input,JSON.stringify({...pack,referenceSQL:'SELECT random() + missing_column FROM items'}));
    const run=spawnSync(process.execPath,['cli/rowglass.mjs','check',input,'--out',prefix],{encoding:'utf8',timeout:20000,env:{PATH:process.env.PATH}});
    assert.equal(run.status,2);assert.match(run.stderr,/warning: Reference query uses RANDOM/);assert.match(run.stderr,/Reference SQL or fixture constraints are invalid/);
    await assert.rejects(readFile(prefix+'.json','utf8'));
  }finally{await rm(dir,{recursive:true,force:true});}
});

test('reference validation explains volatility when its self-check fails',()=>{
  const scenario=compileCasePack({...pack,referenceSQL:'SELECT random() + missing_column AS id FROM items'});
  const report=evaluate(SQL,scenario,scenario.reference);
  assert.equal(report.passed,0);
  assert.throws(()=>validateReferenceCheck(report),/Reference query uses RANDOM.*reference self-check failed.*detection is incomplete/);
  assert.throws(()=>validateReferenceCheck({passed:0,total:1,warnings:[]}),/reference or fixture constraints failed/);
});

test('review markdown carries candidate warnings and explains suppressed reduction',()=>{
  const scenario=compileCasePack(pack);
  const report=evaluate(SQL,scenario,'SELECT random() AS id FROM items');
  const candidate={sql:'SELECT random() AS id FROM items'};
  const candidateReport=evaluate(SQL,scenario,candidate.sql);
  const record=createReviewRecord({scenario,query:scenario.broken,report,candidate,candidateReport});
  const markdown=reviewMarkdown(record);
  assert.match(markdown,/Candidate warnings: Proposed query uses RANDOM/);
  assert.match(markdown,/Not reduced because a query appears nondeterministic/);
});

test('CLI repair prints and exports volatile candidate warnings with a mocked provider',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'rowglass-candidate-warning-'));
  try{
    const input=join(dir,'case.json'),prefix=join(dir,'review'),mock=join(dir,'mock-provider.mjs');
    await writeFile(input,JSON.stringify(pack));
    await writeFile(mock,`globalThis.fetch=async()=>Response.json({id:'mock-only',choices:[{message:{content:JSON.stringify({sql:'SELECT random() AS id FROM items',explanation:'Mock candidate.',cautions:[],fixture:null})}}]});\n`);
    const run=spawnSync(process.execPath,['--import',mock,'cli/rowglass.mjs','repair',input,'--out',prefix],{encoding:'utf8',timeout:20000,env:{PATH:process.env.PATH,NEBIUS_API_KEY:'test-only',ROWGLASS_PROVIDER_MODE:'private'}});
    assert.equal(run.status,1,run.stderr);
    assert.match(run.stderr,/candidate warning: Proposed query uses RANDOM/);
    assert.match(await readFile(prefix+'.md','utf8'),/Candidate warnings: Proposed query uses RANDOM/);
    const saved=JSON.parse(await readFile(prefix+'.json','utf8'));
    assert.match(saved.data.execution.candidate.warnings[0],/RANDOM/);
  }finally{await rm(dir,{recursive:true,force:true});}
});
