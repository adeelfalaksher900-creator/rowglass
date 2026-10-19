# Rowglass

Review SQL changes with executable counterexamples.

Rowglass helps analytics engineers and small software teams review a behavior-preserving SQL refactor or AI-written rewrite. Supply a trusted baseline, proposed query and synthetic fixtures. Rowglass reproduces differences, reduces a disagreement to inspectable rows, tests repair proposals and exports a regression case another reviewer can run. The browser workbench and repository CLI share the same SQLite evaluator.

The trusted baseline is an explicit assumption. If the business rule intentionally changes, supply reviewed new expectations; the old query does not establish the new intent. Rowglass does not infer business correctness from a model explanation.

Built for the **Coding and Agentic Engineering** track of the Nebius x NVIDIA Global AI Hackathon. [MIT licensed](LICENSE).

## Status

Version 0.4 source adds a redesigned syntax-colored review workbench and fail-closed public provider routes, alongside reduced regression-case handoff, independent offline review replay, faithful supported-integer handling, a frozen 24-change control corpus, one-shot versus execution-feedback evaluation controls and optional cited SQLite documentation search. Local checking needs no account or production database. See [PRD](PRD.md), [TRD](TRD.md) and [evaluation protocol](benchmark/README.md).

**Actual Nebius inference remains unverified.** GitHub sign-in succeeded, but billing/provisioning blocks model-key and credit access. The HTTP adapter and Tavily search have mocked-transport coverage. No Tavily key or actual runtime search has been verified. These tests and the explicitly labeled hand-authored reference repairs are not live service results or bonus eligibility evidence.

Public local review: [Open Rowglass](https://rowglass.adeelfalaksher900.chatgpt.site). No account or provider key is required for SQLite checks, reference review, imports, evaluation and exports. Public provider calls are disabled. This is not a complete hackathon submission; real NVIDIA-on-Nebius execution remains a release gate.

Core validation: **144 tests pass** plus the production build. Fresh browser observations and limits are recorded in [VALIDATION.md](docs/VALIDATION.md).

## Run locally

Use Node.js 24 or newer.

```sh
npm ci
npm run check
npm start
```

Open http://localhost:3000. All example data is synthetic.

### Five-minute browser workflow

1. Open the missing-customers example. The proposed change passes 3/9 curated checks but drops customers the trusted baseline retains.
2. Inspect expected/proposed rows and the reduced one-row counterexample.
3. Choose **Prepare regression case**. Rowglass validates and reruns the reduced case before offering its JSON download and copyable JSON. This artifact contains the failing proposal, trusted reference and reduced synthetic rows.
4. Load the explicitly **hand-authored reference repair**, inspect its diff and 9/9 results, then apply it. This demonstrates review mechanics, not model inference.
5. Run the 24 additional fixtures with seed 2026. The reference passes 33/33 finite checks.
6. Export JSON or Markdown evidence and, when present, the proposed SQL patch. Version 0.3 and later JSON reviews include the execution suite for independent CLI replay. Copyable review text is available when a browser download is unavailable.
7. Open **Your case**, load the inventory example, confirm synthetic data and validate it. Its proposed query fails 2/4 checks; its reference passes 4/4.

Query text is transient unless you choose **Save local draft**. Restore and forget controls manage one browser draft. A model request sends the selected synthetic schema, contract, proposed SQL and bounded failure evidence to Nebius. A documentation request sends only a fixed generic SQL topic to Tavily, without case SQL, identifiers or rows.

## Check a query in a repository

```sh
# Proposed query: 2/4 checks, exit code 1.
node cli/rowglass.mjs check examples/inventory.case.json --out /tmp/proposal

# Trusted correct query: 4/4 checks, exit code 0.
node cli/rowglass.mjs check examples/inventory.case.json \
  --query examples/inventory.good.sql --out /tmp/review

# Digest only. Does not rerun SQL or authenticate the record.
node cli/rowglass.mjs verify /tmp/review.json

# Independent offline execution of every recorded fixture and query.
node cli/rowglass.mjs replay /tmp/review.json

# A matching replay also reproduces an originally failing review, exit code 0.
node cli/rowglass.mjs replay /tmp/proposal.json

# Run a downloaded reduced reproduction. Original proposal should fail.
node cli/rowglass.mjs check downloaded.regression.case.json --out /tmp/regression
```

`check` writes JSON and Markdown reviews. Choose a fresh `--out` prefix for each run. Existing outputs, input-file collisions and existing output aliases are refused before evaluation; exclusive creation prevents overwriting files introduced after that check. Inputs must be regular files. Case files are limited to 200,000 characters (800,000 bytes), queries to 48,000 bytes and 12,000 characters, and JSON reviews to 16 MiB.

`check` exits 0 for finite agreement, 1 for mismatch and 2 for invalid input/setup. `replay` first checks the digest, validates the recorded case and full suite, then recomputes original and optional candidate outcomes without calling a provider. It exits 0 when outcomes reproduce, 1 for disagreement and 2 for invalid or incomplete evidence. Earlier reviews lacking the version 0.3 execution envelope must be exported again. Replay does not authenticate provider metadata or prove that an original model call occurred.

[The CI workflow](.github/workflows/check.yml) includes local checks, the inventory example, digest verification, offline replay and frozen-corpus validation. A passing suite is not universal correctness proof.

### Bring your own synthetic case

Start with [inventory.case.json](examples/inventory.case.json). A `rowglass.case.v1` pack declares a contract, structured tables/columns, proposed SQL, trusted reference and fixtures. The format's existing `baselineSQL` field contains the **proposal under test**; `referenceSQL` contains the **trusted behavioral baseline**. Raw DDL is rejected. Each table starts with an integer primary key; foreign keys reference an earlier table. Types are integer, real and text.

Limits: 6 tables, 16 columns per table, 30 fixtures and 100 input rows per fixture. The case author owns the reference's business correctness. Rowglass validates constraints and execution, not intent. A reduced export reproduces one observed disagreement; it does not replace the full regression suite. See [the case format and CLI](docs/CASE-PACKS.md).

## NVIDIA Nemotron on Nebius

For a trusted loopback Node server or CLI, configure `NEBIUS_API_KEY` outside source, explicitly set `ROWGLASS_PROVIDER_MODE=private` and `ROWGLASS_PUBLIC=false`, then start the app or run:

```sh
node cli/rowglass.mjs repair examples/inventory.case.json \
  --out /tmp/model-review
```

`repair` preserves the input SQL file and produces a candidate, unified patch and executed review. A task makes at most two repair calls: propose, execute, send bounded visible failures back, then execute the revision. Challenge mode retains the current SQL and tests a proposed synthetic fixture. Reference SQL and the full evaluation suite stay outside model context. Candidate approval is explicit.

The fixed endpoint is `https://api.tokenfactory.nebius.com/v1/chat/completions`. The default NVIDIA model ID is `nvidia/nvidia-nemotron-3-nano-30b-a3b`, taken from the official cookbook. Confirm actual catalog availability before a live run; `NEBIUS_MODEL` accepts a `nvidia/...` override. A configured key is distinct from an observed successful response. Provider response IDs and returned usage are metadata, not signed attestations. No live accuracy, latency or granted-credit claim is established.

Missing or unknown provider mode disables all keyed requests. The generated public Worker unconditionally overrides the mode to local-only, regardless of runtime keys or flags. To offer live inference publicly, a separately reviewed deployment with verified identity and durable limits is required. Credentials stay server-side. The private server has a shared in-memory 12-call hourly inference cap; this is not durable authorization or a quota ledger. `ROWGLASS_PUBLIC=true` disables live inference and documentation search even when keys exist. Retain this guard until authenticated access, durable allowances and concurrency controls are independently verified. The project provisions no GPU or Supabase database. Supabase would support persistent allowances or shared records if needed; it would not replace required Nebius runtime.

### Optional official-document search

Set `TAVILY_API_KEY` server-side together with the explicit private mode above to enable **Search official docs** on a private configured server. Four fixed topics cover outer joins, NULL/NOT IN, aggregate duplicates and integer division. The adapter makes a bounded basic Tavily search restricted to official SQLite domains and validates returned HTTPS links. Results are rendered as text citations. Unconfigured searches return an unavailable state without a provider call. Sources explain semantics; they never grade results or alter the trusted reference. Actual Tavily runtime and bonus eligibility remain unverified.

## What the evidence means

| Control | Offline evidence | Interpretation |
|---|---|---|
| Three built-in references, 9 curated + 24 seeded fixtures each | 99/99 agree, seed 2026 | Positive controls for three synthetic workflows |
| Nine deliberately wrong repairs | 9/9 rejected | Separate workbench negative controls |
| Custom inventory reference | 4/4 agree | Reusable case format and CLI execution |
| Frozen corpus | 24 changes, six schemas; 18 wrong mutations and six equivalent rewrites | Hand-authored controls, not collected model mistakes |
| Frozen reference validation | 24 fixture checks against hand-calculated expectations | Finite oracle checks |
| Frozen candidate validation | 96 fixture checks; wrong changes rejected and equivalent rewrites preserved | Evaluator controls, not repair accuracy |
| One-shot and execution-feedback harness | Implemented; injected-proposal tests only | Visible/held-out boundary and measurement protocol |
| Nebius/Tavily adapter coverage | Mocked transports | Protocol and failure handling only |
| Live service/model evaluation | Not run | No model-quality, usage or latency results |

Run `node scripts/evaluate.mjs` for [the three-case controls](docs/local-evaluation.json) and `npm run benchmark` for the frozen corpus report on stdout. The latter writes nothing by default and makes no provider calls. See [benchmark/README.md](benchmark/README.md) for the manifest digest, hand calculations and opt-in proposal harness. The two visible/two held-out fixtures per schema are public. Their split protects the within-run prompt boundary, not a secret independent benchmark or pretraining exclusion.

The repair harness compares one-shot proposals with at most two execution-feedback rounds under explicit call limits. Held-out scoring starts after repair stops. Generated challenge fixtures do not inflate the frozen denominator. False acceptance, mis-repair, errors and exhausted loops remain reported. Live runs have not occurred.

Result comparison preserves duplicate counts and exact column names, including empty outputs; row order is ignored. SQLite INTEGER outputs are read as BigInt before conversion. Only integers from -9,007,199,254,740,991 through 9,007,199,254,740,991 are supported; larger values are rejected rather than rounded. Finite REAL results use exact JavaScript-number comparison without a tolerance. This is not arbitrary 64-bit integer support.

A greedy reducer removes rows while preserving constraints and a value mismatch. Its result is single-row irreducible under that procedure, not globally smallest. SQL runs in a disposable browser worker or Node worker thread with an eight-second timeout. Outputs are limited to 1,000 rows, 32 columns, 10,000 characters per text cell and one million serialized row characters per query. Blob allocation/formatting functions, binary and non-finite outputs are rejected. These guards are not a complete WebAssembly memory sandbox or security certification.

## Review and release materials

- [Product requirements](PRD.md), [technical requirements](TRD.md) and [current research](docs/RESEARCH-2026-10-19.md)
- [Rule-by-rule status](docs/RULES-AUDIT.md) and [judging evidence](docs/JUDGING-EVIDENCE.md)
- [Validation and observed limitations](docs/VALIDATION.md)
- [Devpost draft](docs/DEVPOST-DRAFT.md), [AI disclosure](docs/AI-DISCLOSURE.md) and [prior review checkpoint](docs/REVIEW-CHECKPOINT.md)
- [Access blocker](docs/ACCESS-BLOCKER.md)

SQL testing, execution-guided repair and small distinguishing databases have substantial prior art. Rowglass's product hypothesis is low-setup browser investigation plus a portable repository handoff. It does not claim to invent these techniques.

Real NVIDIA-on-Nebius runtime, any live judge inference and its durable allowance gate, completion of the separately requested formal security audit, factual eligibility answers and final public English YouTube media remain release gates. Anonymous local judge review is published; its exact browser checks and limits are recorded in VALIDATION.md. Video, narration and the 15-image gallery follow the final tested product. No adoption, time-saving study, per-track participation counts or winning odds are invented.

## License

MIT. Bundled libraries and fonts retain their own licenses; see [third-party notices](THIRD-PARTY-NOTICES.md) and [license copies](licenses/). The app also serves bundled notices at `/licenses.txt`.


## Current platform access

GitHub login to Nebius AI Cloud succeeded on 19 October 2026. Its billing page requires a $25 card top-up; Pakistan was not available in the displayed residence list. No card or agreement was submitted. The official hackathon FAQ explicitly excludes OpenRouter as a substitute for a direct Nebius runtime, even though NVIDIA models exist there. See [the current access record](docs/ACCESS-BLOCKER.md) and [official FAQ](https://nebiusglobalaihackathon.devpost.com/details/faqs). No unapproved provider fallback is built into this submission.
