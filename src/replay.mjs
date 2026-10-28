import {z} from 'zod';
import {compileCasePack} from './case-pack.mjs';
import {canonical,compare,readOnlySql,validateRows} from './engine.mjs';
import {verifyReview} from './evidence.mjs';

const cell=z.union([z.string().max(10000),z.number().finite(),z.null()]);
const fixture=z.object({
  id:z.string().regex(/^[a-z][a-z0-9-]{0,49}$/),
  label:z.string().min(1).max(120),
  rows:z.record(z.string(),z.array(z.array(cell)).max(100))
}).strict();
const output=z.array(z.object({
  columns:z.array(z.string()).max(32),
  values:z.array(z.array(cell)).max(1000)
}).strict()).max(1);
const result=z.object({
  id:fixture.shape.id,label:fixture.shape.label,rows:fixture.shape.rows,
  pass:z.boolean(),invalid:z.boolean().optional(),error:z.string().min(1).max(12000).optional(),
  expected:output.optional(),actual:output.optional()
}).passthrough();
const report=z.object({
  passed:z.number().int().min(0).max(90),total:z.number().int().min(1).max(90),
  results:z.array(result).min(1).max(90)
}).passthrough();
const execution=z.object({
  fixtures:z.array(fixture).min(1).max(90),
  original:report,candidate:report.optional()
}).strict();

function fixtureIdentity(scenario,value){
  return JSON.stringify({id:value.id,label:value.label,rows:scenario.schema.map(t=>[t.name,value.rows[t.name]])});
}

function validateFixture(scenario,value){
  validateRows(scenario,value.rows);
  for(const table of scenario.schema){
    for(const [index,column] of table.columnDefs.entries()){
      if(!column.references)continue;
      const parentIds=new Set(value.rows[column.references.table].map(row=>row[0]));
      for(const row of value.rows[table.name]){
        if(row[index]!==null&&!parentIds.has(row[index])){
          throw new Error(`Fixture ${value.id} violates a foreign key.`);
        }
      }
    }
  }
}

function validateOutput(value){
  if(!value)return;
  const first=value[0];
  if(first){
    if(first.values.some(row=>row.length!==first.columns.length))throw new Error('Review output row width does not match its columns.');
    if(first.values.reduce((size,row)=>size+JSON.stringify(row).length,0)>1000000)throw new Error('Review output exceeds the execution size limit.');
  }
  canonical(value);
}

function validateSnapshot(snapshot,fixtures,scenario,label){
  if(snapshot.total!==fixtures.length||snapshot.results.length!==fixtures.length){
    throw new Error(`${label} has incomplete fixture evidence. Export a new review.`);
  }
  for(const [index,entry] of snapshot.results.entries()){
    if(entry.id!==fixtures[index].id)throw new Error(`${label} fixture identity or ordering is incomplete. Export a new review.`);
    validateFixture(scenario,entry);
    if(entry.invalid){
      if(entry.pass||!entry.error||entry.expected!==undefined||entry.actual!==undefined)throw new Error('Invalid-fixture evidence is malformed.');
    }else{
      if(!entry.expected?.length||!entry.actual||(!entry.error&&!entry.actual.length)||entry.error&&(entry.pass||entry.actual.length)){
        throw new Error('Review has incomplete query outcomes. Export a new review.');
      }
    }
    validateOutput(entry.expected);validateOutput(entry.actual);
  }
}

function recompute(SQL,scenario,fixtures,sql){
  const results=fixtures.map(f=>compare(SQL,scenario,f,sql));
  return {passed:results.filter(r=>r.pass).length,total:results.length,results,witness:null};
}

function outcome(value,comparison){
  return {
    pass:value.pass,invalid:!!value.invalid,error:value.error??null,
    expected:value.expected===undefined?null:canonical(value.expected,comparison),
    actual:value.actual===undefined?null:canonical(value.actual,comparison)
  };
}

function compareSnapshot(scenario,fixtures,recorded,replayed,label){
  const differences=[];
  if(recorded.passed!==replayed.passed)differences.push(`${label}: recorded passing count differs.`);
  if(recorded.total!==replayed.total)differences.push(`${label}: recorded fixture count differs.`);
  for(const [index,current] of replayed.results.entries()){
    const saved=recorded.results[index];
    if(fixtureIdentity(scenario,saved)!==fixtureIdentity(scenario,fixtures[index]))differences.push(`${label}/${current.id}: recorded fixture identity differs.`);
    if(JSON.stringify(outcome(saved,scenario.comparison))!==JSON.stringify(outcome(current,scenario.comparison)))differences.push(`${label}/${current.id}: recorded outcome differs.`);
  }
  return differences;
}

export async function replayReview(SQL,envelope){
  if(!await verifyReview(envelope))throw new Error('Review digest does not match. Replay was not run.');
  const data=envelope.data;
  if(data?.version!=='0.3.0'||!data.execution){
    throw new Error('This review is not replayable. Export a new review with full execution evidence.');
  }
  const scenario=compileCasePack(data.casePack),sql=readOnlySql(data.query);
  const candidate=data.candidate==null?null:readOnlySql(data.candidate.sql);
  const snapshot=execution.parse(data.execution),fixtures=snapshot.fixtures;
  if(!!candidate!==!!snapshot.candidate)throw new Error('Candidate execution evidence is incomplete. Export a new review.');
  const byId=new Map();
  for(const value of fixtures){
    if(byId.has(value.id))throw new Error('Replay fixture IDs must be unique.');
    validateFixture(scenario,value);byId.set(value.id,value);
  }
  for(const base of scenario.pack.fixtures){
    const included=byId.get(base.id);
    if(!included||fixtureIdentity(scenario,included)!==fixtureIdentity(scenario,base)){
      throw new Error('The execution suite is missing or changes a case-pack fixture. Export a new review.');
    }
  }
  validateSnapshot(snapshot.original,fixtures,scenario,'Original review');
  if(snapshot.candidate)validateSnapshot(snapshot.candidate,fixtures,scenario,'Candidate review');
  const original=recompute(SQL,scenario,fixtures,sql);
  const candidateReport=candidate?recompute(SQL,scenario,fixtures,candidate):undefined;
  const differences=compareSnapshot(scenario,fixtures,snapshot.original,original,'original');
  if(candidateReport)differences.push(...compareSnapshot(scenario,fixtures,snapshot.candidate,candidateReport,'candidate'));
  for(const [name,expected] of [['report',original],['baseline',original],['candidateReport',candidateReport]]){
    if(data[name]==null)continue;
    if(!expected)throw new Error(`${name} has no corresponding execution evidence.`);
    const alias=report.parse(data[name]);
    validateSnapshot(alias,fixtures,scenario,name);
    differences.push(...compareSnapshot(scenario,fixtures,alias,expected,name));
  }
  return {matches:differences.length===0,original,...(candidateReport?{candidate:candidateReport}:{}),differences};
}
