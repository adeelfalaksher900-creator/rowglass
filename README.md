# Rowglass

SQL repairs with executable counterexamples.

Rowglass investigates queries that run successfully but return the wrong rows. It executes a candidate on several small synthetic databases, compares it with an independent hand-authored reference, and reduces a mismatch to a smaller database. A Nebius Token Factory adapter asks NVIDIA Nemotron for a repair or a new adversarial fixture and can feed execution failures back for one revision.

## Current status

The local SQLite workbench is implemented and browser-tested for the reference-apply workflow. The HTTP model adapter is implemented and tested using a mocked transport. **Live Nebius inference has not been verified and this is not yet a qualified hackathon submission.** Google sign-in was stopped at device approval. There is no fallback pretending to be an AI response: live controls remain unavailable without a configured key, while the labeled hand-authored reference workflow works locally.

## Run locally

Use Node.js 24 or newer.

```sh
npm ci
npm run check
npm start
```

Open http://localhost:3000. The synthetic SQLite workflow needs no account or key.

For live generation, configure `NEBIUS_API_KEY` as a server environment variable before `npm start`. Never put a key into source, frontend code, a URL or a committed environment file. The adapter calls `https://api.tokenfactory.nebius.com/v1/chat/completions` with NVIDIA's `nvidia/nvidia-nemotron-3-nano-30b-a3b` model, as documented in the official Nebius cookbook. Use granted credits only; no dedicated GPU is created by this project.

## Try the workflow

1. Open the first case. Its original query passes the happy example but fails six edge checks.
2. Inspect the missing-customer output and the reduced one-row witness.
3. Choose **Load hand-authored reference repair**. Its label explicitly says this is not a model response.
4. Review the proposed SQL and its 9/9 results, then apply it locally.
5. Open **Evaluation**. All three references pass 9/9; all nine intentionally wrong repairs are rejected.
6. With a real configured Nebius key, request a model repair. Inspect provider response ID, model, token usage and executed tests. Failures are sent back for at most one revision. No success is inferred from the model's explanation.

## What is implemented

- Three original incidents: LEFT JOIN filtering, order/item fan-out and NOT IN with NULL.
- Independent reference queries and nine fixtures per incident.
- Multiset result comparison, including duplicate counts and exact output column contract; row order is ignored.
- Primary/foreign-key validation, finite typed fixture values and a 100-row input cap.
- Single-row deletion reduction under schema constraints, with an explicit non-global-minimum limitation.
- Real SQLite in a disposable browser worker, with a timeout and a 1,000-result-row cap.
- A validated Nebius/Nemotron JSON adapter, bounded repair feedback loop, request cancellation, proposal review and JSON export.
- Explicit setup/error states. A model credential is never shipped to the browser.

## Checks and limits

`npm test` runs engine and mocked-adapter checks. `node scripts/evaluate.mjs` writes the reproducible synthetic evaluation to `docs/local-evaluation.json`. It is not a Nemotron accuracy benchmark, Spider score, production SQL audit, universal equivalence check or security certification.

The initial hosted preview is owner-private. Public, unrestricted judge access, durable inference quotas, real Nebius execution evidence and final English demo footage remain release gates. In-memory per-process throttling is not a durable public-service quota. No production database connections or user data imports are supported.

See [research](docs/RESEARCH.md), [rule mapping](docs/RULES-AUDIT.md), [validation](docs/VALIDATION.md), [product scope](PRODUCT.md) and [AI disclosure](docs/AI-DISCLOSURE.md).

## License

MIT. Third-party libraries and fonts retain their own licenses. See THIRD-PARTY-NOTICES.md.
