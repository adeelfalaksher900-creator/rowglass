import {compileCasePack, toCasePack} from './case-pack.mjs';
import {equalResults} from './engine.mjs';

function isResultSnapshot(result) {
  if (!Array.isArray(result) || result.length !== 1) return false;
  const table = result[0];
  if (!table || !Array.isArray(table.columns) || !Array.isArray(table.values)) return false;
  if (table.columns.length < 1 || table.columns.length > 32 || table.values.length > 1000) return false;
  if (table.columns.some(column => typeof column !== 'string')) return false;
  return table.values.every(row => Array.isArray(row)
    && row.length === table.columns.length
    && row.every(value => value === null || typeof value === 'string'
      || (typeof value === 'number' && Number.isFinite(value))));
}

function requireDivergingWitness(witness,comparison) {
  if (!witness || witness.pass !== false || witness.invalid
    || witness.error !== undefined && witness.error !== null) {
    throw new Error('Export requires a valid, non-error mismatch witness.');
  }
  if (!isResultSnapshot(witness.expected) || !isResultSnapshot(witness.actual)
    || equalResults(witness.expected, witness.actual,comparison)) {
    throw new Error('Export requires divergent expected and proposed result snapshots.');
  }
  if (!witness.rows || typeof witness.rows !== 'object' || Array.isArray(witness.rows)) {
    throw new Error('Export requires the reduced witness rows.');
  }
}

function requireForeignKeys(pack) {
  const rows = pack.fixtures[0].rows;
  for (const table of pack.tables) {
    for (const [index, column] of table.columns.entries()) {
      if (!column.references) continue;
      const parentKeys = new Set(rows[column.references.table].map(row => row[0]));
      for (const row of rows[table.name]) {
        if (row[index] !== null && !parentKeys.has(row[index])) {
          throw new Error('The reduced witness violates a foreign-key constraint.');
        }
      }
    }
  }
}

// Compilation checks the artifact structure. Its result snapshot comes from the
// caller's current evaluator; executing the exported pack independently replays it.
export function createRegressionCase(scenario, query, witness) {
  const source = toCasePack(scenario);
  requireDivergingWitness(witness,source.comparison??'unordered');
  const pack = {
    format: 'rowglass.case.v1',
    id: source.id,
    title: source.title,
    contract: source.contract,
    ...(source.comparison?{comparison:source.comparison}:{}),
    tables: structuredClone(source.tables),
    baselineSQL: query,
    referenceSQL: source.referenceSQL,
    fixtures: [{
      id: 'regression',
      label: 'Reduced regression witness',
      rows: structuredClone(witness.rows)
    }]
  };
  const compiled = compileCasePack(pack);
  requireForeignKeys(compiled.pack);
  return compiled.pack;
}
