import { beforeAll, describe, expect, mock, spyOn, test } from "bun:test"

import { fakerEN_US as fake } from "@faker-js/faker"
import { type Channel, ChannelType, type Client, type GuildMember, type Message, type TextChannel } from "discord.js"

import { type DB } from "../../utils/db.ts"
import { env } from "../../utils/env.ts"
import { RandomWord } from "../../utils/randomWord.ts"

const mockUpdatePoints = mock<(typeof DB)["updatePoints"]>()

mock.module("../../utils/db.ts", (): unknown => ({
  DB: {
    updatePoints: mockUpdatePoints
  }
}))

// * NOTE: suppress console output
spyOn(console, "info").mockImplementation((): void => undefined)

const mockSend = mock<TextChannel["send"]>()

beforeAll(async (): Promise<void> => {
  await RandomWord.init(
    createMock<Client>({
      channels: {
        fetch: createMock<Channel>({
          send: mockSend,
          type: ChannelType.GuildText
        })
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
    const word = RandomWord.WORD

    expect(word).not.toBeNull()

    const mockMessage = createMock<Message>({
      content: fake.helpers.fake(`{{lorem.word}} ${RandomWord.WORD} {{lorem.word}}`),
      member: createMock<GuildMember>({
        user: {
          bot: false,
          displayName: fake.internet.displayName()
        }
      })
    })

    await RandomWord.checkForWord(mockMessage)

    expect(mockSend).toHaveBeenCalledOnce()

    expect(mockUpdatePoints).toHaveBeenCalledOnce()

    const payload = mockSend.mock.calls[0]?.[0]
    if (!payload || typeof payload !== "object") {
      throw new Error("Payload not found")
    }

    if (!("content" in payload) || typeof payload.content !== "string") {
      throw new Error("Content not found")
    }

    expect(payload.content).toContain(word)
    expect(payload.content).toContain(env.POINTS.toString())

    // biome-ignore lint/style/noNonNullAssertion: exists
    expect(mockUpdatePoints).toHaveBeenCalledWith(mockMessage.member!.user.displayName)

    expect(word).not.toBe(RandomWord.WORD)
  })
})
