import { createHash, timingSafeEqual } from 'node:crypto';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
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
