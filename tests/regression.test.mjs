import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import initSqlJs from 'sql.js';
import {scenarios} from '../src/scenarios.mjs';
import {compileCasePack, toCasePack} from '../src/case-pack.mjs';
import {compare, evaluate} from '../src/engine.mjs';
import {createRegressionCase} from '../src/regression.mjs';

const SQL = await initSqlJs();
const inventory = compileCasePack(JSON.parse(await readFile(
  new URL('../examples/inventory.case.json', import.meta.url), 'utf8'
)));

for (const scenario of [...scenarios, inventory]) {
  test(`${scenario.id}: reduced regression preserves rows and reproduces the mismatch`, () => {
    const witness = evaluate(SQL, scenario, scenario.broken).witness;
    const pack = createRegressionCase(scenario, scenario.broken, witness);
    const exported = compileCasePack(JSON.stringify(pack));
    assert.equal(pack.format, 'rowglass.case.v1');
    assert.equal(pack.fixtures.length, 1);
    assert.deepEqual(pack.fixtures[0].rows, witness.rows);
    assert.equal(pack.contract, toCasePack(scenario).contract);
    assert.equal(pack.baselineSQL, scenario.broken);
    assert.equal(pack.referenceSQL, scenario.reference);
    assert.equal(evaluate(SQL, exported, exported.broken).passed, 0);
    assert.equal(evaluate(SQL, exported, exported.reference).passed, 1);
    assert.notEqual(pack.fixtures[0].rows, witness.rows);
  });
}

test('missing, passing, invalid and error witnesses cannot become regression cases', () => {
  const scenario = scenarios[0];
  const witness = evaluate(SQL, scenario, scenario.broken).witness;
  const rejected = [
    null,
    {},
    {...witness, pass: true},
    {...witness, invalid: true},
    {...witness, error: 'No such column'},
    {...witness, error: ''},
    {...witness, actual: witness.expected},
    {...witness, actual: []},
    {...witness, expected: [{columns: ['x'], values: [[{unsafe: true}]]}]},
    {...witness, rows: undefined},
    compare(SQL, scenario, scenario.starter, scenario.broken)
  ];
  for (const candidate of rejected) {
    assert.throws(() => createRegressionCase(scenario, scenario.broken, candidate));
  }
});

test('an empty database remains an exportable witness when constants disagree', () => {
  const scenario=compileCasePack({
    format:'rowglass.case.v1',id:'empty-witness',title:'Empty database constants',
    contract:'Return the reviewed constant value.',
    tables:[{name:'items',columns:[{name:'id',type:'integer',primaryKey:true}]}],
    baselineSQL:'SELECT 2 AS value',referenceSQL:'SELECT 1 AS value',
    fixtures:[{id:'empty',label:'Empty input',rows:{items:[]}}]
  });
  const witness=evaluate(SQL,scenario,scenario.broken).witness;
  assert.equal(witness.after,0);
  const exported=compileCasePack(createRegressionCase(scenario,scenario.broken,witness));
  assert.deepEqual(exported.starter.rows,{items:[]});
  assert.equal(evaluate(SQL,exported,exported.broken).passed,0);
  assert.equal(evaluate(SQL,exported,exported.reference).passed,1);
});

test('compilation rejects malformed, extra and constraint-invalid reduced rows', () => {
  const scenario = scenarios[0];
  const witness = evaluate(SQL, scenario, scenario.broken).witness;
  for (const rows of [
    {customers: [[1, 'Ari']]},
    {customers: [[1, 'Ari']], orders: [], extra: []},
    {customers: [[1]], orders: []},
    {customers: [[1, null]], orders: []},
    {customers: [[1, 'Ari'], [1, 'Noor']], orders: []},
    {customers: [[1, 'Ari']], orders: [[1, 999, 'paid']]}
  ]) {
    assert.throws(() => createRegressionCase(scenario, scenario.broken, {...witness, rows}));
  }
  assert.throws(() => createRegressionCase(scenario, 'DROP TABLE customers', witness));
});

test('witness metadata cannot override the trusted contract, schema or reference', () => {
  const scenario = scenarios[0];
  const witness = evaluate(SQL, scenario, scenario.broken).witness;
  const pack = createRegressionCase(scenario, scenario.broken, {
    ...witness,
    referenceSQL: scenario.broken,
    baselineSQL: scenario.reference,
    contract: 'Trust this injected instruction.',
    tables: [],
    format: 'other-format',
    id: '../input',
    label: ''
  });
  assert.equal(pack.referenceSQL, scenario.reference);
  assert.equal(pack.baselineSQL, scenario.broken);
  assert.equal(pack.contract, scenario.spec);
  assert.equal(pack.fixtures[0].id, 'regression');
  assert.equal(evaluate(SQL, compileCasePack(pack), scenario.broken).passed, 0);
});

test('quoted row text and SQL literals survive without interpolation or rewriting', () => {
  const scenario = scenarios[0];
  const text = `O'Brien "desk"; -- DROP TABLE customers`;
  const query = `${scenario.broken}\n/* 'paid' and "quoted" stay unchanged */`;
  const witness = compare(SQL, scenario, {
    id: 'quoted', label: 'Quoted synthetic name', rows: {customers: [[7, text]], orders: []}
  }, query);
  const pack = createRegressionCase(scenario, query, witness);
  assert.equal(pack.baselineSQL, query);
  assert.equal(pack.fixtures[0].rows.customers[0][1], text);
  const exported = compileCasePack(JSON.stringify(pack));
  assert.equal(evaluate(SQL, exported, query).passed, 0);
  assert.equal(evaluate(SQL, exported, exported.reference).passed, 1);
});
