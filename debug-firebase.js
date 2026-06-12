#!/usr/bin/env node

const admin = require('firebase-admin');

console.log('[Debug] admin object keys:', Object.keys(admin));
console.log('[Debug] admin.credential:', admin.credential);
console.log('[Debug] admin.apps:', admin.apps);
console.log('[Debug] typeof admin.initializeApp:', typeof admin.initializeApp);
