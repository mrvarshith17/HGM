import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto'

const ITERATIONS = 100_000
const KEY_LENGTH = 64
const DIGEST = 'sha512'

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex')

  return { hash, salt }
}

export function verifyPassword(password: string, hash: string, salt: string) {
  const candidate = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST)
  const stored = Buffer.from(hash, 'hex')

  return stored.length === candidate.length && timingSafeEqual(stored, candidate)
}
