## 2026-02-12 - Authorization Bypass via Path Traversal Logic
**Vulnerability:** The authentication middleware used `!normalizedPath.endsWith('/login')` to exclude the login endpoint from protection. This logic is flawed because it inadvertently unprotects any path ending in `/login` (e.g., `/api/admin/users/login`), allowing potential authorization bypass if such endpoints are created.
**Learning:** Avoid using loose string matching like `endsWith` for security exclusions. Path normalization and strict equality checks are crucial to prevent unintended exposure of resources.
**Prevention:** Always use strict equality (`===`) or a strict allowlist for public endpoints in authentication middleware. Do not rely on pattern matching that can be manipulated by URL construction.

## 2026-02-22 - Plaintext Session Tokens in Database
**Vulnerability:** Admin session tokens were stored in plaintext in the MongoDB `sessions` collection. If the database were compromised (e.g., via injection or backup leak), attackers could use these tokens to impersonate administrators.
**Learning:** Even high-entropy random tokens should be treated as sensitive credentials. Storing them in plaintext violates the principle of defense in depth.
**Prevention:** Always hash sensitive tokens (session IDs, API keys) before storing them in the database. Return the raw token to the client, but only verify against the stored hash.
