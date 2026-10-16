# Validation checkpoint

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
