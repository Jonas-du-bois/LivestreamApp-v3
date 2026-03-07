import { posix } from 'node:path';

export default defineEventHandler(async (event) => {
  // Security: Normalize path to prevent bypass (e.g. //api/admin) and handle query params
  // Fix: Decode URI components to handle %2e%2e and %2f
  let path = event.path.split('?')[0];
  try {
    path = decodeURIComponent(path);
  } catch (e) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request: Malformed URI' });
  }

  // Security: Resolve . and .. segments using node:path.posix.normalize
  // Replace backslashes with forward slashes BEFORE normalization to prevent traversal bypasses
  // Also ensure multiple slashes are collapsed
  let normalizedPath = posix.normalize(path.replace(/\\/g, '/'));

  // Standardize by removing trailing slash for accurate precise matching
  if (normalizedPath.endsWith('/') && normalizedPath.length > 1) {
    normalizedPath = normalizedPath.slice(0, -1);
  }

  // Define protected zones (exclude login endpoint)
  // Security: Use precise segment matching to avoid partial string match bypass
  const isProtectedPath = (normalizedPath === '/api/admin' || normalizedPath.startsWith('/api/admin/')) && normalizedPath !== '/api/admin/login';

  // Define public mutation endpoints
  const publicMutationPaths = [
    '/api/notifications/subscribe',
    '/api/notifications/sync',
    '/api/admin/login'
  ];

  // Currently protecting all mutations except whitelisted ones.
  const isProtectedMethod = ['PUT', 'POST', 'DELETE'].includes(event.method) && !publicMutationPaths.includes(normalizedPath);

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

    // Security: Limit token length to prevent DoS via large payload hashing
    if (token.length > 128) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: Invalid Token',
      });
    }

    if (!token || !(await verifyAdminSession(token))) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: Invalid Token',
      });
    }
  }
});
