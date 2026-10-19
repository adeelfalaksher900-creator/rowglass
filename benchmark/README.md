# Frozen SQL change controls

Version `2026-10-19.1` contains 24 candidate changes across six independently understandable typed schemas. Every schema has three deliberately wrong mutations and one equivalent rewrite, two visible fixtures and two held-out fixtures. The corpus is public synthetic data authored with AI coding assistance. It is not a collection of live model mistakes.

Each fixture records a hand-calculated expected output and its calculation. Offline validation first compares the trusted SQL against those independent expectations, enforces schema constraints through SQLite, then checks every candidate against the same expectations. Six valid rewrites must pass all fixtures. Eighteen wrong mutations must disagree with at least one fixture. These finite controls do not establish formal equivalence or general repair accuracy.

| Schema | Main behavior |
|---|---|
| retained-customers | Outer-join filter placement, zero counts, all statuses |
| nullable-exclusions | Anti-joins and NULL poisoning |
| order-totals | Join fanout, equal amounts and quantity arithmetic |
| latest-readings | Inclusive boundaries, newest day and deterministic ties |
| fractional-progress | REAL division and zero totals |
| projection-bags | Duplicate counts, inactive rows and output column identity |

Run `node scripts/benchmark.mjs` for an offline JSON control report on stdout. Nothing is written by default. `node scripts/benchmark.mjs --out new-controls.json` writes only the explicit path and refuses to overwrite it. No command in this module contacts a provider or starts live evaluation.

The canonical manifest SHA-256 is `9f6a815c18d181479dae1dd40960224741d8c65c2fcc45c544c8bae578f0d5ca`. The hash covers the expanded manifest's schemas, queries, fixture split, expected results, calculations and provenance. JSON object keys are sorted; array order is significant. Updating corpus contents requires a deliberate version and digest update. A digest identifies data, not an independent security attestation.

`corpus.mjs` is browser-safe. It exports `benchmarkManifest`, `manifestDigest`, `compileBenchmark` and `validateBenchmark(SQL)`. The SQLite module is supplied by the caller. Validation reports measured control counts and explicitly records live evaluation as not run.

`repair-harness.mjs` exports `repairVisibleCase` and `runRepairBenchmark`. A proposal function must be explicitly injected. Choose `mode: 'one-shot'` for one proposal using the initial visible failures or `mode: 'execution-feedback'` (the default) for at most two proposals, with the first proposal's visible execution failures available to the second. Both modes use the same frozen split and stop early after a visible pass. Context excludes reference SQL and all fixture rows. Failure feedback includes only visible or newly generated fixtures. Original and final held-out scoring begins after repair stops. Generated challenge fixtures do not enlarge the frozen denominator. A visible-only pass that fails held-out tests is counted as a false acceptance; changing a correct rewrite into a failure is counted as a mis-repair. Proposal budgets cap the entire run at no more than 48 calls, with one or two calls per change according to mode. Errors and exhausted loops are reported separately, not silently removed from the report.

Injected proposal tests are mocks. Their results establish protocol behavior, not NVIDIA/Nebius usage, provider latency or model repair quality. Live evidence remains unestablished until a separately authorized real transport run. Public held-out fixtures protect the within-run prompt boundary only. They do not establish exclusion from pretraining data or independent external evaluation.
