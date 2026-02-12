## 2025-05-20 - Missing Socket.io Room Validation
**Vulnerability:** Socket.io room joining was completely unrestricted, allowing clients to join any room (DoS/Snooping risk), despite documentation claiming validation existed.
**Learning:** Documentation/Memory can drift from code reality. A "phantom security control" (believed to exist but missing) is dangerous because it creates false confidence.
**Prevention:** Always verify security controls in the actual code, even if documentation/architecture docs claim they exist. Implement explicit validation on all socket inputs.

## 2025-05-21 - Raw Password Exposure in Auth Token
**Vulnerability:** The admin login endpoint returned the raw password as the authentication token, and middleware verified it by direct comparison.
**Learning:** Security shortcuts (like "just use the password as the token for now") often become permanent vulnerabilities if not flagged. A comment acknowledging a vulnerability (`// In a production app...`) is not a mitigation and provides a roadmap for attackers.
**Prevention:** Never return raw credentials in API responses. Use hashing or proper token issuance (JWT/Session) from day one, even for simple auth systems, to prevent credential leakage.
