export default defineEventHandler((event) => {
  const isProtectedPath = event.path.startsWith('/api/admin');
  const isProtectedMethod = ['PUT', 'POST', 'DELETE'].includes(event.method);

  if (isProtectedPath || isProtectedMethod) {
    const config = useRuntimeConfig();
    const authHeader = getHeader(event, 'Authorization');

    let token = authHeader || '';
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    if (token !== config.adminPassword) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      });
    }
  }
});
