import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { verifyPassword } from '@/lib/password'
import { findLocalAuthUserByEmail } from '@/lib/local-auth-store'

export const runtime = 'nodejs'

type LoginBody = {
  email?: string
  password?: string
}

type LocalUser = {
  id: string
  uid?: string
  email?: string
  name?: string
  phone?: string
  userType?: 'customer' | 'salon_owner'
  profilePicture?: string | null
  authProvider?: string
  passwordHash?: string
  passwordSalt?: string
}

function isMissingAuthConfiguration(data: unknown) {
  if (typeof data !== 'object' || data === null || !('error' in data)) {
    return false
  }

  const error = data.error as { message?: string }
  return error.message === 'CONFIGURATION_NOT_FOUND' ||
    error.message?.includes('no configuration corresponding to the provided identifier')
}

async function findLocalUser(email: string): Promise<LocalUser | null> {
  const localAuthUser = await findLocalAuthUserByEmail(email)

  if (localAuthUser) {
    return {
      ...localAuthUser,
      id: localAuthUser.uid,
      authProvider: 'local',
    }
  }

  const snapshot = await adminDb
    .collection('users')
    .where('email', '==', email)
    .limit(1)
    .get()

  if (snapshot.empty) {
    return null
  }

  const doc = snapshot.docs[0]
  return { id: doc.id, ...doc.data() } as LocalUser
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json() as LoginBody
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    if (!apiKey) {
      const localUser = await findLocalUser(normalizedEmail)

      if (!localUser || localUser.authProvider !== 'local') {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      if (
        typeof localUser.passwordHash !== 'string' ||
        typeof localUser.passwordSalt !== 'string' ||
        !verifyPassword(password, localUser.passwordHash, localUser.passwordSalt)
      ) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      return NextResponse.json({
        uid: localUser.uid ?? localUser.id,
        email: localUser.email,
        name: localUser.name ?? '',
        phone: localUser.phone ?? '',
        userType: localUser.userType ?? 'customer',
        profilePicture: localUser.profilePicture || undefined,
      })
    }

    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizedEmail,
        password,
        returnSecureToken: true,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      const userDoc = await adminDb.collection('users').doc(data.localId).get()
      const userData = userDoc.data()

      return NextResponse.json({
        uid: data.localId,
        email: data.email,
        name: userData?.name ?? data.displayName ?? '',
        phone: userData?.phone ?? '',
        userType: userData?.userType ?? 'customer',
        profilePicture: userData?.profilePicture || undefined,
      })
    }

    if (!isMissingAuthConfiguration(data)) {
      return NextResponse.json(
        { error: data.error?.message || 'Invalid email or password' },
        { status: 401 }
      )
    }

    const localUser = await findLocalUser(normalizedEmail)

    if (
      !localUser ||
      localUser.authProvider !== 'local' ||
      typeof localUser.passwordHash !== 'string' ||
      typeof localUser.passwordSalt !== 'string' ||
      !verifyPassword(password, localUser.passwordHash, localUser.passwordSalt)
    ) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      uid: localUser.uid ?? localUser.id,
      email: localUser.email,
      name: localUser.name ?? '',
      phone: localUser.phone ?? '',
      userType: localUser.userType ?? 'customer',
      profilePicture: localUser.profilePicture || undefined,
    })
  } catch (error) {
    console.error('Login route error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Login failed' },
      { status: 500 }
    )
  }
}
