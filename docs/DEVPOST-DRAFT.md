# Rowglass

**Tagline:** SQL repairs with executable counterexamples.

**Track:** Coding and Agentic Engineering.

Saved online at https://devpost.com/software/rowglass as an incomplete submission. The existing Devpost team lists ADEEL FALAK SHER and Raouf Khalid. Team eligibility/residence and personal learning answers must be confirmed before final submission.

## Inspiration

A SQL query can run without an error and still silently drop customers or double revenue. An attractive explanation from a coding model does not establish that its repair preserves the intended result. Rowglass is a small workbench for developers reviewing those changes: show the failing rows, propose a repair, execute it, and review the evidence.

## What it does

Three original synthetic incidents cover LEFT JOIN filters, order/item fan-out, and NOT IN with NULL. Each supports nine curated databases plus 24 seeded synthetic fixtures. A reusable case-pack format lets developers supply their own schema, contract, independent reference and synthetic data; an inventory example demonstrates this. The repository CLI returns a failing exit code for a mismatch and writes a review without overwriting the SQL file.

An independent reference computes the expected result. A reducer removes rows while preserving a valid mismatch, producing a smaller example a reviewer can inspect. Browser reviews include exact row deltas, proposed SQL diffs, opt-in local drafts and JSON/Markdown exports. Review digests identify content but do not authenticate it.

The implemented agent adapter requests structured SQL and an optional adversarial fixture from NVIDIA Nemotron through Nebius Token Factory. A candidate is tested before it can be applied. A failed candidate can receive execution feedback for one revision. Model-generated explanations are never used as the test oracle.

**Current release gate:** the adapter has passed mocked-transport checks. GitHub sign-in to Nebius succeeded, but billing/provisioning setup blocks key/credit access. No actual inference has run. The explicitly labeled hand-authored reference workflow works locally. This draft must be updated with actual runtime evidence before final submission. Media and final submission are deferred until user review.

## How we built it

React provides the workbench. sql.js runs SQLite in a disposable browser worker or CLI worker thread with a timeout, typed synthetic data, primary/foreign-key validation and output limits. Structured schema compilation rejects raw DDL. An ESM server validates JSON, keeps the model key server-side, and targets the official Token Factory chat-completions endpoint with a cookbook NVIDIA model ID or a configured NVIDIA model override. Catalog availability still needs confirmation. The model receives the selected case's schema, contract, candidate SQL and bounded failure evidence; reference SQL and the full suite are excluded.

The local evaluator is inspired by distilled SQL test suites and mutation-based code evaluation. It compares result multisets, retaining duplicate counts, then reduces a failing database through valid single-row deletions. Neither finite passing tests nor single-row irreducibility proves universal correctness.

## Challenges

One zero-ID fixture initially failed to expose a plausible wrong repair because that subscriber was also suppressed. Correcting the fixture made the mutant fail. This was a useful reminder that the checker itself needs positive and negative controls. Credential onboarding remains an unresolved integration blocker.

## Accomplishments

All 48 local engine, CLI, agent-loop and mocked-adapter tests pass. Three reference queries pass 99/99 curated/seeded fixture checks in total; the custom inventory reference passes 4/4. Nine intentionally wrong repairs are rejected. Browser QA verifies custom import, draft restoration across cases, timeout recovery, real SQLite evaluation and a downloaded JSON review whose digest was verified by the CLI. Follow-up 360/390/768-pixel layout checks exposed and fixed horizontal page overflow. Browser patch/Markdown file completion remains unconfirmed; copyable review text is available. The initial public GitHub CI run also passed. These are local synthetic results, not a Nemotron benchmark.

## What we learned

Separating the model from the oracle makes a repair easier to examine. Small, inspectable counterexamples explain a disagreement more concretely than a confidence score. A test fixture can also hide the very bug it is intended to detect.

## What's next

Complete a real Nebius call; record its response ID and tested output; provide durable public inference limits and unrestricted judge access; then record the final English demonstration. Expand dialects and tasks only after validating each reference and fixture set.

## Product feedback draft

The documented OpenAI-compatible Token Factory API makes the adapter small, and the official model cookbook provides an initial model identifier. Hands-on inference latency, reliability and cost have not been measured. GitHub authentication succeeds, but the account stops at billing/provisioning before model use. Clearer credit activation and supported-country guidance would help this onboarding path. No false billing country or alternate provider was used. Feedback about model/service behavior will be added only after successful calls.

## New work and attribution

Rowglass was created on 16 October 2026 during this submission period. Its three cases, fixtures, UI and integration code are new work. AI assistance was used for research, implementation and test preparation; see AI-DISCLOSURE.md. Libraries and fonts retain their licenses. No city attendance, Tavily integration, real-user outcome study or production-database safety claim is made.
