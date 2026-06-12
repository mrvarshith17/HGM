import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

export type LocalAuthUser = {
  uid: string
  email: string
  name: string
  phone: string
  userType: 'customer' | 'salon_owner'
  profilePicture?: string
  passwordHash: string
  passwordSalt: string
  createdAt: string
  updatedAt: string
}

const DATA_DIR = path.join(process.cwd(), '.local-data')
const USERS_FILE = path.join(DATA_DIR, 'auth-users.json')

async function readUsers() {
  try {
    const contents = await readFile(USERS_FILE, 'utf8')
    return JSON.parse(contents) as LocalAuthUser[]
  } catch {
    return []
  }
}

async function writeUsers(users: LocalAuthUser[]) {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2))
}

export async function findLocalAuthUserByEmail(email: string) {
  const users = await readUsers()
  return users.find((user) => user.email === email) ?? null
}

export async function createLocalAuthUser(user: LocalAuthUser) {
  const users = await readUsers()

  if (users.some((existingUser) => existingUser.email === user.email)) {
    throw new Error('LOCAL_EMAIL_EXISTS')
  }

  users.push(user)
  await writeUsers(users)
}

export async function updateLocalAuthUser(
  uid: string,
  updates: Partial<Pick<LocalAuthUser, 'name' | 'phone' | 'userType' | 'profilePicture'>>
) {
  const users = await readUsers()
  const user = users.find((existingUser) => existingUser.uid === uid)

  if (!user) {
    return null
  }

  Object.assign(user, updates, { updatedAt: new Date().toISOString() })
  await writeUsers(users)
  return user
}
