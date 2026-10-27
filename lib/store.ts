import { mkdir, readFile, rename, writeFile } from 'fs/promises'
import path from 'path'
import { createSeed } from './seed'
import type { Database } from './types'

const filePath = path.join(process.cwd(), 'data', 'restaurant.json')

let chain: Promise<unknown> = Promise.resolve()

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = chain.then(task, task)
  chain = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

async function ensureSeed() {
  try {
    await readFile(filePath, 'utf8')
  } catch {
    await mkdir(path.dirname(filePath), { recursive: true })
    await writeFile(filePath, JSON.stringify(createSeed(), null, 2))
  }
}

async function writeDb(db: Database) {
  const temporary = `${filePath}.tmp`
  await writeFile(temporary, JSON.stringify(db, null, 2))
  await rename(temporary, filePath)
}

export function loadDb() {
  return enqueue(async () => {
    await ensureSeed()
    return JSON.parse(await readFile(filePath, 'utf8')) as Database
  })
}

export function updateDb<T>(mutator: (db: Database) => T | Promise<T>) {
  return enqueue(async () => {
    await ensureSeed()
    const db = JSON.parse(await readFile(filePath, 'utf8')) as Database
    const result = await mutator(db)
    await writeDb(db)
    return result
  })
}
