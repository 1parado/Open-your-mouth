// Simple test for JWT and Hash functions
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

console.log('Testing JWT...');
const token = jwt.sign({ userId: '123', email: 'test@test.com' }, 'test-secret', { expiresIn: '1h' });
console.log('✅ JWT Token generated:', token.substring(0, 50) + '...');

const decoded = jwt.verify(token, 'test-secret');
console.log('✅ JWT Verified:', decoded.userId);

console.log('\nTesting Hash...');
const hash = bcrypt.hashSync('password123', 10);
console.log('✅ Hash generated:', hash.substring(0, 50) + '...');

const valid = bcrypt.compareSync('password123', hash);
console.log('✅ Password valid:', valid);

console.log('\nAll core functions work!');