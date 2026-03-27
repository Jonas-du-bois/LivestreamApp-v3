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

## 2024-03-09 - SSRF and Path Authorization Bypass Prevented
**Vulnerability:**
1. SSRF vulnerability existed in the `/api/notifications/subscribe` endpoint because the URL validation for Web Push endpoints did not prevent requests to local/private network ranges (e.g., localhost, 127.0.0.1, RFC1918 IPs).
2. Authorization bypass vulnerability existed in the API middleware (`auth.ts`) because it checked `startsWith('/api/admin')` which could allow access to unauthorized endpoints like `/api/admin-panel` or bypassed via trailing slashes (`/api/admin/`).

**Learning:**
1. `z.string().url()` only validates the string format of a URL but does not prevent SSRF. Synchronous DNS resolution is challenging to implement securely and performantly in Node.js event loops, requiring best-effort synchronous IP blacklisting combined with Node's native `URL` parser to normalize IPs (e.g. bypassing regex with `0x7f.0.0.1` or `2130706433`).
2. Trailing slash normalization and precise segment matching (`=== '/api/admin' || startsWith('/api/admin/')`) is essential for robust authorization middleware to avoid partial string matching bypasses.

**Prevention:**
1. Always apply explicit SSRF protection (IP/hostname blacklisting or DNS pinning) when an application makes outbound server-to-server HTTP requests based on user-provided URLs.
2. Standardize path formats (e.g., removing trailing slashes) and use strict equality (`===`) or segment-precise `.startsWith()` logic for authentication boundaries.
