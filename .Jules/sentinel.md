## 2025-05-20 - Missing Socket.io Room Validation
**Vulnerability:** Socket.io room joining was completely unrestricted, allowing clients to join any room (DoS/Snooping risk), despite documentation claiming validation existed.
**Learning:** Documentation/Memory can drift from code reality. A "phantom security control" (believed to exist but missing) is dangerous because it creates false confidence.
**Prevention:** Always verify security controls in the actual code, even if documentation/architecture docs claim they exist. Implement explicit validation on all socket inputs.

## 2025-05-20 - Global Shared Rate Limiting
**Vulnerability:** The rate limiting implementation used a single global key (IP address) for all endpoints, meaning a user triggering one action could be blocked from another unrelated action, and it lacked granularity for different risk levels (e.g., login vs sync).
**Learning:** Simple utility functions often lack the nuance needed for complex apps. Security controls need context (scope) to be effective without hurting UX.
**Prevention:** Use scoped keys (e.g., `ip:action`) for rate limiting to isolate different functional areas and allow tuning limits per endpoint.

## 2025-05-20 - Authentication Bypass via Path Normalization
**Vulnerability:** The authentication middleware relied on `event.path.startsWith('/api/admin')` without normalization, allowing attackers to bypass protection using double slashes (e.g., `//api/admin`). It also incorrectly handled query parameters, leading to functional bugs.
**Learning:** Relying on raw request paths for security decisions is brittle. Frameworks (like Nitro/H3) may expose raw paths that differ from what routing logic uses.
**Prevention:** Always normalize paths (collapse slashes, strip query strings) before using them in security checks or allowlists.

## 2025-05-20 - Error Message Leakage
**Vulnerability:** API endpoints `details.get.ts` and `stream.get.ts` were returning raw error messages to the client, potentially exposing stack traces or database internals.
**Learning:** Using `err.message` in production error responses is a common anti-pattern that can aid attackers in reconnaissance.
**Prevention:** Always sanitize error messages at the API boundary. Log the full error server-side, but return a generic "Internal Server Error" to the client.
