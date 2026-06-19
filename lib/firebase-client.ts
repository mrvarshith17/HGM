/**
 * Firebase client-side configuration for real-time messaging
 * Uses Firebase Realtime Database for instant message delivery
 */

import { initializeApp, FirebaseApp } from 'firebase/app'
import { getDatabase, Database } from 'firebase/database'

let app: FirebaseApp | null = null
let db: Database | null = null

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
}

export function getFirebaseApp(): FirebaseApp {
  if (app) {
    return app
  }

  // Validate config
  if (!firebaseConfig.projectId) {
    console.warn('Firebase config incomplete. Real-time chat may not work. Check environment variables.')
    return null as unknown as FirebaseApp
  }

  app = initializeApp(firebaseConfig)
  return app
}

export function getRealtimeDb(): Database | null {
  try {
    if (db) {
      return db
    }

    const firebaseApp = getFirebaseApp()
    if (!firebaseApp) {
      return null
    }

    db = getDatabase(firebaseApp)
    return db
  } catch (error) {
    console.error('Failed to initialize Realtime Database:', error)
    return null
  }
}

export function isRealtimeDbConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
}
