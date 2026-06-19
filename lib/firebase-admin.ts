import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import serviceAccount from '@/firebase-key.json'

function getServiceAccount() {
  const serviceAccountJson = process.env.GCP_SERVICE_ACCOUNT

  if (serviceAccountJson) {
    try {
      return JSON.parse(serviceAccountJson)
    } catch {
      console.warn('[Firebase] GCP_SERVICE_ACCOUNT is not valid JSON. Using firebase-key.json.')
    }
  }

  return serviceAccount
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
  firestoreDb = getFirestore()
  console.log('[Firebase Admin] Firestore database initialized')
} catch (error) {
  console.error('[Firebase Admin] Failed to initialize Firestore:', error)
  throw error
}

export const adminDb = firestoreDb
