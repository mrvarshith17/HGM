#!/usr/bin/env node

console.log('[Test] Node version:', process.version);
console.log('[Test] Node path:', process.execPath);
console.log('[Test] CWD:', process.cwd());

try {
  console.log('[Test] Loading express...');
  const express = require('express');
  console.log('[Test] ✓ Express loaded');
} catch (e) {
  console.error('[Test] ✗ Express failed:', e.message);
  process.exit(1);
}

try {
  console.log('[Test] Loading cors...');
  const cors = require('cors');
  console.log('[Test] ✓ Cors loaded');
} catch (e) {
  console.error('[Test] ✗ Cors failed:', e.message);
  process.exit(1);
}

try {
  console.log('[Test] Loading firebase-admin...');
  const admin = require('firebase-admin');
  console.log('[Test] ✓ Firebase admin loaded');
} catch (e) {
  console.error('[Test] ✗ Firebase admin failed:', e.message);
  process.exit(1);
}

try {
  console.log('[Test] Loading routes/bookings...');
  const bookings = require('./routes/bookings');
  console.log('[Test] ✓ Bookings route loaded');
} catch (e) {
  console.error('[Test] ✗ Bookings route failed:', e.message);
  process.exit(1);
}

console.log('[Test] ✓ All modules loaded successfully. Now run: node server.js');
