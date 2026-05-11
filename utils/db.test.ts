import { glob, unlink } from "node:fs/promises"

import { type Database } from "bun:sqlite"
import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test"

import { info } from "@postfmly/logger"

import { drizzle, type SQLiteBunDatabase } from "drizzle-orm/bun-sqlite"
import { EnhancedQueryLogger } from "drizzle-query-logger"
import { type FunctionsVersioning, seed } from "drizzle-seed"

import { type IUser, users } from "../db/schema.ts"
import { closeDatabase, getAll, openDatabase, resetPoints, TEST_DB, TEST_SQLITE, updatePoints } from "./db.ts"

mock.module("./db.ts", (): unknown => {
  return {
    TEST_DB: drizzle({
      client: TEST_SQLITE as Database,
      jit: true,
      logger: Bun.env.DEBUG_SQL === "true" ? new EnhancedQueryLogger() : undefined
    })
  }
})

const deleteFiles = async (): Promise<void> => {
  for await (const file of glob(`${Bun.env.DB_PATH}/${Bun.env.DB_NAME}*`)) {
    info(`Deleting ${file}`)
    await unlink(file)
  }
}

beforeAll(async (): Promise<void> => {
  await deleteFiles()
    .then(async (): Promise<void> => await openDatabase())
    .then(async (): Promise<void> => {
      await seed(TEST_DB as SQLiteBunDatabase, {
        users
      }).refine((f: FunctionsVersioning) => ({
        users: {
          columns: {
            name: f.fullName({
              isUnique: true
            }),
            points: f.int({
              isUnique: true,
              maxValue: 500,
              minValue: 100
            })
          }
        }
      }))
    })
})

afterAll(async (): Promise<void> => {
  await deleteFiles().then(async (): Promise<void> => {
    await closeDatabase()
  })
})

describe("db", (): void => {
  test("getAll", async (): Promise<void> => {
    const users: IUser[] = await getAll()
    expect(users.length).toBe(10)
    expect(users[0]!.points).toBeGreaterThan(users[9]!.points)
  })

  test("resetPoints - user", async (): Promise<void> => {
    const [user]: IUser[] = await TEST_DB!.select().from(users).limit(1)
    expect(user).not.toBeUndefined()

    await resetPoints(user!.name)

    const [updatedUser]: IUser[] = await TEST_DB!.select().from(users).limit(1)
    expect(updatedUser!.points).toBe(0)
  })

  test("updatePoints", async (): Promise<void> => {
    const [user]: IUser[] = await TEST_DB!.select().from(users).limit(1)
    expect(user).not.toBeUndefined()

    await updatePoints(user!.name)

    const [updatedUser]: IUser[] = await TEST_DB!.select().from(users).limit(1)
    expect(updatedUser!.points).toBe(Number(Bun.env.POINTS))
  })

  test("updatePoints - no name", async (): Promise<void> => {
    expect(updatePoints("")).rejects.toThrowError("Invalid name")
  })

  test("resetPoints - all", async (): Promise<void> => {
    await resetPoints()
    const [user]: IUser[] = await TEST_DB!.select().from(users).limit(1)
    expect(user!.points).toBe(0)
  })
})
