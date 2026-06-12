/* eslint-disable @typescript-eslint/no-require-imports */
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const { getConfiguredDb, hasMongoUri } = require('./mongo-firestore-adapter');

let firebaseApp = null;
let db = null;

function initializeFirebase() {
  if (hasMongoUri()) {
    console.log('[Database Init] Using MongoDB-compatible Firestore endpoint');
    return null;
  }

  if (firebaseApp) {
    return firebaseApp;
  }

  if (!process.env.FIREBASE_PROJECT_ID) {
    throw new Error('FIREBASE_PROJECT_ID not set in environment');
  }

  // Check if Firebase is already initialized
  if (admin.getApps().length > 0) {
    firebaseApp = admin.getApps()[0];
    console.log('[Firebase Init] Using existing Firebase app');
    return firebaseApp;
  }

  const keyPath = path.join(__dirname, '../firebase-key.json');
  const serviceAccount = require(keyPath);

  firebaseApp = admin.initializeApp({
    credential: admin.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });

  console.log('[Firebase Init] Firebase app initialized');
  return firebaseApp;
}

function getDb() {
  if (hasMongoUri()) {
    return getConfiguredDb();
  }

  if (!db) {
    initializeFirebase();
    db = getFirestore();
  }
  return db;
}

module.exports = { initializeFirebase, getDb };

