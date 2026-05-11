import { mkdir } from "node:fs/promises"

import { Database, SQLiteError } from "bun:sqlite"

import { info } from "@postfmly/logger"

import { desc, eq, sql } from "drizzle-orm"
import { drizzle, type SQLiteBunDatabase } from "drizzle-orm/bun-sqlite"

import { type IUser, users } from "../db/schema.ts"

let SQLITE: Database | null = null
let TEST_SQLITE: Database | null = null
let DB: SQLiteBunDatabase | null = null
const TEST_DB: SQLiteBunDatabase | null = null

Bun.env.DB_NAME = Bun.env.DB_NAME || "wordjumblebot.db"
Bun.env.DB_PATH = Bun.env.DB_PATH || "./db/"

const openDatabase = async (): Promise<void> => {
  await mkdir(Bun.env.DB_PATH, {
    recursive: true
  })

  const DB_STR: string = `${Bun.env.DB_PATH}${Bun.env.DB_NAME}`

  SQLITE = new Database(DB_STR, {
    create: true,
    strict: true
  })

  if (Bun.env.NODE_ENV === "test") {
    TEST_SQLITE = SQLITE
  }

  DB =
    TEST_DB ??
    drizzle({
      client: SQLITE,
      jit: true
    })

  DB.run(
    sql.raw(`
      PRAGMA journal_mode = WAL;
      PRAGMA wal_checkpoint(TRUNCATE);`)
  )

  try {
    await DB.select().from(users)
  } catch (e: unknown) {
    if (e instanceof SQLiteError && e.message.includes("no such table")) {
      if (Bun.env.DEBUG) {
        info("Creating tables...")
      }

      DB.run(
        sql.raw(`
          CREATE TABLE users(
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            points INTEGER NOT NULL);`)
      )
    } else {
      throw e
    }
  }

  if (Bun.env.DEBUG) {
    info(`Using database: ${DB_STR}`)
  }
}

const getPoints = async (name: string): Promise<number> => {
  if (!DB) {
    throw new Error("Database not open")
  }

  const [user]: IUser[] = await DB.select().from(users).where(eq(users.name, name)).limit(1)
  if (!user) {
    return 0
  }

  return user.points
}

const updatePoints = async (name: string): Promise<void> => {
  if (!name.length) {
    throw new Error("Invalid name")
  }

  if (!DB) {
    throw new Error("Database not open")
  }

  await DB.insert(users)
    .values({
      name: name,
      points: 1
    })
    .onConflictDoUpdate({
      target: users.name,
      set: {
        points: (await getPoints(name)) + (isNaN(Number(Bun.env.POINTS)) ? 1 : Number(Bun.env.POINTS))
      }
    })
}

const getAll = async (): Promise<IUser[]> => {
  if (!DB) {
    throw new Error("Database not open")
  }

  return await DB.select().from(users).orderBy(desc(users.points))
}

const resetPoints = async (name: string | null = null): Promise<void> => {
  if (!DB) {
    throw new Error("Database not open")
  }

  const tx = DB.update(users).set({
    points: 0
  })
  if (name) {
    tx.where(eq(users.name, name)).run()
  } else {
    tx.run()
  }
}

const closeDatabase = async (): Promise<void> => {
  SQLITE?.close()

  if (Bun.env.DEBUG) {
    info("Database closed")
  }
}

export { closeDatabase, getAll, openDatabase, resetPoints, TEST_DB, TEST_SQLITE, updatePoints }
