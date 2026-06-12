import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { adminDb } from '@/lib/firebase-admin'
import { updateLocalAuthUser } from '@/lib/local-auth-store'

export const runtime = 'nodejs'

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    // Delete all profile pictures for this user
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'profiles')

    if (existsSync(uploadDir)) {
      const { readdirSync } = await import('fs')
      const files = readdirSync(uploadDir)
      
      for (const file of files) {
        if (file.startsWith(userId + '-')) {
          const filepath = join(uploadDir, file)
          try {
            await unlink(filepath)
          } catch (error) {
            console.error(`Failed to delete file ${file}:`, error)
          }
        }
      }
    }

    const localUser = await updateLocalAuthUser(userId, { profilePicture: undefined })

    if (!localUser) {
      await adminDb.collection('users').doc(userId).set(
        {
          profilePicture: null,
          updatedAt: new Date(),
        },
        { merge: true }
      )
    }

    return NextResponse.json({
      message: 'Profile picture deleted successfully',
    })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete profile picture' },
      { status: 500 }
    )
  }
}
