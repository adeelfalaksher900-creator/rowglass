import initSqlJs from 'sql.js';
import {scenarios} from '../src/scenarios.mjs';
import {evaluate} from '../src/engine.mjs';
import {stressFixtures} from '../src/stress.mjs';
import {writeFile} from 'node:fs/promises';
const SQL=await initSqlJs(),seed=2026;
const controls=scenarios.map(s=>{
  const generated=stressFixtures(s,seed),reference=evaluate(SQL,s,s.reference,generated),original=evaluate(SQL,s,s.broken,generated);
  const mutants=s.mutants.map(query=>{const r=evaluate(SQL,s,query,generated);return {query,passed:r.passed,total:r.total,rejected:r.passed<r.total};});
  return {id:s.id,curatedFixtures:9,generatedFixtures:generated.length,reference:{passed:reference.passed,total:reference.total},original:{passed:original.passed,total:original.total,witness:original.witness?.rows},mutants};
});
const metadataDB=new SQL.Database(),sqliteVersion=metadataDB.exec('SELECT sqlite_version()')[0].values[0][0];metadataDB.close();
const report={format:'rowglass.synthetic-controls.v2',recordedAt:new Date().toISOString(),seed,kind:'Local synthetic SQLite controls, not live Nemotron evaluation',sqliteVersion,totals:{referencePassed:controls.reduce((n,c)=>n+c.reference.passed,0),referenceChecks:controls.reduce((n,c)=>n+c.reference.total,0),wrongRepairsRejected:controls.flatMap(c=>c.mutants).filter(m=>m.rejected).length},controls};
await writeFile('docs/local-evaluation.json',JSON.stringify(report,null,2));console.log(JSON.stringify({totals:report.totals,cases:controls.map(c=>({id:c.id,reference:c.reference,original:{passed:c.original.passed,total:c.original.total}}))},null,2));
if(controls.some(c=>c.reference.passed!==c.reference.total||c.mutants.some(m=>!m.rejected)))process.exitCode=1;
