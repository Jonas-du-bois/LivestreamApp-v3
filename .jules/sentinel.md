## 2025-05-18 - Auth Logic Vulnerability
**Vulnerability:** Authorization middleware used `!path.endsWith('/login')` to exclude public login endpoints. This accidentally exposed nested paths like `/api/admin/users/login` (if they existed) as public.
**Learning:** Using loose matching (like `endsWith` or regex without anchors) for security exceptions is dangerous because it can match unintended paths.
**Prevention:** Always use strict equality (`path !== '/exact/path'`) or a strict allowlist for security-critical exceptions.
