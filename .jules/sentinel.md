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

## 2026-03-08 - Authorization Bypass via URL-Encoded Backslashes
**Vulnerability:** The authentication middleware decoded the URI, normalized it with `path.normalize()`, and *then* replaced backslashes with forward slashes (`replace(/\\/g, '/')`). An attacker could supply `/api/public/..%5c..%5capi/admin`, which decodes to `/api/public/..\..\api/admin`. `path.normalize()` treats `\` as normal characters on POSIX systems, leaving the path unchanged. The subsequent replacement turns it into `/api/public/../../api/admin`. This resulting path bypasses the `.startsWith('/api/admin')` check but is still routed to the admin endpoints by the underlying framework.
**Learning:** Normalization functions are platform-dependent. In a POSIX environment (like Node.js servers), backslashes are not path separators. Replacing backslashes *after* normalization defeats the purpose of normalizing `..` segments, creating a critical path traversal and authorization bypass vulnerability.
**Prevention:** Always replace backslashes with forward slashes *before* applying path normalization. Enforce a single leading slash (`'/' + path.replace(/^\/+/, '')`) to prevent double-slash bypasses (e.g. `//api/admin`), and use `path.posix.normalize` to ensure consistent cross-platform behavior.
