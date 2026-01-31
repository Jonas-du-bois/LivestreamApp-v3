export default defineEventHandler((event) => {
  // Define protected zones
  const isProtectedPath = event.path.startsWith('/api/admin');

  // Currently protecting all mutations.
  // TODO: Refine this if public POST/PUT endpoints are added later.
  const isProtectedMethod = ['PUT', 'POST', 'DELETE'].includes(event.method);

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

    if (!token || token !== config.adminPassword) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: Invalid Token',
      });
    }
  }
});
