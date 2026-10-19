# Security policy

## Supported source

Security corrections target the current `main` branch. Rowglass is a development-stage project. Older commits and exported builds do not have a separate maintenance commitment.

## Report a concern

Start with a sanitized contact request in the [Rowglass issue tracker](https://github.com/adeelfalaksher900-creator/rowglass/issues). Identify the affected component and source commit, and ask the maintainer to arrange a private follow-up channel before sharing sensitive reproduction details.

The issue tracker is public. Do not post API keys, passwords, session tokens, personal records, billing details, live exploit instructions or sensitive attachments. Use synthetic data. If a credential has been exposed, revoke it through its issuer rather than copying it into a report.

This policy does not claim that GitHub private vulnerability reporting is enabled. Do not send confidential material through an unverified reporting route.

After a private channel is agreed, include the affected commit and runtime, prerequisites, a minimal synthetic reproduction, expected and observed behavior, and sanitized logs. Reports and fixes are handled on a best-effort basis without a guaranteed response or resolution deadline.

## Scope and limits

- Review the application, build and deployment controls separately. Passing development tests does not complete a formal security audit or establish production safety.
- SQLite workers have execution and output guards. These are not a complete WebAssembly memory sandbox.
- Review digests detect record changes. They are not signatures or independent proof of model provenance.
- Keep provider credentials server-side. Public keyed inference requires verified authorization, durable allowances and concurrency controls before it is enabled.
- Dependency-update pull requests require review and the applicable checks before merging.
