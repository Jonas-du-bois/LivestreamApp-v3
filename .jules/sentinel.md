## 2024-05-22 - Unbounded Token Hashing DoS
**Vulnerability:** `server/middleware/auth.ts` hashed the Bearer token using `sha256` without verifying its length. An attacker could send a multi-megabyte token in the `Authorization` header, causing the server to expend significant CPU time hashing it on every request, leading to Denial of Service.
**Learning:** `timingSafeEqual` prevents timing attacks on the *comparison*, but it does not protect the *hashing* step. Input validation (length limits) must happen *before* any resource-intensive operation.
**Prevention:** Always enforce strict length limits on authentication tokens and user inputs before processing them with crypto functions or complex parsers.
