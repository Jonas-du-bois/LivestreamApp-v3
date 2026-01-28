export default defineEventHandler((event) => {
  const isProtectedPath = event.path.startsWith('/api/admin');
  const isProtectedMethod = ['PUT', 'POST', 'DELETE'].includes(event.method);

  if (isProtectedPath || isProtectedMethod) {
    const config = useRuntimeConfig();
    const authHeader = getHeader(event, 'Authorization');
    const token = authHeader?.split(' ')[1];

    if (!config.adminSecret || token !== config.adminSecret) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      });
    }
  }
});
