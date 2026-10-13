import { beforeAll, describe, expect, jest, mock, spyOn, test } from "bun:test"

import { type Nullable } from "@postfmly/types"

import { fakerEN_US as fake } from "@faker-js/faker"
import { type Channel, type ChannelManager, type Client, type GuildMember, type Message, type User } from "discord.js"

import { env } from "../../utils/env.ts"
import { RandomWord } from "../../utils/randomWord.ts"

const mockUpdatePoints: jest.Mock = jest.fn()

mock.module("../../utils/db.ts", (): unknown => ({
  DB: {
    updatePoints: mockUpdatePoints
  }
}))

const mockSend: jest.Mock = jest.fn()

const client: Client = {
  channels: {
    fetch: jest.fn().mockResolvedValue({
      send: mockSend
    } as unknown as Channel)
  } as unknown as ChannelManager
} as Client

beforeAll(async (): Promise<void> => {
  spyOn(console, "info").mockImplementation((): void => undefined) // suppress

  await RandomWord.init(client)
})

describe("randomWord", (): void => {
  test("COUNT", (): void => {
    expect(RandomWord.COUNT).toBeGreaterThan(0)
  })

  test("checkForWord", (): void => {
    const word: Nullable<string> = RandomWord.WORD

    expect(word).not.toBeNull()

    const message: Message = {
      content: fake.helpers.fake(`{{lorem.word}} ${RandomWord.WORD} {{lorem.word}}`),
      member: {
        user: {
          bot: false,
          displayName: fake.internet.displayName()
        } as User
      } as GuildMember
    } as Message

    expect(RandomWord.checkForWord(message)).resolves.toBe(undefined)

    const firstCallArgs = mockSend.mock.calls
    const payload = firstCallArgs[0]?.[0]
    if (!payload) {
      throw new Error("Payload not found")
    }

    expect(mockSend).toHaveBeenCalled()
    expect(payload.content).toContain(word)
    expect(payload.content).toContain(env.POINTS.toString())

    expect(mockUpdatePoints).toHaveBeenCalledWith(message.member?.user.displayName)

    expect(word).not.toBe(RandomWord.WORD)
  })
})
