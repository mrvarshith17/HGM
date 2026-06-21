/**
 * Firebase client-side configuration for real-time messaging
 * Falls back to localStorage when Firebase is not configured
 */

let app: any = null
let db: any = null
let usingLocalStorage = false

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
}

export function getFirebaseApp(): any {
  if (app) {
    return app
  }

  // Check if Firebase config is available
  if (!firebaseConfig.projectId) {
    console.warn('[Firebase Client] Config incomplete. Using localStorage fallback.')
    usingLocalStorage = true
    return null
  }

  try {
    const { initializeApp } = require('firebase/app')
    app = initializeApp(firebaseConfig)
    return app
  } catch (error) {
    console.warn('[Firebase Client] Initialization failed, using localStorage fallback:', error)
    usingLocalStorage = true
    return null
  }
}

export function getRealtimeDb(): any {
  if (usingLocalStorage) {
    return null
  }

  try {
    if (db) {
      return db
    }

    const firebaseApp = getFirebaseApp()
    if (!firebaseApp) {
      return null
    }

    const { getDatabase } = require('firebase/database')
    db = getDatabase(firebaseApp)
    return db
  } catch (error) {
    console.error('[Firebase Client] Failed to initialize Realtime Database:', error)
    return null
  }
}

export function isRealtimeDbConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL && !usingLocalStorage
}

export function isUsingLocalStorage(): boolean {
  return usingLocalStorage
}
