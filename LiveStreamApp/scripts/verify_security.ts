import { generateAdminToken, verifyAdminToken, verifyPassword } from '../server/utils/security';
import { strict as assert } from 'assert';

console.log('Running security verification...');

const password = 'mySecretPassword123';
const wrongPassword = 'wrongPassword';

// Test 1: Verify Password
console.log('Test 1: verifyPassword');
assert.equal(verifyPassword(password, password), true, 'Password should match itself');
assert.equal(verifyPassword(password, wrongPassword), false, 'Password should not match wrong password');
console.log('✅ verifyPassword passed');

// Test 2: Generate Token
console.log('Test 2: generateAdminToken');
const token = generateAdminToken(password);
assert.ok(token, 'Token should be generated');
assert.equal(token.length, 64, 'Token should be SHA-256 hex (64 chars)');
console.log(`Token: ${token}`);
console.log('✅ generateAdminToken passed');

// Test 3: Verify Token
console.log('Test 3: verifyAdminToken');
assert.equal(verifyAdminToken(token, password), true, 'Token should match password');
assert.equal(verifyAdminToken(token, wrongPassword), false, 'Token should not match wrong password');
assert.equal(verifyAdminToken('invalidToken', password), false, 'Invalid token should not match');
console.log('✅ verifyAdminToken passed');

console.log('🎉 All security checks passed!');
