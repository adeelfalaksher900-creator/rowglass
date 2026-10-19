# Judging evidence, not predicted scores

The four criteria are equally weighted after a viability and track-fit check. This maps version 0.3 source behavior to inspectable evidence and records gaps. It does not assign predicted scores or declare the hosted build current.

| Criterion | Source evidence | Remaining evidence |
|---|---|---|
| Technological implementation | Real SQLite shared by browser/CLI; typed synthetic schemas; constraint-aware reduction; faithful supported-integer output; bounded propose/execute/feedback loop; reduced-case export; full-suite offline replay; frozen visible/held-out evaluation harness | Actual NVIDIA response through Nebius, catalog confirmation, provider/run measurements, checked deployment and final combined verification |
| Design | Reproduce → inspect → review flow; trusted-baseline/proposed-change distinction; exact row deltas and SQL diff; explicit candidate approval; regression handoff; local-draft controls; copyable artifact fallback; unavailable-service states | Fresh full desktop/mobile/keyboard flow checks, browser download completion, real-device/accessibility review and independent intended-user observations |
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

The checked version 0.3 review preview is deployed owner-private. Source capabilities and mocked integration checks do not establish judge-ready access. Nebius billing/provisioning remains blocked. Tavily semantic search is implemented but has no verified key or runtime call; no bonus eligibility is claimed. No Serverless deployment is claimed.

Coding and Agentic Engineering is chosen for fit with code generation, execution, tests, revision and repository handoff. Reliable per-track entry counts are unavailable. Past winners informed a focus on specific problems and reproducible behavior, not winning odds. See [current research](RESEARCH-2026-10-19.md), [PRD](../PRD.md), [TRD](../TRD.md) and [benchmark protocol](../benchmark/README.md).

Final media follows the checked final product, actual required runtime and working judge access. The video should demonstrate the complete review task rather than present control counts as model achievements.
