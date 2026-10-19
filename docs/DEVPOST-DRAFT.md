# Rowglass

**Tagline:** Review SQL changes with executable counterexamples.

**Track:** Coding and Agentic Engineering.

Release v0.4 story, 19 October 2026 Pakistan time. The entry remains a draft. Anonymous local review is public; actual NVIDIA-on-Nebius runtime, any live judge inference allowance, factual team/eligibility answers, the separate formal security audit and final media remain release gates.

## Inspiration

A behavior-preserving SQL refactor can run without errors and still drop customers or inflate revenue. A coding model's explanation is not enough to approve that change. Rowglass helps a developer reproduce the disagreement, inspect the few rows which expose it, test a repair and carry the regression into a repository.

This workflow starts with a developer-owned trusted baseline. It is useful when preserving behavior. If the business rule intentionally changes, the old query is insufficient: the reviewer needs new expectations. Rowglass does not discover business intent or certify its reference automatically.

## What it does

The review flow has three stages: reproduce, inspect and review. Three synthetic incidents cover outer-join filtering, join fanout and NULL-sensitive exclusion. Each has nine curated fixtures plus 24 seeded stress fixtures. Developers can also import a strict typed case pack containing their own contract, proposed SQL, trusted reference and synthetic rows.

SQLite executes both queries independently and compares exact result columns and duplicate-sensitive row multisets. A constraint-aware reducer finds a smaller distinguishing database. The reviewer can export that reduced case, rerun it with the CLI and retain it as a regression test. The artifact contains synthetic data and the supplied reference, with no database connection needed.

The v0.4 workbench produces compatible version 0.3 JSON execution records containing their case and suite. CLI `replay` independently recomputes original and optional candidate outcomes offline, without a provider call. Digest-only `verify` remains separate: a matching hash does not establish that results are reproducible or that a model call happened.

The agent path requests structured repair proposals from NVIDIA Nemotron through Nebius Token Factory. Each proposal is executed before approval. A failed proposal receives bounded visible execution feedback for at most one revision. The reference query and full suite are excluded from model context. Hand-authored demonstration repairs remain explicitly labeled.

An optional Tavily integration retrieves official SQLite explanations for four fixed semantic topics. Only a generic topic enters search, without uploaded SQL, identifiers or row values. Citations explain semantics; they never establish expected results or grade a repair.

**Public local demo:** [Open Rowglass](https://rowglass.adeelfalaksher900.chatgpt.site). No account or API key is needed for local SQLite review, examples, custom imports, reference comparisons and evaluation. Provider calls are disabled in this public deployment. Anonymous HTTPS access was checked without cookies or authorization.

**Current release gate:** actual NVIDIA-on-Nebius inference has not run. GitHub sign-in succeeds for Token Factory and AI Cloud, but billing/provisioning blocks free key and credit access. The AI Cloud page requires a $25 billing payment and does not list Pakistan in its residence filter. The official hackathon FAQ disallows OpenRouter as a substitute. The model adapter and optional Tavily lookup have injected-transport checks only. This draft is not ready for final submission. Final video, narration and the captioned gallery follow the tested final product and real runtime evidence.

## How we built it

React provides the review workbench. sql.js runs SQLite inside disposable browser and Node workers. Typed schema compilation rejects raw DDL, inserts bound values and checks primary/foreign-key constraints. The CLI preserves input SQL and writes reviewable artifacts instead of editing or merging a repository automatically.

The redesigned workbench pairs an indigo navigation shell and dark syntax editor with a light result inspector and warm counterexample panel. The disagreement and proposed SQL come first; contract and draft controls open on demand. Self-hosted IBM Plex and Sora fonts, licensed Lucide icons, visible keyboard focus and responsive layouts support a coherent developer tool. Syntax paint uses escaped text and follows the native editor's horizontal and vertical scrolling.

The ESM server keeps credentials server-side, validates requests and replies, and fixes the inference destination to the official Token Factory chat-completions API. The configured default model is `nvidia/nvidia-nemotron-3-nano-30b-a3b` from the official cookbook; current account/catalog availability remains unverified. Connection status distinguishes configured credentials from an observed successful response. Provider metadata is not signed attestation.

The generated public Worker forces local-only mode even if runtime keys or flags are added accidentally. Keyed CLI and loopback-server calls require explicit private opt-in. Model transport rejects redirects, bounds response bytes and applies a deadline across headers and body. These controls do not provide durable public inference authorization; that requires verified identity and an atomic persistent allowance before a live judge deployment.

SQLite INTEGER outputs are read as BigInt before conversion. Only values inside JavaScript's exact safe-integer range are accepted; larger integers are rejected rather than rounded. Finite REAL results retain exact number comparison. Execution has time/output bounds, but these guards do not constitute a full WebAssembly memory sandbox.

The design draws on established SQL test-suite evaluation, small distinguishing databases, execution-guided repair and fixture-based regression testing. Rowglass's product hypothesis is low-setup browser investigation plus a portable browser-to-CLI handoff. We do not claim to invent those methods.

## Evaluation

The frozen corpus contains 24 hand-authored synthetic proposed changes across six schemas. Eighteen are deliberately wrong mutations; six are equivalent rewrites. Each schema has two repair-visible fixtures and two held-out fixtures, with hand-calculated expected results. Offline validation performs 24 independent reference checks and 96 candidate fixture checks, exposing the wrong changes while preserving the valid rewrites.

A separate harness supports one-shot and at-most-two-round execution-feedback proposals. It scores held-out fixtures only after repair stops and records mis-repairs, false acceptance, errors, call limits and supplied final-proposal metadata. Generated challenge fixtures do not enlarge the frozen denominator. Injected-proposal checks establish protocol behavior, not model quality. No live provider comparison has run. The public held-out split protects the prompt boundary within a run, not a secret external benchmark.

The three original reference queries separately pass 99/99 curated/seeded checks, the inventory reference passes 4/4 and nine wrong repair controls are rejected. These are finite synthetic controls of the evaluator, not Nemotron accuracy results or proof of universal SQL equivalence.

## Challenges

A fixture initially concealed the very wrong repair it was intended to expose. Adding negative controls made that weakness visible. Later source review identified large-integer rounding as another evidence-fidelity risk; version 0.3 now rejects unsupported integers explicitly.

Review handoff also needs more than a hash. A digest can match after someone rewrites the entire record, so offline replay validates and executes the recorded case instead of treating content identity as correctness. Nebius provisioning remains the unresolved external integration blocker.

## Accomplishments

The implementation connects browser investigation, exact finite SQLite checks, inspectable row differences, constrained witness reduction, proposed SQL diffs, reduced-case export and independent repository replay. Inputs remain intact. Local checking works without an account. Optional local drafts and copyable artifact text support review without requiring shared storage.

The frozen controls check both wrong changes and valid rewrites, and keep live-model claims separate. The current build passes 144 automated tests and production artifact validation. The built public Worker was checked across 16 configuration combinations with zero outbound provider calls. Browser checks cover imports, all three examples, reference approval, seeded fixtures, local draft recovery, rejected inputs, keyboard focus and responsive layouts at 390px, 768px and desktop. An actual browser-exported record replays the original 3/9 and reference 9/9 outcomes independently through the CLI; its reduced regression reproduces the expected 0/1 mismatch. Browser file-download completion remains unconfirmed; the exact copyable artifacts were executed. Connected-provider UI checks and the separate formal security audit remain incomplete.

## What we learned

A baseline is useful only when its intended role is clear. Preserving an existing query and defining a new business rule are different tasks. A small counterexample is easier to investigate than a confidence score, and the evaluator needs independent checks of its own. Reproducible evidence is stronger than a plausible explanation, but finite examples still have limits.

## What's next

Complete approved Nebius access, confirm model availability and run the frozen one-shot/feedback comparison under granted credits. Publish actual outcomes and failures. Local anonymous access is already public. Complete connected-provider UI/security verification and, if live inference is offered to judges, add verified identity and durable allowances. Maintain free usable judge access through December 15. Then record the final English YouTube demonstration under three minutes and create the accurate captioned gallery.

Serverless Jobs could support repeatable batch evaluation if approved AI Cloud access/credits become available. No deployment or grant is assumed. A dedicated persistent backend is justified only if shared reviews or durable authenticated inference allowances are needed; none is claimed today.

## Product feedback draft

Token Factory's documented API and official model cookbook make a small adapter feasible. This is a documentation and implementation observation, not a measured inference result. GitHub authentication succeeds for Token Factory and AI Cloud, but the account stops at billing/provisioning. Pakistan was absent from the displayed residence lists; AI Cloud asks for a $25 billing payment. Clear country-support and credit-activation guidance would improve this path. The FAQ explicitly rules out OpenRouter as a replacement. No false residence, payment, paid resource or alternate-provider workaround was used.

Actual model quality, latency, reliability and cost remain unmeasured. We will add specific observations after successful runtime use. Tavily's fixed-topic, domain-restricted documentation lookup is implemented and mock-tested, but actual service behavior and award eligibility remain unverified. No Nebius Serverless usage is claimed.

## New work and attribution

Rowglass was created on 16 October 2026 during this submission period. Version 0.4 adds the redesigned responsive workbench, compatible portable evidence, safer asynchronous review actions, bounded model transport, fail-closed public deployment and expanded validation. It retains reduced regression handoff, integer fidelity, the frozen 24-change corpus and evaluation harness, and optional semantic-source lookup. AI assistance supported research, implementation and test preparation; see [AI disclosure](https://github.com/adeelfalaksher900-creator/rowglass/blob/main/docs/AI-DISCLOSURE.md). Libraries, fonts and icons retain their licenses. Research and alternatives are acknowledged in [research and alternatives](https://github.com/adeelfalaksher900-creator/rowglass/blob/main/docs/RESEARCH-2026-10-19.md).

No city attendance, verified Tavily bonus eligibility, live model accuracy, intended-user study, production adoption or winning probability is claimed.
