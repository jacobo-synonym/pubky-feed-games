---
paths:
  - "src/**/*"
---
# Sentry Rules

Read and follow `docs/sentry.md` before editing these files.

@../../docs/sentry.md

- Do not attach raw user data to Sentry events. If an `Err.*` context includes `email`, `phone`, `phoneNumber`, `name`,
  `firstName`, `lastName`, `displayName`, `username`, `bio`, `file`, `user`, raw Pubky keys, or Pubky URLs, verify
  `src/libs/observability/sentry.ts` redacts it before merge.
