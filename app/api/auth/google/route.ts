import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { adminDb } from '@/lib/firebase-admin'
import { findLocalAuthUserByEmail, updateLocalAuthUser } from '@/lib/local-auth-store'

export const runtime = 'nodejs'

type GoogleAuthBody = {
  credential?: string
  mode?: 'login' | 'signup'
  name?: string
  phone?: string
  userType?: 'customer' | 'salon_owner'
}

type StoredUser = {
  uid?: string
  email?: string
  name?: string
  phone?: string
  userType?: 'customer' | 'salon_owner'
  profilePicture?: string | null
  authProvider?: string
}

function getGoogleClientId() {
  return process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
}

function isVerifiedEmail(value: unknown) {
  return value === true || value === 'true'
}

function toAuthResponse(uid: string, user: StoredUser) {
  return {
    uid,
    email: user.email || '',
    name: user.name || '',
    phone: user.phone || '',
    userType: user.userType || 'customer',
    profilePicture: user.profilePicture || undefined,
  }
}

async function findStoredUserByEmail(email: string) {
  const snapshot = await adminDb
    .collection('users')
    .where('email', '==', email)
    .limit(1)
    .get()

  if (snapshot.empty) {
    return null
  }

  const doc = snapshot.docs[0]
  return {
    id: doc.id,
    data: doc.data() as StoredUser,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as GoogleAuthBody
    const clientId = getGoogleClientId()

    if (!clientId) {
      return NextResponse.json(
        { error: 'Google login is not configured. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID.' },
        { status: 500 }
      )
    }

    if (!body.credential) {
      return NextResponse.json(
        { error: 'Missing Google credential' },
        { status: 400 }
      )
    }

    const client = new OAuth2Client(clientId)
    const ticket = await client.verifyIdToken({
      idToken: body.credential,
      audience: clientId,
    })
    const payload = ticket.getPayload()

    if (!payload?.sub || !payload.email || !isVerifiedEmail(payload.email_verified)) {
      return NextResponse.json(
        { error: 'Google account could not be verified' },
        { status: 401 }
      )
    }

    const normalizedEmail = payload.email.toLowerCase().trim()
    const profilePicture = payload.picture || undefined
    const googleName = body.name?.trim() || payload.name || normalizedEmail.split('@')[0]
    const localUser = await findLocalAuthUserByEmail(normalizedEmail)

    if (localUser) {
      const updatedUser = await updateLocalAuthUser(localUser.uid, {
        name: localUser.name || googleName,
        profilePicture: profilePicture || localUser.profilePicture,
      })

      return NextResponse.json(toAuthResponse(localUser.uid, updatedUser || localUser))
    }

    const existingUser = await findStoredUserByEmail(normalizedEmail)

    if (existingUser) {
      const updateData = {
        name: existingUser.data.name || googleName,
        profilePicture: existingUser.data.profilePicture || profilePicture || null,
        googleSub: payload.sub,
        authProvider: existingUser.data.authProvider || 'google',
        updatedAt: new Date(),
      }

      await adminDb.collection('users').doc(existingUser.id).update(updateData)

      return NextResponse.json(toAuthResponse(existingUser.id, {
        ...existingUser.data,
        ...updateData,
      }))
    }

    if (body.mode !== 'signup') {
      return NextResponse.json(
        { error: 'No account found for this Google email. Please sign up first.' },
        { status: 404 }
      )
    }

    if (!body.phone?.trim() || !body.userType) {
      return NextResponse.json(
        { error: 'Phone number and account type are required for Google signup' },
        { status: 400 }
      )
    }

    const uid = `google_${payload.sub}`
    const now = new Date()
    const user = {
      uid,
      email: normalizedEmail,
      name: googleName,
      phone: body.phone.trim(),
      userType: body.userType,
      profilePicture: profilePicture || null,
      authProvider: 'google',
      googleSub: payload.sub,
      createdAt: now,
      updatedAt: now,
    }

    await adminDb.collection('users').doc(uid).set(user)

    return NextResponse.json(toAuthResponse(uid, user), { status: 201 })
  } catch (error) {
    console.error('Google auth route error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Google authentication failed' },
      { status: 500 }
    )
  }
}
