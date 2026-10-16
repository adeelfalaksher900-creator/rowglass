# Rowglass 0.2

A SQL repair workbench and repository CLI for developers investigating a query that runs but returns the wrong rows. Primary track: Coding and Agentic Engineering, Nebius x NVIDIA Global AI Hackathon.

The product supports three original SQLite incidents plus validated custom case packs. The cases cover a LEFT JOIN filter dropping customers, join fan-out inflating totals and NOT IN interacting with NULL. Each built-in has nine curated fixtures plus 24 repeatable generated fixtures. A separate inventory example demonstrates the custom format and CLI.

The independent reference and full fixture suite stay local. Nemotron receives the selected contract, schema, candidate SQL and bounded failure feedback. It proposes a repair and optionally a synthetic fixture. The evaluator executes the proposal before it can be applied. At most two repair calls are made per task. Challenge mode preserves the current SQL. A failing candidate cannot be applied with the UI's passing-candidate action.

The reducer deletes rows while retaining a valid mismatch and foreign-key constraints. Its output is single-row irreducible under this procedure, not globally minimum. A finite suite is not a semantic-equivalence proof. The supplied reference may itself be wrong; Rowglass cannot establish business correctness.

Browser and CLI reviews contain SQL, synthetic fixtures, results and recorded model metadata. SHA-256 identifies the serialized record but does not authenticate it. The CLI writes a patch without overwriting SQL. The browser supports one explicitly saved local draft; other edits are transient.

No production database connection, user account store or automated external message exists. Selected synthetic data is transmitted only when a model request is made. NEBIUS_API_KEY is configured outside source. No persistent application database is required, and no Supabase resource was created or modified. Public inference fails closed until a durable quota design exists.

GitHub sign-in to Nebius succeeded. Billing/provisioning setup currently blocks API key/credit use, and no actual model response has been observed. The adapter has mocked-transport coverage. Do not claim a qualified runtime, complete hackathon entry, live benchmark or production deployment from the local controls. The owner-private review build preserves its current audience. Media and final submission wait for project review.
