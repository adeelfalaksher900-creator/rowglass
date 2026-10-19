# Judging evidence, not predicted scores

The four criteria are equally weighted after a viability and track-fit check. This maps version 0.4 behavior to inspectable evidence and records gaps. It does not assign predicted scores.

| Criterion | Source evidence | Remaining evidence |
|---|---|---|
| Technological implementation | Real SQLite shared by browser/CLI; typed synthetic schemas; constraint-aware reduction; faithful supported-integer output; bounded propose/execute/feedback loop; reduced-case export; actual browser record replay through CLI; frozen evaluation harness; 144 tests and built-provider-gate validation | Actual NVIDIA response through Nebius, catalog confirmation, provider/run measurements and connected-provider verification |
| Design | Indigo shell, dark syntax editor, light result inspector and warm witness; disagreement first; disclosed contract/draft controls; exact row deltas and SQL diff; explicit candidate approval; local recovery and input focus; desktop/mobile/keyboard browser checks and paired QA captures | Browser download completion, real-device/Safari/accessibility review and independent intended-user observations |
| Potential impact | A reviewer can reproduce a divergent refactor on small synthetic data, export a reduced case, run it in a repository and replay an evidence record without a model call. CLI preserves the query file and returns nonzero for failed checks | Demand, setup effort, comprehension and saved time remain unmeasured. No production-database safety or adoption claim |
| Quality of idea | Combines independent finite checks, inspectable counterexamples, bounded repair and portable regression evidence. Gold SQL and held-out rows stay out of repair context. Optional generic-topic documentation explains SQLite semantics without grading results | SQL repair, unit testing and small-witness reduction are established prior art. Browser-to-CLI usefulness remains a product hypothesis, not an algorithmic novelty claim |

## Controlled evidence

- Three workbench reference queries agree on 99/99 curated/seeded checks, seed 2026. Their nine deliberately wrong repair controls are rejected. These are separate from the frozen corpus.
- The inventory reference agrees on 4/4 fixtures and demonstrates typed custom cases beyond the three examples.
- The frozen corpus contains 24 synthetic proposed changes across six schemas: 18 wrong mutations and six equivalent rewrites. Offline validation performs 24 reference checks against independent hand calculations and 96 candidate fixture checks. Wrong changes must be exposed; equivalent rewrites must remain accepted.
- One-shot and at-most-two-round feedback modes use the same declared visible/held-out split. Held-out scoring runs after repair stops; generated challenge fixtures do not enlarge its denominator. The harness reports mis-repairs, false acceptance, errors, exhausted loops and calls rather than omitting them.
- Injected-proposal and HTTP transport tests are mocks. No live NVIDIA/Nebius evaluation, usage, latency or repair accuracy is established. The public held-out split protects the within-run prompt boundary, not secrecy or pretraining exclusion.
- `verify` checks a digest only. `replay` validates the recorded pack/suite and independently executes original and candidate queries. Reproducing an originally failing outcome is successful replay; it does not make that query correct or authenticate provider metadata.
- SQLite INTEGERs outside the exact JavaScript safe-integer range are rejected before conversion. REAL comparison has no tolerance. Passing finite checks do not prove universal equivalence.

## Product assumptions and delivery gates

The strongest use case preserves a known query's behavior during a refactor or AI rewrite. The reviewer supplies the trusted reference. When business intent changes, the original baseline alone is insufficient; expectations need review. This limitation belongs in onboarding, imports and the pitch.

Version 0.4 local review is public at https://rowglass.adeelfalaksher900.chatgpt.site. Anonymous HTTPS access returned 200 without cookies or authorization. The generated public Worker forces local-only mode; no live-model judge flow is claimed. Nebius GitHub login succeeds but billing/provisioning remains blocked, including AI Cloud's $25 billing requirement and absent Pakistan residence option. The official FAQ disallows OpenRouter as a substitute. Tavily semantic search has no verified key or runtime call; no bonus eligibility or Serverless deployment is claimed. The separate formal security audit remains incomplete; see SECURITY-REVIEW-2026-10-19.md.

Coding and Agentic Engineering is chosen for fit with code generation, execution, tests, revision and repository handoff. Reliable per-track entry counts are unavailable. Past winners informed a focus on specific problems and reproducible behavior, not winning odds. See [current research](RESEARCH-2026-10-19.md), [PRD](../PRD.md), [TRD](../TRD.md) and [benchmark protocol](../benchmark/README.md).

Final media follows the checked final product, actual required runtime and working judge access. The video should demonstrate the complete review task rather than present control counts as model achievements.
