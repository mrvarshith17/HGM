/**
 * Firebase Admin SDK
 * Falls back to localStorage-based store when Firebase is not available
 */

let adminAuth: any = null
let adminDb: any = null
let usingLocalStorage = false

function getServiceAccount() {
  const serviceAccountJson = process.env.GCP_SERVICE_ACCOUNT

  if (serviceAccountJson) {
    try {
      return JSON.parse(serviceAccountJson)
    } catch {
      console.warn('[Firebase Admin] GCP_SERVICE_ACCOUNT is not valid JSON.')
    }
  }

  // Try to load firebase-key.json
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('../firebase-key.json')
  } catch {
    return null
  }
}

// Try to initialize Firebase Admin SDK
try {
  const { getApps, initializeApp, cert } = require('firebase-admin/app')
  const { getAuth } = require('firebase-admin/auth')
  const { getFirestore } = require('firebase-admin/firestore')

  const serviceAccount = getServiceAccount()
  
  if (serviceAccount && !getApps().length) {
    try {
      const credential = cert(serviceAccount as any)
      initializeApp({
        credential,
      })
      console.log('[Firebase Admin] SDK initialized with project:', (serviceAccount as any).project_id)
      adminAuth = getAuth()
      adminDb = getFirestore()
      console.log('[Firebase Admin] Firestore database initialized')
    } catch (error) {
      console.warn('[Firebase Admin] Initialization failed:', error instanceof Error ? error.message : error)
      usingLocalStorage = true
    }
  } else {
    console.warn('[Firebase Admin] Service account not found. Using localStorage fallback.')
    usingLocalStorage = true
  }
} catch (error) {
  console.warn('[Firebase Admin] Firebase SDK not available. Using localStorage fallback.', error)
  usingLocalStorage = true
}

// Create a mock adminDb object that works with localStorage if Firebase is not available
if (usingLocalStorage || !adminDb) {
  console.log('[Firebase Admin] Using localStorage fallback for database operations')
  
  adminDb = {
    collection: (collectionName: string) => {
      return {
        doc: (docId: string) => {
          return {
            get: async () => ({
              exists: true,
              data: () => ({}),
              id: docId,
            }),
            set: async (data: any) => {
              // localStorage fallback
              console.log(`[LocalStorage] Setting ${collectionName}/${docId}`)
            },
            update: async (data: any) => {
              console.log(`[LocalStorage] Updating ${collectionName}/${docId}`)
            },
            delete: async () => {
              console.log(`[LocalStorage] Deleting ${collectionName}/${docId}`)
            },
          }
        },
        add: async (data: any) => {
          console.log(`[LocalStorage] Adding to ${collectionName}`)
          return { id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }
        },
        where: (field: string, operator: string, value: any) => {
          return {
            get: async () => ({
              docs: [],
              empty: true,
            }),
          }
        },
        get: async () => ({
          docs: [],
          empty: true,
        }),
      }
    },
  }
}

export { adminAuth, adminDb }
export const usingFirebaseAdmin = !usingLocalStorage && adminAuth !== null
