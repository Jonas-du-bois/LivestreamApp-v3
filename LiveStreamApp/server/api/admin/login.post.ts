export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  // Security: Rate Limit (5 req/min)
  const ip = getRequestIP(event) || 'unknown';
  if (isRateLimited(ip)) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
    });
  }

  const body = await readBody(event);
  
  const password = body?.password;
  
  if (!password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password is required',
    });
  }

  const adminPassword = config.adminPassword || '';
  
  // Security: Prevent login if password is not configured
  if (!adminPassword) {
    console.error('[Security] Admin password is not configured.');
    throw createError({
      statusCode: 500,
      statusMessage: 'Server configuration error',
    });
  }

  // Use centralized verification utility (auto-imported)
  if (!verifyPassword(password, adminPassword)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid password',
    });
  }

  // Return a hashed token instead of raw password
  // This prevents the password from being echoed back and stored in plaintext
  return {
    success: true,
    token: generateAdminToken(password)
  };
});
