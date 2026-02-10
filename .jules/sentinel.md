## 2025-05-20 - Missing Socket.io Room Validation
**Vulnerability:** Socket.io room joining was completely unrestricted, allowing clients to join any room (DoS/Snooping risk), despite documentation claiming validation existed.
**Learning:** Documentation/Memory can drift from code reality. A "phantom security control" (believed to exist but missing) is dangerous because it creates false confidence.
**Prevention:** Always verify security controls in the actual code, even if documentation/architecture docs claim they exist. Implement explicit validation on all socket inputs.
