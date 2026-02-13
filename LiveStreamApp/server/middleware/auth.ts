export default defineEventHandler((event) => {
  // Define protected zones (exclude login endpoint)
  const isProtectedPath = event.path.startsWith('/api/admin') && !event.path.endsWith('/login');

  // Define public mutation endpoints
  const publicMutationPaths = [
    '/api/notifications/subscribe',
    '/api/notifications/sync',
    '/api/admin/login'
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

    // Security: Limit token length to prevent DoS via large payload hashing
    if (token.length > 128) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: Invalid Token',
      });
    }

    if (!token || !verifyAdminSession(token)) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: Invalid Token',
      });
    }
  }
});
