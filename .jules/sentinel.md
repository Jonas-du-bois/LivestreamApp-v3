## 2025-05-20 - Missing Socket.io Room Validation
**Vulnerability:** Socket.io room joining was completely unrestricted, allowing clients to join any room (DoS/Snooping risk), despite documentation claiming validation existed.
**Learning:** Documentation/Memory can drift from code reality. A "phantom security control" (believed to exist but missing) is dangerous because it creates false confidence.
**Prevention:** Always verify security controls in the actual code, even if documentation/architecture docs claim they exist. Implement explicit validation on all socket inputs.

## 2025-05-20 - Global Shared Rate Limiting
**Vulnerability:** The rate limiting implementation used a single global key (IP address) for all endpoints, meaning a user triggering one action could be blocked from another unrelated action, and it lacked granularity for different risk levels (e.g., login vs sync).
**Learning:** Simple utility functions often lack the nuance needed for complex apps. Security controls need context (scope) to be effective without hurting UX.
**Prevention:** Use scoped keys (e.g., `ip:action`) for rate limiting to isolate different functional areas and allow tuning limits per endpoint.

## 2025-05-20 - Phantom Security Headers
**Vulnerability:** The application was missing standard security headers (HSTS, X-Content-Type-Options, etc.), despite project documentation/memory claiming a dedicated middleware existed.
**Learning:** "Phantom Security Controls" are a specific class of risk where a team *believes* a control exists because it was discussed or documented, but it was never implemented or was lost during refactoring.
**Prevention:** Use automated security scanning (e.g., OWASP ZAP, or simple curl checks in CI) to verify the *presence* of headers, rather than relying on code existence assumptions.
