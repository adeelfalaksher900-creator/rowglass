# v0.4 security review status

This is a bounded source hardening record, not a certification or a completed formal penetration test.

## Fixed and checked

- The generated public Worker unconditionally forces local-only mode, independently of runtime keys/flags. Its actual built ESM was exercised with 16 mode/kill-switch combinations, dummy keys and forged identity headers. Both provider routes made zero outbound calls.
- Hosted runtime revision 1 contains only local-only mode and the emergency public flag; neither provider key is attached. Anonymous HTTPS checks returned 200 for the app and status without cookies or authorization.
- A direct Node API requires an explicit private mode and normal loopback bind. Wildcard, remote and review-frame previews override that mode to local-only. The CLI has its own explicit private opt-in. This is not public identity or durable budgeting.
- The fixed model destination rejects redirects, limits response bytes to 128 KiB and applies one 60-second deadline across headers/body. Error, oversized, malformed, stalled and late bodies are cancelled. Only generic errors reach clients.
- Status distinguishes key presence, permitted operation and response observation. Observation is bound to the current key/model; mocked responses do not count as live evidence.
- Reference/reset actions clear old reports before changing query state and reject stale completion. Browser exports use the replay-compatible execution-record version independently of the product release number.
- SQL presentation renders escaped React text over the native textarea. Long-query scroll alignment was checked; the final measured difference was below one CSS pixel. Invalid query/pack submissions focus the associated input after it is enabled and expose aria-invalid.
- CI actions use verified full commit SHAs, read-only permissions, disabled credential persistence and a 10-minute timeout. Weekly Dependabot checks are configured. No privileged pull_request_target or deployment secret path was added.
- A targeted current-tree scan found no private-key, GitHub token, AWS key or provider-token pattern in 102 tracked text files at the implementation checkpoint. This is not a history/runtime-secret scan or proof that all secrets are detectable. Public runtime status was checked separately.

The full development suite passes 144 tests. These are functional/contract tests with injected provider transports; no paid provider call or real model evaluation ran.

## Formal audit remains incomplete

The explicitly invoked security-audit workflow requires an OS-isolated execution environment. Its instruction is: “If every control cannot be enforced, do not execute target code: report the missing sandbox capability as a needs-validation blocker and give a safe validation plan.”

The earlier sandbox capability probe could not establish the required isolation. Remaining audit coverage verification, critics/verifiers, canonical reporting and report-validator phases were not completed. The bounded source reviews and ordinary development checks above do not replace them.

Status: **incomplete**. Reason: `required_os_sandbox_unavailable_and_remaining_audit_phases_not_completed`.

To finish that separate audit: use an environment enforcing the workflow's OS, filesystem, process/resource and network controls; restore the audit coverage ledger; validate each surviving source hypothesis there; complete all critics/report-validator phases; publish the canonical validated report with blocked/unverified items disclosed. Do not run an unrestricted fallback or turn a source lead into a demonstrated exploit.

## Release boundaries

Anonymous local SQLite review is published. Live judge inference remains disabled. Enabling it requires approved Nebius access/free credits, a verified principal and an atomic durable global allowance/concurrency ledger. No Supabase or unrelated database was changed. Optional Tavily runtime and its award eligibility remain unverified. No actual NVIDIA-on-Nebius response, production-safety claim or universal SQL correctness claim is made.
