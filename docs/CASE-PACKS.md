# Case packs and repository use

The working example is `examples/inventory.case.json`. Open it in **Your case** or run it through `node cli/rowglass.mjs check`.

| Field | Meaning |
|---|---|
| `format` | Exactly `rowglass.case.v1` |
| `id`, `title`, `contract` | Stable identifier, display title and explicit expected behavior |
| `tables` | Ordered table definitions containing named, typed columns |
| `baselineSQL` | Query being investigated |
| `referenceSQL` | Independently reviewed query that supplies expected outputs |
| `fixtures` | Named synthetic databases with a positional row array for every table |

Identifiers use lowercase letters, digits and underscores, starting with a letter; `sqlite_` names are reserved. Case and fixture IDs use lowercase letters, digits and hyphens. Unknown JSON fields are rejected. There is no arbitrary DDL upload.

Each table's first column is a non-null integer primary key. Other columns declare `integer`, `real` or `text`, optional nullability and an optional foreign-key reference to the primary key of an earlier table. Forward/cyclic references are unsupported. Primary keys must be distinct safe integers. SQLite checks foreign keys when each fixture is inserted.

Limits: 6 tables, 16 columns per table, 30 fixtures and 100 total input rows per fixture. Text values are at most 200 characters. Only one read-only SELECT/CTE is accepted per query. Binary output and blob/formatting allocation functions are unsupported. Results are compared as multisets with exact output column names. Sorting and approximate floating-point equivalence are outside this version's contract.

The reference is an assumption supplied by the case author. Execution agreement can expose disagreements but cannot prove that the reference is correct. Include a deliberately wrong query and at least one fixture that falsifies it when developing a new pack.

## CLI artifacts

`check case.json --query query.sql --out review` writes `review.json` and `review.md`. Without `--query`, the pack's baseline is checked. SQL errors count as failed checks; invalid references or fixture constraints produce a setup error. Passing finite checks exits 0, mismatches exit 1 and invalid input/setup exits 2.

`repair` requires `NEBIUS_API_KEY` and additionally writes `review.candidate.sql` and `review.patch`. The original query file is preserved. Review the evidence before applying a patch yourself. A failed candidate remains a failed review and exits 1.

`verify review.json` recomputes SHA-256 over the serialized `data` object. The digest is not a digital signature, trusted timestamp, provider attestation or proof that a recorded model call happened. It can detect changed content only when compared with a previously trusted digest. JSON object key order is part of this serialization contract.

The browser can export built-in packs, import one custom case and save one opt-in local draft. Imports are transient until saved. Forgetting the draft removes that saved browser entry. No cloud database, production data import or automatic external communication is involved.
