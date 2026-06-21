/**
 * Firebase Admin SDK
 * Falls back to localStorage-based implementations when Firebase is not available
 */

import { usersStore } from './local-data-store'
import { findLocalAuthUserByEmail, createLocalAuthUser } from './local-auth-store'

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

// Create mock adminAuth object for local storage fallback
if (usingLocalStorage || !adminAuth) {
  console.log('[Firebase Admin] Using localStorage fallback for auth operations')
  
  adminAuth = {
    createUser: async (userRecord: any) => {
      // In fallback mode, throw to trigger the local auth fallback in the calling code
      // This allows the register route to use its local auth password hashing logic
      const error: any = new Error('Firebase Auth is not configured')
      error.code = 'auth/configuration-not-found'
      throw error
    },

    getUser: async (uid: string) => {
      // Try to get from local store
      const users = usersStore.getAll()
      const user = users.find((u: any) => u.uid === uid)
      
      if (!user) {
        const error: any = new Error('User not found')
        error.code = 'auth/user-not-found'
        throw error
      }

      return {
        uid: user.uid,
        email: user.email,
        displayName: user.name || '',
      }
    },

    getUserByEmail: async (email: string) => {
      const user = await findLocalAuthUserByEmail(email.toLowerCase())
      
      if (!user) {
        const error: any = new Error('User not found')
        error.code = 'auth/user-not-found'
        throw error
      }

      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
      }
    },

    updateUser: async (uid: string, updates: any) => {
      console.log(`[LocalStorage] Updating user ${uid}:`, updates)
      // In production, this would update the auth user
      // For now, just return success
      return { uid, ...updates }
    },

    setCustomUserClaims: async (uid: string, customClaims: any) => {
      console.log(`[LocalStorage] Setting custom claims for user ${uid}:`, customClaims)
      return Promise.resolve()
    },

    deleteUser: async (uid: string) => {
      console.log(`[LocalStorage] Deleting user ${uid}`)
    },
  }
}

// Create mock adminDb object with proper Firestore-like API
if (usingLocalStorage || !adminDb) {
  console.log('[Firebase Admin] Using localStorage fallback for database operations')
  
  // Helper to create a document reference wrapper
  const createDocRef = (collectionName: string, docId: string) => {
    return {
      get: async () => {
        const data = usersStore.findById(docId) || {}
        return {
          exists: Object.keys(data).length > 0,
          data: () => data,
          id: docId,
        }
      },
      set: async (data: any) => {
        console.log(`[LocalStorage] Set ${collectionName}/${docId}:`, data)
        if (collectionName === 'users') {
          usersStore.set(docId, { uid: docId, ...data })
        }
        return { id: docId }
      },
      update: async (data: any) => {
        console.log(`[LocalStorage] Update ${collectionName}/${docId}:`, data)
        if (collectionName === 'users') {
          const existing = usersStore.findById(docId) || {}
          usersStore.set(docId, { ...existing, ...data })
        }
      },
      delete: async () => {
        console.log(`[LocalStorage] Delete ${collectionName}/${docId}`)
      },
    }
  }

  // Helper to create a query builder
  const createQuery = (collectionName: string, constraints: Array<{ field: string; operator: string; value: any }> = []) => {
    return {
      where: (field: string, operator: string, value: any) => {
        return createQuery(collectionName, [...constraints, { field, operator, value }])
      },
      limit: (n: number) => {
        return createQuery(collectionName, constraints)
      },
      get: async () => {
        const allDocs = usersStore.getAll()
        
        // Apply filters
        let filtered = allDocs
        for (const constraint of constraints) {
          filtered = filtered.filter((doc: any) => {
            const docValue = doc[constraint.field]
            switch (constraint.operator) {
              case '==':
                return docValue === constraint.value
              case '<':
                return docValue < constraint.value
              case '<=':
                return docValue <= constraint.value
              case '>':
                return docValue > constraint.value
              case '>=':
                return docValue >= constraint.value
              case '!=':
                return docValue !== constraint.value
              case 'in':
                return Array.isArray(constraint.value) && constraint.value.includes(docValue)
              case 'array-contains':
                return Array.isArray(docValue) && docValue.includes(constraint.value)
              default:
                return true
            }
          })
        }

        return {
          docs: filtered.map((data: any) => ({
            id: data.uid || data.id,
            data: () => data,
            exists: true,
          })),
          empty: filtered.length === 0,
        }
      },
    }
  }

  adminDb = {
    collection: (collectionName: string) => {
      return {
        doc: (docId: string) => createDocRef(collectionName, docId),
        add: async (data: any) => {
          const docId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          console.log(`[LocalStorage] Add to ${collectionName}:`, data)
          if (collectionName === 'users') {
            usersStore.set(docId, { ...data, uid: docId, id: docId })
          }
          return { id: docId }
        },
        where: (field: string, operator: string, value: any) => {
          return createQuery(collectionName, [{ field, operator, value }])
        },
        get: async () => {
          if (collectionName === 'users') {
            const docs = usersStore.getAll()
            return {
              docs: docs.map((data: any) => ({
                id: data.uid || data.id,
                data: () => data,
              })),
              empty: docs.length === 0,
            }
          }
          return { docs: [], empty: true }
        },
      }
    },
  }
}

export { adminAuth, adminDb }
export const usingFirebaseAdmin = !usingLocalStorage && adminAuth !== null
