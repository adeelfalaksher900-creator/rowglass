# Rowglass product requirements

Version 0.4 specification, 19 October 2026 Pakistan time. Status: implementation authorized by the user's instruction to research, write the PRD/TRD and proceed autonomously. This document specifies acceptance criteria; unchecked criteria are not claims of completed functionality.

## Decision and audience

Build a SQL change-review agent for analytics engineers and small software teams. Before merging a refactor or AI-written rewrite, a reviewer supplies a trusted behavioral baseline, proposed SQL, a contract and synthetic fixtures. Rowglass reproduces disagreement, reduces it to inspectable rows, asks NVIDIA Nemotron on Nebius for a candidate repair, executes that repair and exports a regression case another reviewer can run.

The central promise is **review a SQL change with reproducible evidence**. The product does not invent SQL testing or equivalence checking. A developer-owned baseline is useful when preserving behavior. If business behavior is intentionally changing, the reviewer must supply updated expectations; the old query is then insufficient as an oracle. A reference query is an explicit assumption, never unquestionable truth.

Initial users are developers comfortable reading SQL, working in SQLite-compatible queries or small reproductions of warehouse bugs. No customer-demand, adoption, time-saving or production-safety claim is established yet. The browser flow should require no account or warehouse connection for local checking.

## Why this project and track

Coding and Agentic Engineering fits planning, writing, executing and revising SQL in a repository workflow. Best Apps is a viable alternative but weakens the specific developer story. Personal AI would require meaningful persistent personal workflows. Physical AI would require a credible embodied or simulation problem and substantial new scope. No verified per-track participation counts or winning probabilities exist.

Past official winners favor specific useful systems, measurable behavior and working artifacts. This informs the strategy, not a prediction. General AI code review and execution-guided SQL repair already exist. The product differentiation hypothesis is low-setup browser investigation plus a small, portable browser-to-CLI regression handoff.

Research and source notes: [docs/RESEARCH-2026-10-19.md](docs/RESEARCH-2026-10-19.md).

## Capability map and build order

| Module | Responsibility | Depends on |
|---|---|---|
| case-contract | Typed schema, trusted baseline, proposed query and synthetic fixtures | None |
| local-evaluator | Isolated SQLite execution, exact comparison and valid witness reduction | case-contract |
| regression-handoff | Reduced case export and independent review replay | local-evaluator |
| repair-agent | Bounded model proposals, execution feedback, explicit candidate approval | local-evaluator |
| semantic-sources | Optional official-document search with citations | case-contract |
| hosted-access | Authenticated inference and durable allowances before public live use | repair-agent |
| evaluation | Frozen visible/held-out protocol and measured results | case-contract, repair-agent |
| review-experience | Clear navigation, states, responsive evidence and exports | All applicable modules |

Build in this order: baseline corrections, evaluator fidelity, regression handoff, evaluation controls, hosted-access/source integration, review experience, real service validation, release media. Independent modules may proceed in parallel after their contracts are fixed.

## Product flow

1. **Reproduce.** Open an example or import a synthetic case. Explain the trusted baseline and the proposed change. Run tests; edits invalidate old results. Invalid reference/fixture state must be distinguished from a failing proposal.
2. **Inspect.** Show expected and proposed rows, duplicate-sensitive deltas, test identities and a valid reduced witness. Label NULL distinctly. State the reducer's local irreducibility limit.
3. **Review.** Request Nemotron repair or a challenge. Show each attempt, calls and available usage/latency. Independently test the candidate. Apply only a displayed passing candidate after explicit action. Export a reduced regression case and review evidence for a repository.

A novice walkthrough uses the disappearing-customer example. The trusted query preserves customers without paid orders; the proposed rewrite puts a filter in WHERE and changes behavior. Explain why the baseline exists and where its trust comes from. The example's hand-authored reference remains visibly separate from live model output.

## Functional requirements and acceptance

| ID | Requirement | Acceptance evidence |
|---|---|---|
| P01 | Preserve existing working cases and imports | Three curated examples and inventory pack retain their measured positive/negative controls |
| P02 | Faithful numeric results | Distinct SQLite INTEGERs never collapse through JS precision; non-finite and unsupported oversized integers produce explicit errors; supported REAL values retain the documented exact-number policy |
| P03 | Safe repository handoff | Existing inputs/outputs and aliases are never overwritten; bounded reads; valid larger exported reviews verify |
| P04 | Reduced regression case | Export a valid case pack containing the exact reduced witness, failing proposed query and trusted reference. The existing CLI reproduces the disagreement from that file |
| P05 | Independent replay | A CLI replay command verifies the digest, validates the included case/suite, recomputes original/candidate results and detects changed or incomplete evidence. Digest agreement alone is not replay success |
| P06 | Real bounded agent | NVIDIA open model on Nebius performs an actual runtime call; proposals and optional fixtures are independently checked; repair has at most two rounds, challenge one; cancellation prevents stale application |
| P07 | Honest connection state | Distinguish unavailable, configured and successful response observed. Configured key is not proof of a completed call. Mocks/reference repairs never appear as live evidence |
| P08 | Reproducible evaluation | Freeze 24 candidate changes across at least six small schemas, including valid rewrites, before live model evaluation. Independently review oracles. Visible and held-out fixtures stay separate |
| P09 | Honest measurements | Publish actual evaluated denominator, failures, mis-repairs, false accepts, model calls and returned usage/latency. Do not fill missing live measurements with synthetic or mocked values |
| P10 | Useful optional Tavily | A real API search retrieves only official SQLite documentation for generic semantic topics. No uploaded SQL, schema names or row values enter the search query. Citations explain behavior and never define expected results |
| P11 | Judge-ready access | A working public demo/test build and free judge access through December 15. Public live inference remains disabled until authenticated access, durable budgets and concurrency limits are verified |
| P12 | Complete review experience | All primary controls work; current desktop/mobile and keyboard checks cover import, edit, run, inspect, repair, challenge, cancel, apply, reset, save/restore and exports |
| P13 | Release material fidelity | Public licensed source, clear setup and limitations, specific service feedback, English public YouTube demo under three minutes and 15 accurate captioned images from the final verified build |

## Design contract

Use the user-authorized indigo review-desk redesign documented in DESIGN.md: a midnight navigation shell, dark readable SQL editor, light evidence canvas, cobalt actions and restrained copper disagreement cues. Sora headings and IBM Plex body/code stay self-hosted. Show the query and computed disagreements early. Contract, baseline and draft details remain accessible through native disclosures. Preserve the complete local review, import, evaluation and portable artifact workflow.

Primary controls need visible focus, explicit loading/error/disabled states and adequate touch targets. Test 390, 768 and desktop widths with actual viewport overrides. Tables/code may scroll within their panels, while the page must not overflow horizontally. Status must include text, not color alone. A premium appearance does not establish accessibility compliance.

## Evaluation protocol

Freeze intent, schema, baseline, candidate and visible/held-out split before model calls. Include joins, outer-join filters, NULL-sensitive logic, aggregation grain, boundaries, ties, division and output columns. Cover correct candidates too: a model can introduce an error into a correct rewrite. Keep independently checked wrong mutations distinct from model-generated mistakes.

Compare original candidate, one-shot and bounded feedback repair using the same declared model and budgets where granted credits allow. Run only a clearly reported subset if access or credits constrain the experiment. Held-out rows, gold SQL and final expected results must not enter repair prompts or feedback. Model-generated challenge fixtures belong outside the frozen held-out denominator.

Metrics: repair and mis-repair counts/rates, net repairs, false acceptance, mutant detection, witness validity/row reduction/check count, timeout/invalid reply events, calls, actual token usage and latency. Reviewer usefulness requires independent user observations; engineering checks alone do not prove it.

## Optional integrations and operating limits

Use optional services where they improve the demonstrated workflow. Tavily supports cited semantic explanations and its bonus requires a functional runtime call. Nebius Serverless Jobs could run batch evaluation, but do not provision paid compute or claim deployment without approved AI Cloud access and credits. Token Factory credits do not imply AI Cloud credits. Supabase is appropriate for a durable allowance ledger or shared records, not for synthetic SQLite execution. Use an isolated project; never modify the unrelated Daanish Alumni project.

Frontend hosting may remain Sites or move to Vercel/Netlify when a concrete requirement warrants migration. Avoid migrating just to add another vendor name. Maintain one authoritative source and exact build identity.

## Mandatory release gates

- Real NVIDIA-on-Nebius runtime evidence, not another provider or transport mock.
- Relevant functional and artifact checks, current UI verification and independent review.
- Free usable judge access and adequate provider budget through the judging period.
- Correct README/license/source/description/feedback and factual team/eligibility information.
- Final product before video, voiceover or the 15-image gallery. Clear natural student-like narration, with any synthetic narration disclosed and applicable voice license respected.
- Entrant confirmation at the final legally binding submission step.

The current account still stops at Nebius billing/provisioning. Pakistan was absent from the displayed residence list, and the latest targeted inbox search found no separate credit activation email. This is an external release blocker. No false residence, card submission or alternate-provider workaround is authorized. No winning guarantee is made.

## Out of scope

Production warehouse connections, arbitrary uploaded DDL, automatic Git merges, autonomous external messaging, model training, unsupported SQL dialect claims, formal equivalence proof and globally minimum witnesses. No real user data is required. An intentionally changed business rule needs reviewed new expectations.


## v0.4 public release slice

Publish anonymous local SQL review without requiring a login. The generated public Worker must disable both model and documentation providers regardless of attached keys or mistaken environment flags. Private loopback Node/CLI inference requires exact explicit opt-in. This local public release does not satisfy P06 or the mandatory actual NVIDIA-on-Nebius runtime gate. OpenRouter is expressly disallowed as a substitute by the current hackathon FAQ. AI Cloud GitHub login was successful on 19 October; its billing screen still requires $25 and Pakistan is absent from the displayed residence options. No card or legal agreement was submitted.
