import { createHash, timingSafeEqual } from 'node:crypto';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  // Security: Rate Limit (5 req/min)
  const ip = getRequestIP(event) || 'unknown';
  if (isRateLimited(`${ip}:login`, 5, 60000)) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
    });
  }

  const body = await readBody(event);
  
  const password = body?.password;
  
  // Security: Enforce strict type checking on parsed JSON body to prevent
  // DoS (TypeError exceptions) when passing objects/arrays to native crypto APIs
  if (!password || typeof password !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password must be a valid string',
    });
  }

  // Security: Limit password length to prevent DoS via hashing of large payloads
  if (password.length > 1024) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password too long',
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

  // Password is correct, generate a session token
  const token = await createAdminSession();

  return {
    success: true,
    token
  };
});
