import test from 'node:test';
import assert from 'node:assert/strict';
import initSqlJs from 'sql.js';
import {canonical,compare,equalResults,execute} from '../src/engine.mjs';
import {scenarios} from '../src/scenarios.mjs';

const SQL=await initSqlJs();
const scenario=scenarios[0];
const fixture=scenario.starter;
const run=sql=>execute(SQL,scenario,fixture.rows,sql);
const result=value=>[{columns:['x'],values:[[value]]}];

test('SQLite INTEGER safe boundaries retain both signs and JSON-compatible numbers',()=>{
  const output=run('SELECT 9007199254740991 AS positive, -9007199254740991 AS negative');
  assert.deepEqual(output,[{columns:['positive','negative'],values:[[Number.MAX_SAFE_INTEGER,Number.MIN_SAFE_INTEGER]]}]);
  assert.doesNotThrow(()=>JSON.stringify(output));
  assert.equal(equalResults(run('SELECT 9007199254740990 AS x'),run('SELECT 9007199254740991 AS x')),false);
  assert.equal(equalResults(run('SELECT -9007199254740990 AS x'),run('SELECT -9007199254740991 AS x')),false);
});

test('SQLite INTEGER values outside the safe range are rejected before rounding',()=>{
  for(const literal of ['9007199254740992','9007199254740993','-9007199254740992','-9007199254740993','9223372036854775807','-9223372036854775808']){
    assert.throws(()=>run(`SELECT ${literal} AS x`),/SQLite INTEGER output exceeds the supported safe integer range/);
  }
});

test('arithmetic on safe INTEGER operands cannot produce silently rounded evidence',()=>{
  for(const expression of ['4503599627370496 + 4503599627370497','-4503599627370496 - 4503599627370497']){
    assert.throws(()=>run(`SELECT ${expression} AS x`),/SQLite INTEGER output exceeds the supported safe integer range/);
  }
});

test('unsupported integer proposals fail while unsupported references are invalid',()=>{
  const actual=compare(SQL,{...scenario,reference:'SELECT NULL AS x'},fixture,'SELECT 9007199254740993 AS x');
  assert.equal(actual.pass,false);
  assert.equal(actual.invalid,undefined);
  assert.match(actual.error,/safe integer range/);
  const expected=compare(SQL,{...scenario,reference:'SELECT -9007199254740993 AS x'},fixture,'SELECT NULL AS x');
  assert.equal(expected.pass,false);
  assert.equal(expected.invalid,true);
  assert.match(expected.error,/safe integer range/);
});

test('supported REAL output retains exact Number comparison without tolerance',()=>{
  assert.deepEqual(run('SELECT 1.25 AS a, -0.125 AS b, 1e-100 AS c'),[{columns:['a','b','c'],values:[[1.25,-0.125,1e-100]]}]);
  assert.equal(equalResults(run('SELECT 1.0 AS x'),run('SELECT 1 AS x')),true);
  assert.equal(equalResults(run('SELECT 0.1 + 0.2 AS x'),run('SELECT 0.3 AS x')),false);
  for(const literal of ['9007199254740992.0','-9007199254740992.0']){
    assert.throws(()=>run(`SELECT ${literal} AS x`),/Numeric output exceeds the supported safe integer range/);
  }
});

test('canonical comparison rejects unsafe direct JS integers and non-finite numbers',()=>{
  for(const value of [9007199254740992,-9007199254740992,Infinity,-Infinity,NaN]){
    assert.throws(()=>canonical(result(value)),/safe integer range|Non-finite/);
    assert.throws(()=>equalResults(result(value),result(null)),/safe integer range|Non-finite/);
  }
  assert.equal(equalResults(result(9007199254740991n),result(Number.MAX_SAFE_INTEGER)),true);
  assert.throws(()=>canonical(result(9007199254740993n)),/SQLite INTEGER output exceeds/);
});

test('NULL, text NULL and numeric text remain distinct comparison values',()=>{
  assert.equal(equalResults(run('SELECT NULL AS x'),run("SELECT 'NULL' AS x")),false);
  assert.equal(equalResults(run('SELECT 1 AS x'),run("SELECT '1' AS x")),false);
  assert.equal(equalResults(run('SELECT NULL AS x'),run('SELECT 0 AS x')),false);
});

test('non-finite REAL execution remains rejected for both signs',()=>{
  assert.throws(()=>run('SELECT 1e999 AS x'),/Non-finite/);
  assert.throws(()=>run('SELECT -1e999 AS x'),/Non-finite/);
});
