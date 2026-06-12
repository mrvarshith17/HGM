import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { adminDb } from '@/lib/firebase-admin'
import { updateLocalAuthUser } from '@/lib/local-auth-store'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'Missing file or userId' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'profiles')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save file with userId in filename
    const extension = file.name.split('.').pop()
    const filename = `${userId}-${Date.now()}.${extension}`
    const filepath = join(uploadDir, filename)

    const bytes = await file.arrayBuffer()
    await writeFile(filepath, Buffer.from(bytes))

    // Return public URL
    const profilePicture = `/uploads/profiles/${filename}`

    const localUser = await updateLocalAuthUser(userId, { profilePicture })

    if (!localUser) {
      await adminDb.collection('users').doc(userId).set(
        {
          profilePicture,
          updatedAt: new Date(),
        },
        { merge: true }
      )
    }

    return NextResponse.json({
      profilePicture,
      message: 'Profile picture uploaded successfully',
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload profile picture' },
      { status: 500 }
    )
  }
}
