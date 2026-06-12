import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import serviceAccount from '@/firebase-key.json'
import { getConfiguredDb, hasMongoUri } from './mongo-firestore-adapter'

function getServiceAccount() {
  const serviceAccountJson = process.env.GCP_SERVICE_ACCOUNT

  if (serviceAccountJson) {
    try {
      return JSON.parse(serviceAccountJson)
    } catch {
      console.warn('GCP_SERVICE_ACCOUNT is not valid JSON. Falling back to firebase-key.json.')
    }
  }

  return serviceAccount
}

if (!getApps().length) {
  initializeApp({
    credential: cert(getServiceAccount() as ServiceAccount),
  })
}

export const adminAuth = getAuth()
export const adminDb = hasMongoUri() ? getConfiguredDb() : getFirestore()
