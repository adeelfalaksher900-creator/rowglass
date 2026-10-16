import test from 'node:test';import assert from 'node:assert/strict';import initSqlJs from 'sql.js';
import {scenarios} from '../src/scenarios.mjs';import {evaluate,readOnlySql,execute,equalResults,compare,rowCount} from '../src/engine.mjs';
const SQL=await initSqlJs();
for(const s of scenarios){
 test(`${s.id}: example passes, edge suite falsifies original`,()=>{const r=evaluate(SQL,s,s.broken);assert.equal(r.results[0].pass,true);assert.ok(r.passed<r.total);assert.ok(r.witness);assert.ok(r.witness.after<=r.witness.before);});
 test(`${s.id}: independent reference passes all cases`,()=>{const r=evaluate(SQL,s,s.reference);assert.equal(r.passed,r.total);});
 test(`${s.id}: catches all plausible wrong repairs`,()=>{for(const mutant of s.mutants){const r=evaluate(SQL,s,mutant);assert.ok(r.passed<r.total);}});
 test(`${s.id}: witness is valid and single-row irreducible`,()=>{const r=evaluate(SQL,s,s.broken);const f=r.witness;assert.equal(f.pass,false);for(const t of s.schema)for(let i=0;i<f.rows[t.name].length;i++){const next=structuredClone(f.rows);next[t.name].splice(i,1);const check=compare(SQL,s,{rows:next},s.broken);assert.ok(check.invalid||check.error||check.pass);}});
}
test('compares bags, retaining duplicate counts',()=>{assert.equal(equalResults([{columns:['x'],values:[[1],[1]]}],[{columns:['x'],values:[[1]]}]),false);assert.equal(equalResults([{columns:['x'],values:[[1],[2]]}],[{columns:['x'],values:[[2],[1]]}]),true);});
for(const q of ['DROP TABLE orders','SELECT 1; DELETE FROM orders','WITH x AS (SELECT 1) DELETE FROM orders','SELECT load_extension(\'x\')','PRAGMA user_version'])test(`rejects unsafe query ${q}`,()=>assert.throws(()=>readOnlySql(q)));
test('handles SQL strings and comments without false writes',()=>{assert.doesNotThrow(()=>readOnlySql("SELECT 'DELETE;UPDATE' -- DROP\n"));assert.throws(()=>readOnlySql('SELECT 1 /* unclosed'));assert.throws(()=>readOnlySql("SELECT 'unclosed"));});
test('constraint failures are invalid fixtures, never counterexamples',()=>{const s=scenarios[0];const r=compare(SQL,s,{rows:{customers:[],orders:[[1,999,'paid']]}},s.broken);assert.equal(r.invalid,true);});
test('closes and isolates each database',()=>{const s=scenarios[0];execute(SQL,s,s.starter.rows,s.reference);assert.deepEqual(execute(SQL,s,{customers:[],orders:[]},s.reference),[]);});
test('row collection stops at the execution result cap',()=>assert.throws(()=>execute(SQL,scenarios[0],scenarios[0].starter.rows,'WITH RECURSIVE x(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM x WHERE n<1001) SELECT n FROM x'),/1,000/));
test('numeric IDs must not be model-generated strings',()=>assert.throws(()=>execute(SQL,scenarios[0],{customers:[[1,'Ari']],orders:[[1,'1','paid']]},'SELECT 1'),/integers/));
