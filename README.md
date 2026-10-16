# Rowglass

SQL repairs with executable counterexamples.

Rowglass helps developers review a query that runs successfully but silently drops rows or inflates totals. It compares the query with an independent reference on small synthetic databases, reduces a disagreement to an inspectable example, and tests a proposed SQL patch before applying it. The reusable browser workbench and repository CLI share the same SQLite evaluator.

Built for the **Coding and Agentic Engineering** track of the Nebius x NVIDIA Global AI Hackathon. [MIT licensed](LICENSE).

## Status

Version 0.2 implements custom case packs, isolated SQL execution, seeded stress fixtures, a bounded repair loop, SQL diffs, opt-in local drafts and downloadable review artifacts. Local checks work without an account. The hosted preview is owner-private.

**Actual Nebius inference remains unverified.** GitHub sign-in succeeded, but the Nebius account requires billing/provisioning setup before a model key and credits are available. The implemented HTTP adapter has mocked-transport coverage; those tests and the separately labeled hand-authored reference repairs are not live model results. This is a review build, not a complete hackathon submission.

## Run locally

Use Node.js 24 or newer.

```sh
npm ci
npm run check
npm start
```

Open http://localhost:3000. No production database is connected. All example data is synthetic.

### Five-minute browser workflow

1. Open the missing-customers case: the baseline passes 3/9 checks.
2. Inspect the failing output and the reduced one-row database.
3. Load the explicitly **hand-authored reference repair**, inspect its diff and 9/9 results, then apply it.
4. Run 24 additional fixtures with seed 2026. The reference passes 33/33 finite checks.
5. Export a sealed JSON review, Markdown review or SQL patch. Copyable review text is available if a browser download is unavailable. The digest detects changed content; it does not authenticate a model response.
6. Open **Your case**, load the inventory example, confirm it contains synthetic data, and validate it. Its baseline fails 2/4 checks; its reference passes 4/4.

Query text is transient unless you explicitly choose **Save local draft**. Restore and forget controls manage that single browser draft. Model calls require a server-side key and send the selected synthetic schema, contract, SQL and bounded failure evidence to Nebius.

## Check a query in a repository

```sh
# Baseline: 2/4 checks, exit code 1.
node cli/rowglass.mjs check examples/inventory.case.json --out /tmp/baseline

# Independent correct query: 4/4 checks, exit code 0.
node cli/rowglass.mjs check examples/inventory.case.json \
  --query examples/inventory.good.sql --out /tmp/review

node cli/rowglass.mjs verify /tmp/review.json
```

`check` writes JSON and Markdown reviews. Exit codes: 0 when all finite checks agree; 1 for a mismatch; 2 for invalid input or setup. [The CI workflow](.github/workflows/check.yml) runs local checks and the custom inventory example. A passing suite is not a universal correctness proof.

### Bring your own synthetic case

Start with [inventory.case.json](examples/inventory.case.json). A `rowglass.case.v1` pack declares a contract, structured table/column definitions, baseline SQL, independent reference SQL and fixtures. Raw DDL is rejected. Each table starts with an integer primary key; foreign keys reference an earlier table. Supported types are integer, real and text.

Limits: 6 tables, 16 columns per table, 30 fixtures and 100 input rows per fixture. The caller owns the business correctness of the supplied reference. Rowglass validates schema constraints and execution; it cannot establish that the reference expresses the intended business rule. See [the case format and CLI](docs/CASE-PACKS.md).

## NVIDIA Nemotron on Nebius

Configure `NEBIUS_API_KEY` outside source as a server environment variable, then start the app or run:

```sh
node cli/rowglass.mjs repair examples/inventory.case.json \
  --out /tmp/model-review
```

`repair` never overwrites the input SQL file. It produces a candidate, unified patch and executed review. One task makes at most two repair calls: propose, execute, send bounded failures back, then execute the revision. Challenge mode keeps the original SQL and tests a proposed synthetic fixture. The reference SQL and full evaluation suite are excluded from model context.

The adapter calls `https://api.tokenfactory.nebius.com/v1/chat/completions`. Its default NVIDIA model ID is `nvidia/nvidia-nemotron-3-nano-30b-a3b`, taken from the official cookbook. Before a live run, confirm availability in your Token Factory catalog; `NEBIUS_MODEL` accepts a `nvidia/...` override. No currently available model, granted credits, latency or model accuracy is claimed without a successful call.

Credentials stay server-side. The private server has a shared, in-memory 12-call hourly cap. This is not a durable quota or authentication layer. `ROWGLASS_PUBLIC=true` disables live inference even when a key is present. Keep this guard until a public service has a durable quota gate; local testing remains available. The project provisions no GPU and adds no Supabase database because it needs no persistent application records. Supabase would not replace the required Nebius runtime.

## What the evidence means

| Control | Observed local result | Interpretation |
|---|---|---|
| Three built-in references, 9 curated + 24 seeded fixtures each | 99/99 agree, seed 2026 | Positive controls for these synthetic tasks |
| Nine deliberately wrong repairs | 9/9 rejected | Negative controls for the evaluator |
| Custom inventory reference | 4/4 agree | Reusable case format and CLI execution |
| Adapter tests | Mocked provider transport | Protocol, validation and error handling only |
| Live NVIDIA/Nebius results | Pending | No runtime/model benchmark claim |

Run `node scripts/evaluate.mjs` to regenerate [the local control report](docs/local-evaluation.json). Result comparison preserves duplicate counts and exact column names, including empty outputs; row order is ignored. A greedy reducer removes rows while preserving a valid value mismatch. The result is single-row irreducible under that procedure, not globally smallest.

SQL runs in a disposable browser worker or Node worker thread with an eight-second timeout. Output is capped at 1,000 rows, 32 columns and one million serialized characters per execution. Blob allocation and formatting functions are disabled. These resource guards are not a formal memory sandbox or security certification.

## Review and release materials

- [Research and track decision](docs/RESEARCH.md)
- [Rule-by-rule status](docs/RULES-AUDIT.md) and [judging evidence](docs/JUDGING-EVIDENCE.md)
- [Validation and observed limitations](docs/VALIDATION.md)
- [Devpost draft](docs/DEVPOST-DRAFT.md) and [AI disclosure](docs/AI-DISCLOSURE.md)
- [Access blocker](docs/ACCESS-BLOCKER.md)

The public demo, real Nebius execution evidence, final eligibility answers and public English YouTube video remain submission gates. Video, voice and gallery production are deferred until project review. No track participation counts, intended-user study, production adoption or winning odds are invented.

## License

MIT. Bundled libraries and fonts retain their own licenses; see [third-party notices](THIRD-PARTY-NOTICES.md) and [license copies](licenses/). The app also serves bundled notices at `/licenses.txt`.
