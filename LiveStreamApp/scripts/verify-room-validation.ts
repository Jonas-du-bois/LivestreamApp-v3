
import { isValidRoom } from '../server/utils/validation';

const validRooms = [
  'live-scores',
  'schedule-updates',
  'streams',
  'admin-dashboard',
  'stream-507f1f77bcf86cd799439011',
  'stream-000000000000000000000000'
];

const invalidRooms = [
  'random-room',
  'stream-invalid',
  'admin-dashboard-hack',
  'stream-507f1f77bcf86cd79943901', // too short
  'stream-507f1f77bcf86cd7994390111', // too long
  ' stream-507f1f77bcf86cd799439011', // space
  '',
  'SQL_INJECTION',
  '<script>alert(1)</script>'
];

let failed = false;

console.log('Testing Valid Rooms:');
for (const room of validRooms) {
  const result = isValidRoom(room);
  if (result) {
    console.log(`✅ ${room} -> Valid`);
  } else {
    console.error(`❌ ${room} -> Invalid (Expected Valid)`);
    failed = true;
  }
}

console.log('\nTesting Invalid Rooms:');
for (const room of invalidRooms) {
  const result = isValidRoom(room);
  if (!result) {
    console.log(`✅ ${room} -> Invalid`);
  } else {
    console.error(`❌ ${room} -> Valid (Expected Invalid)`);
    failed = true;
  }
}

if (failed) {
  console.error('\nTests FAILED');
  process.exit(1);
} else {
  console.log('\nTests PASSED');
}
