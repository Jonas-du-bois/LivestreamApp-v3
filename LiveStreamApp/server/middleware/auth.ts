import { createHash, timingSafeEqual } from 'node:crypto';

export default defineEventHandler((event) => {
  // Define protected zones
  const isProtectedPath = event.path.startsWith('/api/admin');

  // Define public mutation endpoints
  const publicMutationPaths = [
    '/api/notifications/subscribe',
    '/api/notifications/sync'
  ];

  // Currently protecting all mutations except whitelisted ones.
  const isProtectedMethod = ['PUT', 'POST', 'DELETE'].includes(event.method) && !publicMutationPaths.includes(event.path);

  if (isProtectedPath || isProtectedMethod) {
    const config = useRuntimeConfig();
    const authHeader = getHeader(event, 'Authorization');

    if (!authHeader) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: Missing Authorization Header',
      });
    }

    // Case-insensitive extraction of Bearer token
    // Regex matches "Bearer " (case insensitive) at start of string
    const token = authHeader.replace(/^Bearer\s+/i, '');

    // Prevent Timing Attack: Use constant-time comparison
    const safeCompare = (a: string, b: string) => {
      const bufA = createHash('sha256').update(a).digest();
      const bufB = createHash('sha256').update(b).digest();
      return timingSafeEqual(bufA, bufB);
    };

    if (!token || !safeCompare(token, config.adminPassword || '')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: Invalid Token',
      });
    }
  }
});
