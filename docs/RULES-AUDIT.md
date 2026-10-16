# Nebius hackathon requirements

Sources: official [overview](https://nebiusglobalaihackathon.devpost.com/), [rules](https://nebiusglobalaihackathon.devpost.com/rules), [resources](https://nebiusglobalaihackathon.devpost.com/resources) and [FAQ](https://nebiusglobalaihackathon.devpost.com/details/faqs), reviewed 16 October 2026.

Deadline: 30 October 2026, 10:00 am PDT, which is 10:00 pm in Pakistan. Testing availability must continue through the end of judging on 15 December. A track choice cannot replace actual platform use.

| Requirement | Evidence/status |
|---|---|
| Real Nebius runtime + NVIDIA open model | Adapter targets Token Factory with a cookbook NVIDIA model ID and a configurable NVIDIA model override. GitHub login succeeded; billing/provisioning and actual inference remain pending. Confirm catalog availability before use. |
| Suitable track | Coding and Agentic Engineering: model-written SQL, SQLite execution and feedback-based tests. |
| Working demo or test build | Local workbench works without a key. Owner-private preview is not unrestricted judge access. Live public access remains pending. |
| Public licensed source and setup | Public MIT source verified at https://github.com/adeelfalaksher900-creator/rowglass with README, Node/npm setup, original synthetic fixtures and bundled-package license copies. |
| English description and feedback | Draft materials describe actual implementation and limitations. Product feedback cannot imply a successful Nebius onboarding/inference that has not occurred. |
| Public YouTube demo under three minutes | Deferred until the user reviews the enhanced project. Final video must show actual model execution on Nebius, followed by tested query outputs. Voice and 15-image gallery are also deferred. |
| Significant new work | New project created 16 October in the submission window. No repackaging of Dayweave, ClearStep or MCP Rehearsal. |
| City prize | No IRL attendance is claimed. Resources and rules/FAQ conflict on city eligibility; use the explicit rules/FAQ, which require actual attendance. |
| Tavily bonus | Not selected. No functional Tavily API call exists. |
| Eligibility, team, rights | The existing Devpost draft lists ADEEL FALAK SHER and Raouf Khalid, so submitter type is Team. Additional team residence, learning/career answers and final entrant certifications require factual confirmation. No teammate contributions or eligibility facts are invented. |

Four equally weighted criteria: technical implementation, coherent design, credible specific impact and quality of idea. The review build adds custom case packs, a repository CLI, 24 generated fixtures per built-in and review artifacts to the initial SQL workbench. Remaining weaknesses include live model evidence, unrestricted judge access, broader tasks, native narrow-screen checks and intended-user evaluation. See JUDGING-EVIDENCE.md. No numeric winning odds or invented judging scores are assigned.

The rules do not mandate Supabase. Frontend/backend hosting can be elsewhere while the required NVIDIA inference or compute runs on Nebius. This version needs no persistent application records, so no Supabase resource was changed. Adding another backend would not satisfy the Nebius requirement.

The FAQ explicitly says unsupported countries in Nebius's billing list are a provisioning gap, not a separate hackathon eligibility exclusion; it directs affected builders to Nebius. Do not select a false billing country or substitute a provider. Free Token Factory credit forms and the Builder Program are resources, not proof that credits have been granted.
