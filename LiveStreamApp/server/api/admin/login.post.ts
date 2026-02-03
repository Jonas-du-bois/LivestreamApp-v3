import { createHash, timingSafeEqual } from 'node:crypto';

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

  // Prevent Timing Attack: Use constant-time comparison
  const safeCompare = (a: string, b: string) => {
    const bufA = createHash('sha256').update(a).digest();
    const bufB = createHash('sha256').update(b).digest();
    return timingSafeEqual(bufA, bufB);
  };

  const adminPassword = config.adminPassword || '';
  
  // Security: Prevent login if password is not configured
  if (!adminPassword) {
    console.error('[Security] Admin password is not configured.');
    throw createError({
      statusCode: 500,
      statusMessage: 'Server configuration error',
    });
  }

  if (!safeCompare(password, adminPassword)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid password',
    });
  }

  // Password is correct, return success with the password as token
  // (In a production app, you'd generate a proper JWT here)
  return {
    success: true,
    token: password
  };
});
