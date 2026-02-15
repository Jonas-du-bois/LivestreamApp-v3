// Security: Add missing headers (Defense in Depth)
// Addresses "Phantom Security Control" finding: Documentation claimed this file existed, but it was missing.
export default defineEventHandler((event) => {
  setResponseHeader(event, 'Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  setResponseHeader(event, 'X-Content-Type-Options', 'nosniff');
  setResponseHeader(event, 'X-Frame-Options', 'SAMEORIGIN');
  setResponseHeader(event, 'X-XSS-Protection', '1; mode=block');
  setResponseHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin');

  // Remove X-Powered-By to hide tech stack details
  // Note: Nitro might reinject it later depending on config, but this is best effort in middleware
  removeResponseHeader(event, 'X-Powered-By');
});
