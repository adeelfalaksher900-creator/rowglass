# Judging evidence, not predicted scores

The four criteria are equally weighted. This maps implemented behavior to reviewable evidence and records gaps without assigning speculative scores.

| Criterion | Evidence in the review build | Remaining evidence |
|---|---|---|
| Technological implementation | Real SQLite, shared browser/CLI evaluator, typed custom schemas, valid reduction, two-round generate/execute/feedback loop, bounded provider adapter, isolated execution and a verified remote CI run | A real NVIDIA response from Nebius, current model catalog confirmation and recorded tested output |
| Design | Query → failed rows → reduced database → proposed diff → executed checks → reviewed patch; setup/error/cancel states; opt-in draft controls and downloadable reviews | Real-device/touch and full accessibility checks, browser file-download confirmation and intended-user feedback |
| Potential impact | Developers can add a synthetic case pack to a repository and make a failing check return nonzero; the query file is preserved; an inventory example demonstrates use beyond the three demos | No adoption, time-saved metric or user study is claimed |
| Quality of idea | Repair review combines independent fixtures, small counterexamples, negative controls and a model that does not receive its reference oracle | This combination is a product decision, not a claim to invent SQL equivalence testing or query minimization |

The Coding and Agentic Engineering track is chosen for fit with code generation, execution, testing and revision. Reliable per-track entry counts are unavailable. Prior winners and research informed the evidence design, but do not establish winning odds.
