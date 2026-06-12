import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { hashPassword } from '@/lib/password'
import { createLocalAuthUser, findLocalAuthUserByEmail } from '@/lib/local-auth-store'
import { randomUUID } from 'node:crypto'

export const runtime = 'nodejs'

type RegisterBody = {
  email?: string
  password?: string
  name?: string
  phone?: string
  userType?: 'customer' | 'salon_owner'
}

function getFirebaseErrorCode(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : ''
}

function isMissingAuthConfiguration(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  const code = getFirebaseErrorCode(error)

  return code === 'auth/configuration-not-found' ||
    message.includes('no configuration corresponding to the provided identifier')
}

export async function POST(request: NextRequest) {
  let createdFirebaseUid: string | null = null

  try {
    const { email, password, name, phone, userType } = await request.json() as RegisterBody

    if (!email || !password || !name || !phone || !userType) {
      return NextResponse.json(
        { error: 'Name, email, phone, password, and user type are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    let uid: string
    let authProvider: 'firebase' | 'local' = 'firebase'
    let passwordHash: string | undefined
    let passwordSalt: string | undefined

    try {
      const userRecord = await adminAuth.createUser({
        email: normalizedEmail,
        password,
        displayName: name,
      })

      uid = userRecord.uid
      createdFirebaseUid = userRecord.uid
    } catch (error) {
      if (!isMissingAuthConfiguration(error)) {
        throw error
      }

      const existingUser = await findLocalAuthUserByEmail(normalizedEmail)

      if (existingUser) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        )
      }

      const passwordData = hashPassword(password)
      uid = randomUUID()
      authProvider = 'local'
      passwordHash = passwordData.hash
      passwordSalt = passwordData.salt
    }

    const user = {
      uid,
      email: normalizedEmail,
      name,
      phone,
      userType,
      authProvider,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...(passwordHash && passwordSalt ? { passwordHash, passwordSalt } : {}),
    }

    if (authProvider === 'local' && passwordHash && passwordSalt) {
      const now = new Date().toISOString()

      await createLocalAuthUser({
        uid,
        email: normalizedEmail,
        name,
        phone,
        userType,
        passwordHash,
        passwordSalt,
        createdAt: now,
        updatedAt: now,
      })
    } else {
      await adminDb.collection('users').doc(uid).set(user)
    }

    return NextResponse.json({
      uid,
      email: normalizedEmail,
      name,
      phone,
      userType,
    }, { status: 201 })
  } catch (error) {
    console.error('Register route error:', error)

    if (createdFirebaseUid) {
      await adminAuth.deleteUser(createdFirebaseUid).catch((deleteError) => {
        console.error('Failed to clean up Firebase Auth user:', deleteError)
      })
    }

    if (getFirebaseErrorCode(error) === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    if (error instanceof Error && error.message === 'LOCAL_EMAIL_EXISTS') {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        error: isMissingAuthConfiguration(error)
          ? 'Firebase Authentication is not enabled for this project. Local development auth fallback could not be used.'
          : error instanceof Error ? error.message : 'Registration failed',
      },
      { status: 500 }
    )
  }
}
