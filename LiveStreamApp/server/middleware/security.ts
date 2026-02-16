export default defineEventHandler((event) => {
  // Security Headers
  // HSTS: Enforce HTTPS for 1 year, including subdomains.
  setResponseHeader(event, 'Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Prevent MIME Sniffing: Force browsers to respect Content-Type
  setResponseHeader(event, 'X-Content-Type-Options', 'nosniff');

  // Clickjacking Protection: Only allow framing from same origin
  setResponseHeader(event, 'X-Frame-Options', 'SAMEORIGIN');

  // XSS Protection: Enable XSS filtering (legacy but still useful)
  setResponseHeader(event, 'X-XSS-Protection', '1; mode=block');

  // Referrer Policy: Control referrer information
  setResponseHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin');

  // Try to remove X-Powered-By (might be overridden by framework in dev mode)
  removeResponseHeader(event, 'X-Powered-By');
});
