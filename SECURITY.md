# Security policy

## Supported version

The latest commit on `main` is the supported version of ECHO.

## Reporting a vulnerability

Please do not publish exploitable details in a public issue. Use GitHub’s [private vulnerability reporting flow](https://github.com/kyky2347/project-55xudzzt/security/advisories/new) and include:

- A concise description of the problem and its impact.
- Reproduction steps or a minimal proof of concept.
- The affected route, package, and revision when known.
- Any suggested mitigation.

ECHO is a local-first browser game with no backend, authentication, analytics pipeline, or paid API. Security reports are still relevant for dependency vulnerabilities, unsafe browser storage handling, cross-site scripting, supply-chain risk, and accidental disclosure of hidden simulation state.

## Sensitive data

Never commit credentials, access tokens, `.env` files, browser profiles, or local traces. ECHO does not require secrets for normal development or play.
