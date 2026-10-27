import { cookies } from 'next/headers'
import { connection } from 'next/server'
import type { Lang } from './i18n'
import { loadDb } from './store'
import type { Database, SessionUser } from './types'

const SESSION_COOKIE = 'massimo_session'
const LANG_COOKIE = 'massimo_lang'
const LOCATION_COOKIE = 'massimo_location'

export function toPublicUser(user: Database['users'][number]): SessionUser {
  const { passwordHash: _passwordHash, ...safe } = user
  return safe
}

export function userFromDb(db: Database, sessionId?: string) {
  if (!sessionId) return null
  const session = db.sessions.find((item) => item.id === sessionId && new Date(item.expiresAt).getTime() > Date.now())
  if (!session) return null
  const user = db.users.find((item) => item.id === session.userId)
  return user ? toPublicUser(user) : null
}

export async function getPageData() {
  await connection()
  const jar = await cookies()
  const lang: Lang = jar.get(LANG_COOKIE)?.value === 'it' ? 'it' : 'en'
  const db = await loadDb()
  const location = db.locations.find((item) => item.id === jar.get(LOCATION_COOKIE)?.value) ?? db.locations[0]
  const user = userFromDb(db, jar.get(SESSION_COOKIE)?.value)
  return { lang, db, location, user }
}

export async function getSessionUser() {
  const jar = await cookies()
  const db = await loadDb()
  return userFromDb(db, jar.get(SESSION_COOKIE)?.value)
}

export { LANG_COOKIE, LOCATION_COOKIE, SESSION_COOKIE }
