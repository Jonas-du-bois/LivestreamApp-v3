## 2024-05-26 - Unprotected Database Seeding Endpoint
**Vulnerability:** The `/api/seed` endpoint was a `GET` request accessible without authentication. This endpoint clears all database collections (`deleteMany({})`), leading to complete data loss if accessed in production.
**Learning:** Utility endpoints (seeding, maintenance) created during development often lack security controls because they are seen as "dev tools". Placing them in the root API namespace makes them public by default.
**Prevention:** 1. Place administrative/destructive endpoints under a protected namespace (e.g., `/api/admin`). 2. Use `POST` or `DELETE` for state-changing operations to align with standard middleware protections. 3. Explicitly disable such endpoints in production or require strong authentication.
