import { isRateLimited } from '../server/utils/rateLimit';

console.log('Testing rate limit logic...');

const ip = '127.0.0.1';

// Test 1: Default limit (5)
console.log('Test 1: Default limit (5)');
const key1 = `${ip}:default`;
for (let i = 0; i < 5; i++) {
  if (isRateLimited(key1)) {
    console.error(`Request ${i + 1} failed unexpectedly`);
    process.exit(1);
  }
}
if (!isRateLimited(key1)) {
  console.error('Request 6 should have failed but succeeded');
  process.exit(1);
}
console.log('Test 1 Passed');

// Test 2: Custom limit (2)
console.log('Test 2: Custom limit (2)');
const key2 = `${ip}:custom`;
const limit = 2;
const window = 60000;

// Using 'as any' to bypass TS check until implementation is updated
if ((isRateLimited as any)(key2, limit, window)) {
    console.error('Request 1 (custom) failed unexpectedly');
    process.exit(1);
}
if ((isRateLimited as any)(key2, limit, window)) {
    console.error('Request 2 (custom) failed unexpectedly');
    process.exit(1);
}
if (!(isRateLimited as any)(key2, limit, window)) {
    console.error('Request 3 (custom) should have failed but succeeded');
    process.exit(1);
}
console.log('Test 2 Passed');

console.log('All rate limit tests passed!');
