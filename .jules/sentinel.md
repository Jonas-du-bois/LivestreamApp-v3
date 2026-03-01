## 2026-02-12 - Authorization Bypass via Path Traversal Logic
**Vulnerability:** The authentication middleware used `!normalizedPath.endsWith('/login')` to exclude the login endpoint from protection. This logic is flawed because it inadvertently unprotects any path ending in `/login` (e.g., `/api/admin/users/login`), allowing potential authorization bypass if such endpoints are created.
**Learning:** Avoid using loose string matching like `endsWith` for security exclusions. Path normalization and strict equality checks are crucial to prevent unintended exposure of resources.
**Prevention:** Always use strict equality (`===`) or a strict allowlist for public endpoints in authentication middleware. Do not rely on pattern matching that can be manipulated by URL construction.

## 2026-02-22 - Plaintext Session Tokens in Database
**Vulnerability:** Admin session tokens were stored in plaintext in the MongoDB `sessions` collection. If the database were compromised (e.g., via injection or backup leak), attackers could use these tokens to impersonate administrators.
**Learning:** Even high-entropy random tokens should be treated as sensitive credentials. Storing them in plaintext violates the principle of defense in depth.
**Prevention:** Always hash sensitive tokens (session IDs, API keys) before storing them in the database. Return the raw token to the client, but only verify against the stored hash.

## 2026-03-01 - Resource Exhaustion on Admin Endpoints
**Vulnerability:** Critical admin endpoints (`seed.post.ts` and `score.put.ts`) lacked rate limiting. Although authenticated, a compromised admin account or a script could exploit this to trigger Denial of Service (DoS) by repeatedly wiping the database or spamming push notifications to all users.
**Learning:** Authentication is not a substitute for rate limiting. Resource-intensive or user-impacting operations must be throttled regardless of the user's privilege level to contain damage in case of compromise or bugs.
**Prevention:** Implement strict rate limiting (e.g., 1 req/10min for destructive actions, 60 req/min for operational actions) on all sensitive endpoints.
## 2024-03-01 - [DoS via Type confusion in API body parsing]
**Vulnerability:** In Nuxt Nitro API routes, `readBody(event)` parses JSON bodies into objects. When these objects contain array or object payloads for string parameters (e.g., `password`), the parameter length property (`password.length`) can be bypassed or abused to bypass size limits. For instance, `{ "password": { "length": 10 } }` or an array `[1, 2, ... 1024]` bypasses the `password.length > 1024` check, but then throws a synchronous `TypeError [ERR_INVALID_ARG_TYPE]` when passed to Node.js native APIs like `crypto.createHash().update()`. This unhandled exception crashes the node process/thread causing a DoS.
**Learning:** `readBody(event)` does not strictly type primitive strings. Length validations on potentially complex unvalidated inputs are insufficient without an explicit type check (`typeof val === 'string'`).
**Prevention:** Always explicitly check the type of raw parameters extracted from `readBody` before operating on them, or use a schema validator (like `zod` with `readValidatedBody` or `useSafeValidatedBody`) to strictly parse and type user input.
