import { beforeAll, describe, expect, jest, mock, spyOn, test } from "bun:test"

import { type Nullable } from "@postfmly/types"

import { fakerEN_US as fake } from "@faker-js/faker"
import { type Channel, ChannelType, type Client, type GuildMember, type Message, type User } from "discord.js"

import { env } from "../../utils/env.ts"
import { RandomWord } from "../../utils/randomWord.ts"

const mockUpdatePoints: jest.Mock = jest.fn()

mock.module("../../utils/db.ts", (): unknown => ({
  DB: {
    updatePoints: mockUpdatePoints
  }
}))

// * NOTE: suppress console output
spyOn(console, "info").mockImplementation((): void => undefined)

const mockSend: jest.Mock = jest.fn()

const mockChannel = createMock<Channel>({
  send: mockSend,
  type: ChannelType.GuildText
})

beforeAll(async (): Promise<void> => {
  await RandomWord.init(
    createMock<Client>({
      channels: {
        fetch: mockChannel
      }
    })
  )
})

describe("randomWord", (): void => {
  // biome-ignore lint/nursery/useLowercaseTestTitle: getter name
  test("COUNT", (): void => {
    expect(RandomWord.COUNT).toBeGreaterThan(0)
  })

  test("checkForWord", async (): Promise<void> => {
    const word: Nullable<string> = RandomWord.WORD

    expect(word).not.toBeNull()

    // * NOTE: gets around If
    const merge = <M extends object, C extends object>(m: M, c: C): M & { channel: C } =>
      Object.assign(m, { channel: c })

    const message: Message = createMock<Message>({
      content: fake.helpers.fake(`{{lorem.word}} ${RandomWord.WORD} {{lorem.word}}`),
      member: createMock<GuildMember>({
        user: createMock<User>({
          bot: false,
          displayName: fake.internet.displayName()
        })
      })
    })

    const msg = merge(message, mockChannel)

    await RandomWord.checkForWord(msg)

    expect(mockSend).toHaveBeenCalledTimes(1)

    expect(mockUpdatePoints).toHaveBeenCalledTimes(1)

    const { calls } = mockSend.mock
    const payload: unknown = calls[0]?.[0]
    if (!payload || typeof payload !== "object") {
      throw new Error("Payload not found")
    }

    if (!("content" in payload) || typeof payload.content !== "string") {
      throw new Error("Content not found")
    }

    expect(payload.content).toContain(word)
    expect(payload.content).toContain(env.POINTS.toString())

    // biome-ignore lint/style/noNonNullAssertion: exists
    expect(mockUpdatePoints).toHaveBeenCalledWith(msg.member!.user.displayName)

    expect(word).not.toBe(RandomWord.WORD)
  })
})
