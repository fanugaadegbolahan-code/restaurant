import { mkdir, readFile, rename, writeFile } from 'fs/promises'
import path from 'path'
import { createSeed } from './seed'
import type { Database } from './types'

const filePath = path.join(process.cwd(), 'data', 'restaurant.json')

let chain: Promise<unknown> = Promise.resolve()
let memory: Database | null = null

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = chain.then(task, task)
  chain = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

async function readDb() {
  if (memory) return memory
  try {
    return JSON.parse(await readFile(filePath, 'utf8')) as Database
  } catch {
    const seed = createSeed()
    try {
      await mkdir(path.dirname(filePath), { recursive: true })
      await writeFile(filePath, JSON.stringify(seed, null, 2))
      return seed
    } catch {
      memory = seed
      return memory
    }
  }
}

async function writeDb(db: Database) {
  if (memory) {
    memory = db
    return
  }
  const temporary = `${filePath}.tmp`
  try {
    await writeFile(temporary, JSON.stringify(db, null, 2))
    await rename(temporary, filePath)
  } catch {
    memory = db
  }
}

export function loadDb() {
  return enqueue(async () => JSON.parse(JSON.stringify(await readDb())) as Database)
}

export function updateDb<T>(mutator: (db: Database) => T | Promise<T>) {
  return enqueue(async () => {
    const db = await readDb()
    const result = await mutator(db)
    await writeDb(db)
    return result
  })
}
