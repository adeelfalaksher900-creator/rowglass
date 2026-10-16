# Validation checkpoint

16 October 2026. All 29 engine and mocked-adapter tests pass. The initial run exposed a missing mutation-detection case: the zero-ID fixture suppressed the zero subscriber, so an incorrect `id > 0` repair escaped. The fixture now leaves zero active and unsuppressed, and the wrong repair fails.

Observed native browser flow at the managed preview: the original customer query passes 3/9; one customer without an order is a valid mismatch; loading the explicitly hand-authored reference yields 9/9; applying it updates the query and finite-test results. The evaluation route runs actual SQLite. The current build also reports an invalid column as 0/9 with the SQLite error, and exports a JSON review containing that query and its failed results. A page reload was needed after rebuilding; QA was repeated on the refreshed build. Narrow-viewport and full keyboard navigation checks remain pending.

Automated checks cover positive reference controls, original-query failures, all nine deliberate wrong repairs, valid single-row irreducibility, multiset duplicates, rejected writes and extensions, SQL comments/quotes, foreign-key validity, isolated databases, missing credentials, cross-origin calls, input schemas, a mocked provider request and response provenance, and provider failures. Additional result-size and numeric-fixture regressions were added.

`npm audit --omit=dev` reports zero vulnerabilities. The static premium audit reports zero findings after contract/header fixes. DESIGN.md lint has zero errors and seven orphan-token warnings; the runtime CSS uses those tokens, but the documentation lists only one component. Neither static audit establishes accessibility or model correctness.

Live Nebius generation remains unverified. Google stopped sign-in after the device request was rejected. The adapter must not be described as a successful runtime integration until a real request and resulting execution evidence are observed. No credential was placed in code, logs, screenshots or the browser bundle.

Published checkpoint: the owner-private Sites deployment succeeded. Public GitHub source is licensed MIT. Devpost shows INCOMPLETE SUBMISSION and the saved story explicitly states the live-inference blocker. No final rules/terms acceptance was performed. The existing two-person Devpost team was preserved, with submitter type set to Team.
