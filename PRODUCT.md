# Rowglass

A SQL repair workbench for developers and analytics engineers investigating a query that runs but returns the wrong rows. Primary track: Coding and Agentic Engineering, Nebius x NVIDIA Global AI Hackathon.

The first version supports three curated, original SQLite incidents: a LEFT JOIN filter dropping customers, join fan-out inflating totals, and NOT IN interacting with NULL. The independent reference query and synthetic test fixtures belong to the application, not the generating model. Nemotron receives the contract, schema, candidate SQL and bounded execution feedback, but not the reference query or evaluation suite. It proposes a patch and optionally more synthetic data. The browser runs real SQLite. At most two repair calls are made per request, with explicit review before applying a passing proposal. Challenge mode preserves the current SQL and tests a generated fixture.

The local reducer deletes rows while retaining a valid mismatch and foreign-key constraints. Its output is single-row irreducible under this procedure, not a globally minimum counterexample. A finite suite is not a semantic-equivalence proof.

No real database, cloud data warehouse, file import, user account store, external message or production SQL mutation is supported. All table data is synthetic. Live model calls send selected synthetic schema, SQL and feedback to Nebius. The only persistent backend secret is NEBIUS_API_KEY, configured outside source. The initial Site is owner-private. Public live inference needs a durable quota design and confirmed credits before release.

Current integration status: the Nebius HTTP adapter and mocked transport tests exist. A real Nebius response has not been observed. Google sign-in was stopped after the phone/device approval was rejected. Do not claim a qualified runtime, completed hackathon entry, live model results or production deployment from these local tests.
