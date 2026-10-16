# Rowglass interaction contract

Business evidence: PRODUCT.md, server/api.mjs schemas, src/engine.mjs invariants, docs/RULES-AUDIT.md. DESIGN.md owns visual decisions.

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Form | Query editor and testQuery | PRODUCT.md; readOnlySql | Read-only SQL | engine tests and native browser |
| Scrollbar | Global src/style.css | DESIGN.md | bounded code/table overflow | static audit and browser |
| Toast | Main live status plus persistent notice/alert | PRODUCT.md | pending, error, success | native browser |
| Table | DataTable/Output | engine result schema | result/fixture | native browser and engine tests |

No table selection, select/listbox, date control, CRUD account flow, deletion or payment is implemented. Case buttons select among three predefined workflows.

Run tests preserves entered SQL on error. Editing invalidates evidence and clears a pending candidate. Case changes clear old query, model proposal and fixtures. Busy actions prevent duplicate submission. Model requests abort on cancellation and use generation IDs to ignore stale replies. Browser SQL runs in a disposable worker, with an eight-second termination limit. Public live inference remains disabled pending durable quotas.

Model repair runs no more than twice. Generated fixtures must validate before they count. Reference repairs are explicitly labeled hand-authored. Apply is disabled for failing/unfinished proposals. Apply changes the local editor only. Export downloads the exact current query, suite results, candidate and provider provenance. No automated send or production mutation occurs.

Route view/case selections are kept in URL parameters; query text is transient and is not put in a URL or persistent browser storage. The editor is an exploratory scratchpad; reloading discards edits. All synthetic fixtures are under 100 rows; visible result tables show at most 40 rows, and SQL result collection is capped at 1,000 rows.

Locale is English. Native semantic buttons, labels, tables, details, live status and focus-visible styles are the accessibility baseline. SQL textarea height is sufficient and it scrolls; resize is disabled deliberately. Native browser, narrow viewport and failure coverage are recorded as observed, not inferred from the static audit.
