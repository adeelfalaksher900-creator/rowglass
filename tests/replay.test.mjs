import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import initSqlJs from 'sql.js';
import {compileCasePack,toCasePack} from '../src/case-pack.mjs';
import {evaluate} from '../src/engine.mjs';
import {sealReview} from '../src/evidence.mjs';
import {replayReview} from '../src/replay.mjs';
import {scenarios} from '../src/scenarios.mjs';
import {stressFixtures} from '../src/stress.mjs';
import {evaluateIsolated} from '../cli/rowglass.mjs';
import {reviewMarkdown} from '../src/review.mjs';

const SQL=await initSqlJs();
const inventory=JSON.parse(await readFile(new URL('../examples/inventory.case.json',import.meta.url),'utf8'));
const cli=args=>spawnSync(process.execPath,['cli/rowglass.mjs',...args],{encoding:'utf8',timeout:20000,env:{PATH:process.env.PATH}});

async function record(pack=inventory,{extra=[],candidateSQL,query=pack.baselineSQL}={}){
  const scenario=compileCasePack(pack),original=evaluate(SQL,scenario,query,extra);
  const candidate=candidateSQL?{sql:candidateSQL,provenance:{mode:'test-only'}}:null;
  const candidateReport=candidate?evaluate(SQL,scenario,candidate.sql,extra):null;
  return JSON.parse(JSON.stringify(await sealReview({version:'0.3.0',casePack:pack,query,candidate,
    execution:{fixtures:original.results.map(({id,label,rows})=>({id,label,rows})),original,...(candidate?{candidate:candidateReport}:{})}})));
}
async function changed(envelope,mutate){const copy=structuredClone(envelope.data);mutate(copy);return sealReview(copy);}
async function temporary(run){const root=await mkdtemp(join(tmpdir(),'rowglass-replay-'));try{return await run(root);}finally{await rm(root,{recursive:true,force:true});}}

test('replay independently reproduces a failing original and a passing candidate',async()=>{
  const envelope=await record(inventory,{candidateSQL:inventory.referenceSQL});
  const replay=await replayReview(SQL,envelope);
  assert.equal(replay.matches,true);assert.deepEqual(replay.differences,[]);
  assert.ok(replay.original.passed<replay.original.total);
  assert.equal(replay.candidate.passed,replay.candidate.total);
});

test('replay rejects an altered digest before executing evidence',async()=>{
  const envelope=await record();envelope.data.query=inventory.referenceSQL;
  await assert.rejects(replayReview(SQL,envelope),/digest does not match/);
});

test('a freshly recomputed digest cannot hide false pass evidence',async()=>{
  const envelope=await changed(await record(),data=>{
    const failed=data.execution.original.results.find(r=>!r.pass);failed.pass=true;
    data.execution.original.passed++;
  });
  const replay=await replayReview(SQL,envelope);
  assert.equal(replay.matches,false);assert.ok(replay.differences.some(d=>d.includes('outcome differs')));
});

test('contradictory summary aliases cannot pass replay or misstate a Markdown summary',async()=>{
  const valid=await record(inventory,{candidateSQL:inventory.referenceSQL});
  const original=valid.data.execution.original,candidate=valid.data.execution.candidate;
  for(const alias of ['report','baseline','candidateReport']){
    const tampered=await changed(valid,data=>{
      data.scenario={title:inventory.title,contract:inventory.contract};
      data[alias]=structuredClone(alias==='candidateReport'?original:candidate);
    });
    assert.equal((await replayReview(SQL,tampered)).matches,false,alias);
    const markdown=reviewMarkdown(tampered.data);
    assert.match(markdown,/2\/4 checks agree/);
    assert.match(markdown,/4\/4 finite checks agree/);
  }
});

test('a freshly recomputed digest cannot hide changed result rows or duplicate counts',async()=>{
  const envelope=await changed(await record(),data=>{
    const result=data.execution.original.results.find(r=>r.actual[0].values.length);
    result.actual[0].values.push([...result.actual[0].values[0]]);
  });
  assert.equal((await replayReview(SQL,envelope)).matches,false);
});

test('recorded fixture row changes disagree even when their types remain valid',async()=>{
  const envelope=await changed(await record(),data=>{data.execution.original.results[0].rows.products[0][1]+=1;});
  const replay=await replayReview(SQL,envelope);
  assert.equal(replay.matches,false);assert.ok(replay.differences.some(d=>d.includes('fixture identity differs')));
});

test('missing base fixtures and incomplete outcome evidence fail closed',async()=>{
  for(const mutate of [
    data=>data.execution.fixtures.pop(),
    data=>{data.execution.fixtures.pop();data.execution.original.results.pop();data.execution.original.total--;},
    data=>data.execution.original.results.pop(),
    data=>delete data.execution.original.results[0].expected
  ])await assert.rejects(replayReview(SQL,await changed(await record(),mutate)),/missing|incomplete/);
});

test('legacy digest-only reviews require a newly exported execution snapshot',async()=>{
  await assert.rejects(replayReview(SQL,await sealReview({version:'0.2.0',casePack:inventory,query:inventory.baselineSQL})),/not replayable.*Export a new review/);
  await assert.rejects(replayReview(SQL,await sealReview({version:'0.3.0',casePack:inventory,query:inventory.baselineSQL})),/not replayable.*Export a new review/);
});

test('full custom pack and generated extra fixture are replayed exactly once',async()=>{
  const extra=[{id:'generated-1',label:'Synthetic generated inventory',rows:{products:[[91,7]],reservations:[[31,91,2]]}}];
  const envelope=await record(inventory,{extra,candidateSQL:inventory.referenceSQL});
  const replay=await replayReview(SQL,envelope);
  assert.equal(replay.matches,true);assert.equal(replay.original.total,inventory.fixtures.length+1);
  assert.deepEqual(replay.original.results.map(r=>r.id),envelope.data.execution.fixtures.map(f=>f.id));
});

test('built-in seeded and generated extras travel in the replay snapshot',async()=>{
  const scenario=scenarios[0],pack=toCasePack(scenario);
  const extra=[...stressFixtures(scenario,2026),{id:'generated-1',label:'One extra customer',rows:{customers:[[91,'Ari']],orders:[]}}];
  const replay=await replayReview(SQL,await record(pack,{extra,candidateSQL:scenario.reference}));
  assert.equal(replay.matches,true);assert.equal(replay.original.total,34);assert.equal(replay.candidate.passed,34);
});

test('execution fixtures enforce unique identity, count, types, primary and foreign keys',async()=>{
  const mutations=[
    data=>data.execution.fixtures.push(structuredClone(data.execution.fixtures[0])),
    data=>data.execution.fixtures[0].rows.products[0][1]='wrong-type',
    data=>data.execution.fixtures[0].rows.products.push([...data.execution.fixtures[0].rows.products[0]]),
    data=>data.execution.fixtures[0].rows.reservations[0][1]=999,
    data=>data.execution.fixtures=Array.from({length:91},(_,i)=>({...data.execution.fixtures[0],id:'f'+i}))
  ];
  for(const mutate of mutations)await assert.rejects(replayReview(SQL,await changed(await record(),mutate)));
});

test('candidate SQL and candidate snapshot must appear together',async()=>{
  await assert.rejects(replayReview(SQL,await changed(await record(inventory,{candidateSQL:inventory.referenceSQL}),data=>delete data.execution.candidate)),/Candidate execution evidence is incomplete/);
  await assert.rejects(replayReview(SQL,await changed(await record(),data=>{data.execution.candidate=data.execution.original;})),/Candidate execution evidence is incomplete/);
});

test('replay compares query errors and invalid references while ignoring reduction and timing metadata',async()=>{
  const errorEnvelope=await record(inventory,{query:'SELECT missing_column FROM products'});
  assert.equal((await replayReview(SQL,errorEnvelope)).matches,true);
  assert.equal((await replayReview(SQL,await changed(errorEnvelope,data=>{data.execution.original.results[0].error='Invented error';}))).matches,false);
  const invalid={...structuredClone(inventory),referenceSQL:'SELECT missing_column FROM products'};
  assert.equal((await replayReview(SQL,await record(invalid))).matches,true);
  const ignored=await changed(await record(),data=>{data.execution.original.witness={checks:99999};data.recordedAt='changed';data.modelCalls=[{latencyMs:90000}];});
  assert.equal((await replayReview(SQL,ignored)).matches,true);
});

test('worker replay is bounded and remains separate from provider transport',async()=>{
  const envelope=await record();const replay=await evaluateIsolated({operation:'replay',envelope});
  assert.equal(replay.matches,true);
  const looping=await changed(envelope,data=>{data.query='WITH RECURSIVE x(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM x) SELECT MAX(n) FROM x';});
  await assert.rejects(evaluateIsolated({operation:'replay',envelope:looping},300),/time limit/);
});

test('CLI exports replayable v0.3 reviews and distinguishes disagreeing and invalid evidence',async()=>temporary(async root=>{
  const input=join(root,'case.json'),prefix=join(root,'review'),path=prefix+'.json';
  await writeFile(input,JSON.stringify(inventory));
  const checked=cli(['check',input,'--out',prefix]);assert.equal(checked.status,1,checked.stderr);
  const envelope=JSON.parse(await readFile(path,'utf8'));assert.equal(envelope.data.version,'0.3.0');
  const before=await readFile(path,'utf8');
  const reproduced=cli(['replay',path]);assert.equal(reproduced.status,0,reproduced.stderr);assert.match(reproduced.stdout,/reproduced every/);
  assert.equal(await readFile(path,'utf8'),before);
  const falseEvidence=await changed(envelope,data=>{data.execution.original.passed=90;});
  await writeFile(join(root,'false.json'),JSON.stringify(falseEvidence));
  const mismatch=cli(['replay',join(root,'false.json')]);assert.equal(mismatch.status,1,mismatch.stderr);assert.match(mismatch.stdout,/outcomes disagree/);
  const missing=await changed(envelope,data=>delete data.execution);
  await writeFile(join(root,'missing.json'),JSON.stringify(missing));
  const invalid=cli(['replay',join(root,'missing.json')]);assert.equal(invalid.status,2,invalid.stderr);assert.match(invalid.stderr,/Export a new review/);
}));
