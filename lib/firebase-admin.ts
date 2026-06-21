import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

function getServiceAccount() {
  const serviceAccountJson = process.env.GCP_SERVICE_ACCOUNT

  if (serviceAccountJson) {
    try {
      return JSON.parse(serviceAccountJson)
    } catch {
      console.warn('[Firebase] GCP_SERVICE_ACCOUNT is not valid JSON. Using firebase-key.json.')
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../firebase-key.json')
}

// Initialize Firebase Admin SDK
if (!getApps().length) {
  try {
    const credential = cert(getServiceAccount() as ServiceAccount)
    initializeApp({
      credential,
    })
    console.log('[Firebase Admin] SDK initialized with project:', (getServiceAccount() as any).project_id)
  } catch (error) {
    console.error('[Firebase Admin] Initialization failed:', error instanceof Error ? error.message : error)
    throw error
  }
}

export const adminAuth = getAuth()

// Initialize Firestore database
let firestoreDb: any = null

try {
  // Try to get the default database first
  firestoreDb = getFirestore()
  console.log('[Firebase Admin] Firestore database initialized')
} catch (error) {
  console.error('[Firebase Admin] Failed to initialize Firestore:', error instanceof Error ? error.message : error)
  
  // If default database doesn't exist, provide helpful message
  const errorMsg = error instanceof Error ? error.message : String(error)
  if (errorMsg.includes('NOT_FOUND') || errorMsg.includes('PERMISSION_DENIED')) {
    console.error('[Firebase Admin] Firestore database not found. Please ensure:')
    console.error('1. Firestore is enabled in your Firebase Console')
    console.error('2. A default Firestore database exists')
    console.error('3. Service account has proper permissions')
  }
  
  throw error
}

export const adminDb = firestoreDb
