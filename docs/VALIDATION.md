# Current validation: v0.3

19 October 2026 Pakistan time. `npm run check` passed **120/120 tests**, built the production Worker ESM and validated its `default.fetch` entrypoint. This run followed the combined implementation and independent review corrections. No model provider or search service was contacted by these tests.

The frozen corpus validator executed 24 reference checks and 96 candidate-fixture checks across six schemas: 18/18 wrong mutations rejected and 6/6 equivalent rewrites preserved. Its stable manifest digest and actual results are in [frozen-controls.json](frozen-controls.json). These are synthetic evaluator controls, not model accuracy. The injected-proposal harness separately tests one-shot versus at-most-two-call feedback, held-out isolation, false acceptance, mis-repair and budgets; real provider evaluation remains unrun.

New coverage includes integer precision and supported REAL behavior, verified reduced-case handoff (including valid zero-row databases), complete offline review replay, contradictory summary aliases, CLI safe file handling, generic official-document search guards, local Host/target validation, unique generated fixture identities, cancellation after transport and a replayable first attempt after a later provider failure.

An independent implementation reviewer reproduced six defects, then rechecked their fixes and independently ran 30 relevant tests with zero failures. A full 120-test run followed the export fallback and UTF-8 limit correction. The browser cancellation race is source-reviewed; it has not been exercised with a real connected provider. This review is not the incomplete formal security audit described in [REVIEW-CHECKPOINT.md](REVIEW-CHECKPOINT.md).

## Current deployed browser observations

Checked v0.3 runtime source `b06a74d4212c34362ad9c4b83d745c2e1f67aa57` deployed successfully in the owner-private preview. Current Chrome browser QA observed all three original baselines at 3/9, 5/9 and 7/9; each hand-authored repair reached 9/9 and applied only on explicit action. The customer reference reached 33/33 with seed 2026. A too-large SQLite INTEGER produced an explicit safe-range error rather than rounded evidence.

Invalid JSON import was rejected; the inventory example opened at 2/4. Saving/restoring a correct customer query across an imported case restored that query and 9/9 evidence. Tab from the SQL editor focused Run tests. The QA draft was explicitly forgotten afterward; reset restored the original proposal. An optional documentation request returned its unconfigured state without changing the query.

Preparing the reduced customer regression case reran it in the browser. Its copied exact JSON ran independently in the CLI: original 0/1, exit 1; trusted reference 1/1, exit 0. Replaying the failing review correctly exited 0 because the recorded failure reproduced. The browser's newly prepared sealed review JSON (version 0.3, 3/9, zero model calls) also replayed independently in the CLI with every outcome reproduced. Editing SQL removed the prepared JSON and disabled stale review export.

The real evaluation page executed 24 controls, showed 18/18 rejections, 6/6 preservation, 96 candidate checks and 24/24 independently calculated reference checks. Expanding the table showed 24 rows. Desktop document width equaled viewport width at 1270/1270. With actual browser viewport overrides, 390px and 768px measured 380/380 and 758/758 after scrollbars; the wide corpus table scrolled within its own panel (602px content in a 315px panel at 390px) without page overflow. Visible mobile buttons met the implemented 44px minimum. The viewport override was reset.

Current screenshots: [workbench mismatch](qa/v0.3-workbench.png) and [evaluation at 768px](qa/v0.3-evaluation.png). These are internal QA documentation, not the final 15-image promotional gallery. No full accessibility certification or real touch-device coverage is claimed.

The browser download event timed out after six seconds; its file completion remains unconfirmed and no app error was observed. Copyable sealed JSON, Markdown, SQL patch and regression JSON provide a reviewable fallback; the exact copied review/regression files were independently executed as described above. Real-provider repair/challenge/cancel interaction still needs a connected Nebius account; local injected-transport tests and source review cover the bounded control flow only.

## Remaining release gates

Actual NVIDIA-on-Nebius inference, functional optional Tavily usage, durable judge inference access, intended-user feedback and final factual eligibility remain open. The formal source security audit described in REVIEW-CHECKPOINT.md is still incomplete because its required OS sandbox and remaining audit phases have not been established; passing development tests are not that audit. Older browser observations below belong to v0.2 and are retained as history.

---

# Historical v0.2 checkpoint

16 October 2026, version 0.2. All 48 local engine, CLI, agent-loop and mocked-provider tests pass. `npm run check` also builds the Worker and verifies its ESM fetch export. `npm audit --omit=dev` reports zero known vulnerabilities at this checkpoint. The deterministic premium frontend audit reports zero findings; this is not an accessibility or security certification.

## Reproducible controls

Seed 2026 supplies 24 generated fixtures in addition to 9 curated fixtures for each built-in. The three references pass 99/99 in total. The original queries fail 28/33, 15/33 and 10/33 respectively. All nine deliberately wrong repairs are rejected. The custom inventory reference passes 4/4 while its baseline passes 2/4. These are synthetic local controls, not a Nemotron accuracy benchmark.

Regression coverage includes empty-result column preservation, duplicate counts, schema/foreign keys, integer/text/null constraints, raw-DDL rejection, read-only queries, isolated databases, result limits, quoted blob/format allocation functions, deterministic stress fixtures, two-round feedback, cancellation before a call, custom-context oracle exclusion, provider failures, public inference failing closed with forged identity headers, request size limits, digest tampering and real CLI exit codes. An unbounded recursive aggregate is terminated in a worker; a subsequent valid check recovers.

## Browser observations

The managed browser executed real SQLite, showing the original customer query at 3/9 and a valid one-row witness. The hand-authored reference reached 9/9, and applying it changed the local editor. The seeded suite reached 33/33 for that reference. Evaluation showed 33/33 references for all three cases and the expected negative controls.

Custom import accepted the synthetic inventory example and displayed 2/4 for its baseline. Invalid JSON was rejected. Restoring a saved good query across a custom/built-in case switch preserved the SQL and 9/9 results. Tab from the SQL editor moved focus to Run tests. An unbounded aggregate produced the execution-time-limit error without discarding the entered SQL, and restoring the draft recovered the worker.

Final export QA found that the HTTP preview lacked `crypto.subtle`; portable SHA-256 replaced that dependency. A fresh browser JSON download then succeeded and the CLI verified its exact digest. An actual Rowglass-generated SQL patch passed `git apply --check`, applied cleanly and reproduced the reference query. Follow-up patch/Markdown download events and the browser file-link download API still timed out, with no visible application error. These exports now use native download links with object URLs retained until content changes/unmount, plus copyable in-page review text. The copyable summary and SQL patch were opened and verified as read-only text at the 360-pixel width with no document overflow. Browser file completion remains unconfirmed; the cause is not established. No blocked browser security page was bypassed.

Follow-up narrow-screen QA used real nested browser viewports at nominal widths 360, 390 and 768 CSS pixels. A grid track initially expanded the 390-pixel frame document to 562 pixels. Replacing the automatic grid minimum and constraining sidebar/panel minimum widths removed page overflow. Measured document/client widths now agree at 350/350, 380/380 and 758/758 (scrollbars occupy the remaining frame width). The 390-pixel flow applied the reference and showed 9/9; the 360-pixel flow imported inventory and showed 2/4. This checks responsive layout, not a real touch device, Safari, Android or a full accessibility audit. The opt-in local frame route is absent from the deployed Worker.

## Runtime and publication limits

GitHub sign-in to Nebius succeeded and the signed-in billing screen was rechecked. Pakistan is absent from the displayed country list. Billing/provisioning setup is the current blocker. No API key or actual NVIDIA response was obtained, and no card/payment or account agreement was submitted. Live inference must not be claimed from mocked transport tests.

The review Site remains owner-private. Public GitHub source is MIT licensed; Remote GitHub Actions run [38922421136](https://github.com/adeelfalaksher900-creator/rowglass/actions/runs/38922421136) completed successfully for commit 9db3caf4c6b214acdd82bc0127bc9982e599f7fe. It ran clean installation, project checks and the inventory CLI review/digest check. The Devpost entry remains incomplete; this phase does not submit it or produce video, narration or the 15-image gallery. Real Nebius evidence, judge access, final factual eligibility answers and public demo footage remain release gates.
