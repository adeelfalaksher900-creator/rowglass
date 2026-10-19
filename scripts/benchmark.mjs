import initSqlJs from 'sql.js';
import {writeFile} from 'node:fs/promises';
import {validateBenchmark} from '../benchmark/corpus.mjs';

const args = process.argv.slice(2);
if (args.length !== 0 && !(args.length === 2 && args[0] === '--out' && args[1])) {
  console.error('Usage: node scripts/benchmark.mjs [--out new-report.json]');
  process.exitCode = 2;
} else {
  try {
    const SQL = await initSqlJs();
    const report = validateBenchmark(SQL);
    const json = `${JSON.stringify(report, null, 2)}\n`;
    if (args.length) await writeFile(args[1], json, {flag: 'wx'});
    process.stdout.write(json);
  } catch (error) {
    console.error(`Benchmark validation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
