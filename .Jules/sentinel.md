## 2024-05-26 - Unprotected Database Seeding Endpoint
**Vulnerability:** The `/api/seed` endpoint was a `GET` request accessible without authentication. This endpoint clears all database collections (`deleteMany({})`), leading to complete data loss if accessed in production.
**Learning:** Utility endpoints (seeding, maintenance) created during development often lack security controls because they are seen as "dev tools". Placing them in the root API namespace makes them public by default.
**Prevention:** 1. Place administrative/destructive endpoints under a protected namespace (e.g., `/api/admin`). 2. Use `POST` or `DELETE` for state-changing operations to align with standard middleware protections. 3. Explicitly disable such endpoints in production or require strong authentication.

## 2026-02-02 - Admin Auth Rate Limiting & Spoofing
**Vulnerability:** The admin login endpoint lacked rate limiting (Brute Force risk) and blindly trusted `X-Forwarded-For` headers (IP Spoofing risk). Additionally, a missing server password configuration could allow login with an empty password.
**Learning:** Default helper functions like `getRequestIP` can be dangerous if their default behaviors (or simple configurations like `xForwardedFor: true`) are used without understanding the deployment environment (proxies vs direct). In-memory rate limiters must implement cleanup to prevent memory leaks.
**Prevention:** 1. Implement rate limiting on sensitive auth endpoints. 2. Do not trust `X-Forwarded-For` unless behind a verified trusted proxy. 3. Validate critical security configuration (like passwords) on startup or use.

## 2026-02-02 - Unrestricted Socket Room Joining
**Vulnerability:** The Socket.io server allowed any client to join any room by emitting `join-room` with an arbitrary string. This could lead to resource exhaustion (DoS) or potential unauthorized access to future private rooms.
**Learning:** Default Socket.io event handlers often trust client input blindly. Explicit validation of room names against an allowlist is necessary to enforce security boundaries in real-time applications.
**Prevention:** Implement a server-side validation function (`isValidRoom`) in the `join-room` handler that checks against a strict whitelist of allowed room names and patterns.
