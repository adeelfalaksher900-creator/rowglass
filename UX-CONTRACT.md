# Rowglass interaction contract

Business evidence: PRODUCT.md, server/api.mjs schemas, src/engine.mjs invariants, docs/RULES-AUDIT.md. DESIGN.md owns visual decisions.

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Form | Query editor and testQuery | PRODUCT.md; readOnlySql | Read-only SQL | engine tests and native browser |
| Scrollbar | Global src/style.css | DESIGN.md | bounded code/table overflow | static audit and browser |
| Toast | Main live status plus persistent notice/alert | PRODUCT.md | pending, error, success | native browser |
| Table | DataTable/Output | engine result schema | result/fixture | native browser and engine tests |

No table selection, select/listbox, date control, account flow or payment is implemented. Case buttons select three built-in workflows plus one imported case. The import form validates structured synthetic JSON before opening it. Forget saved draft removes one opt-in browser storage entry; it does not delete remote data.

Run tests preserves entered SQL on error. Editing invalidates evidence and clears a pending candidate. Case changes clear old query, model proposal and fixtures. Busy actions prevent duplicate submission. Model requests abort on cancellation and use generation IDs to ignore stale replies. Browser SQL runs in a disposable worker, with an eight-second termination limit. Public live inference remains disabled pending durable quotas.

Model repair runs no more than twice. Generated fixtures must validate before they count. Reference repairs are explicitly labeled hand-authored. Apply is disabled for failing/unfinished proposals. Apply changes the local editor only. JSON export records the current query, suite results, candidate and provider metadata. Markdown and SQL patch exports use native download links, with copyable in-page text when file downloads are unavailable. Object URLs are revoked when their content changes or the link unmounts. No automated send or production mutation occurs.

Route view/case selections are kept in URL parameters. Query text is never put in a URL and is transient unless Save local draft is explicitly chosen. Restore preserves the saved SQL across case changes; the baseline effect must not overwrite it. One saved draft can be forgotten. Custom packs support up to 100 input rows per fixture; visible result tables show at most 40 rows, and SQL collection is capped at 1,000 rows, 32 columns and one million serialized characters per execution.

Locale is English. Native semantic buttons, labels, tables, details, live status and focus-visible styles are the accessibility baseline. SQL textarea height is sufficient and it scrolls; resize is disabled deliberately. Native browser, narrow viewport and failure coverage are recorded as observed, not inferred from the static audit.
