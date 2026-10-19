# Nebius hackathon requirements

Sources: official [overview](https://nebiusglobalaihackathon.devpost.com/), [rules](https://nebiusglobalaihackathon.devpost.com/rules), [resources](https://nebiusglobalaihackathon.devpost.com/resources), [FAQ](https://nebiusglobalaihackathon.devpost.com/details/faqs), [judging guidance](https://nebiusglobalaihackathon.devpost.com/updates/46204-here-s-how-judging-works) and [submission guidance](https://nebiusglobalaihackathon.devpost.com/updates/46205-how-to-build-a-winning-project), rechecked 19 October 2026 Pakistan time. This is a readiness record, not an eligibility determination or complete-submission claim.

Submission deadline: 30 October 2026, 10:00 am PDT, which is 10:00 pm Pakistan. Judging runs 1–15 December; free testing access must continue through its end. Winners are scheduled to be announced around 11 January 2027. A track choice, polished design or mock cannot replace actual required runtime.

| Requirement | Evidence/status |
|---|---|
| Actual Nebius runtime + NVIDIA open model | Token Factory adapter targets the official API with a cookbook NVIDIA model ID and configurable NVIDIA override. GitHub authentication succeeded, but billing/provisioning still blocks key/credits. No actual inference or current catalog availability is verified. An NVIDIA model through another provider would not qualify. |
| Suitable track | Coding and Agentic Engineering. The source proposes SQL repairs, executes checks, feeds visible failures back and exports repository review/regression artifacts. The model-driven path still needs real runtime evidence. |
| Working demo or test build | Version 0.3 source implements local evaluation, reduced-case handoff and replay. The checked v0.3 preview is deployed owner-private. It is not usable unrestricted judge access. |
| Public licensed source and setup | Public repository: https://github.com/adeelfalaksher900-creator/rowglass . MIT license, setup instructions, synthetic fixtures and bundled-license notices are present. PR1 is merged. Version 0.3 source/build identity must be checked and published together. |
| English description and feedback | English draft describes implemented behavior, assumptions and unavailable runtime. Required feedback must separate documentation/mock experience from observed provider behavior. No successful onboarding, model latency or quality is invented. |
| Public YouTube demonstration under three minutes | Gated on final tested product and actual NVIDIA-on-Nebius operation. The video must show functioning software and identify the required tools audibly. The user-requested natural narration and 15 captioned images follow final verification. Fifteen images are a presentation goal, not an invented official requirement. |
| New/significantly updated work | Rowglass was created 16 October during the submission window. Version 0.3 adds replayable evidence, regression handoff, integer fidelity, a frozen evaluation protocol and optional semantic-source lookup. No unrelated project is presented as this work. |
| City prize | No IRL attendance is claimed. Resources suggest city association is enough, while official rules and FAQ require attendance. Follow the rules/FAQ and obtain clarification before claiming a city award. |
| Tavily bonus | A fixed-topic official-SQLite search adapter and UI are implemented with mocked-transport checks. No key or actual runtime call is verified. The award requires a functional runtime API call, so eligibility is not claimed. |
| Feedback award | Required feedback section is drafted factually. Completeness, viability and impact of feedback matter; no award is assumed. Add real model/service observations only after successful use. |
| Eligibility, team, rights | Existing Devpost team: ADEEL FALAK SHER and Raouf Khalid. Factual residence, age-of-majority eligibility, representation/rights and personal learning answers require confirmation. No teammate contribution or legal certification is invented. |

The four equally weighted criteria are implementation, coherent design, credible specific impact and quality of idea, after a baseline viability/track-fit gate. Organizer coding guidance favors planning, writing, testing and iteration in a real repository workflow. See [JUDGING-EVIDENCE.md](JUDGING-EVIDENCE.md). No speculative judge scores or winning probabilities are assigned.

The source supports a frozen 24-change corpus across six schemas: 18 deliberately wrong changes and six equivalent rewrites, checked using 24 independent reference checks and 96 candidate fixture checks. The one-shot versus feedback harness is implemented but has not run against live NVIDIA/Nebius inference. Offline controls are not model accuracy or proof of semantic equivalence. The trusted reference is appropriate for behavior-preserving changes; an intentional business-rule change requires reviewed new expectations.

The FAQ permits frontend and unrelated backend processing elsewhere. Supabase is not mandatory and no Supabase resource was changed. It would be justified for durable authenticated allowances or shared records, not local SQLite execution. Serverless Jobs are a useful potential batch-evaluation extension, but no AI Cloud deployment or credit grant is claimed. Token Factory promotional credits do not establish AI Cloud credits.

The FAQ explicitly identifies unsupported billing countries as a provisioning gap handled case by case through Nebius. Do not choose a false billing country or substitute another provider. Credit-form submission and Builder Program welcome email are not proof of granted credit. Provider access remains a release blocker.

Prize stacking is limited: the organizer's prize update clarifies one overall award, or one track award plus one bonus award. Adding optional services does not automatically earn additional scores or awards. The only claimed integration is the implemented, accurately labeled behavior.

Remaining gates: real runtime and returned evidence, final version deployment, current complete UI/security checks, working free judge access through December 15, accurate public source/instructions/feedback, factual entrant answers and final media. Final submission remains unready until those gates are met.


## 19 October v0.4 update

The current official FAQ explicitly rejects OpenRouter as a replacement for Nebius runtime. GitHub login to AI Cloud works, but its billing setup requires $25 and does not list Pakistan. No paid or false-residence workaround was used. A public local-only review build is published with provider routes disabled regardless of runtime environment keys. Actual NVIDIA-on-Nebius execution, a verified durable allowance gate for any live judge inference, factual entrant answers and final media remain open. Public local access is not described as live AI completion.
