import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

export type LocalSession = {
  userId: string
  email: string
  name: string
  phone: string
  userType: 'customer' | 'salon_owner'
  profilePicture?: string
  salonId?: string
  sessionToken: string
  createdAt: string
  expiresAt: string
}

const DATA_DIR = path.join(process.cwd(), '.local-data')
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json')

async function readSessions() {
  try {
    const contents = await readFile(SESSIONS_FILE, 'utf8')
    return JSON.parse(contents) as LocalSession[]
  } catch {
    return []
  }
}

async function writeSessions(sessions: LocalSession[]) {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2))
}

export async function saveLocalSession(session: LocalSession) {
  const sessions = await readSessions()
  const nextSessions = sessions.filter((existingSession) => existingSession.userId !== session.userId)
  nextSessions.push(session)
  await writeSessions(nextSessions)
  return session
}

export async function getLocalSession(userId: string, sessionToken?: string) {
  const sessions = await readSessions()
  const session = sessions.find((existingSession) => existingSession.userId === userId)

  if (!session) {
    return null
  }

  if (sessionToken && session.sessionToken !== sessionToken) {
    return null
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await deleteLocalSession(userId)
    return null
  }

  return session
}

export async function updateLocalSession(userId: string, updates: Partial<LocalSession>) {
  const sessions = await readSessions()
  const sessionIndex = sessions.findIndex((existingSession) => existingSession.userId === userId)

  if (sessionIndex === -1) {
    return null
  }

  sessions[sessionIndex] = {
    ...sessions[sessionIndex],
    ...updates,
    userId,
  }

  await writeSessions(sessions)
  return sessions[sessionIndex]
}

export async function deleteLocalSession(userId: string) {
  const sessions = await readSessions()
  await writeSessions(sessions.filter((existingSession) => existingSession.userId !== userId))
}
