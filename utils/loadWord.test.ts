import { describe, expect, jest, mock, test } from "bun:test"

import {
  type ChannelManager,
  type Client,
  type GuildMember,
  type Message,
  type TextChannel,
  type User
} from "discord.js"

import { fake } from "@nano-faker/patterns"
import { fullName } from "@nano-faker/person"

import { COUNT, checkWord, loadSettings, newWord, RUNNING, startWord, stopWord, WORD } from "./loadWord.ts"

describe("loadWords", (): void => {
  test("loadSettings - no client", async (): Promise<void> => {
    // biome-ignore lint/suspicious/noExplicitAny: for testing
    expect(loadSettings(null as any)).rejects.toThrowError("Invalid client")
  })

  test("checkWord - no client", (): void => {
    mock.module("./loadWord.ts", (): unknown => {
      return {
        WORD: "test"
      }
    })

    const message: Message = {
      content: WORD
    } as Message

    expect(checkWord(message)).rejects.toThrowError("Invalid client")
  })

  const channel: TextChannel = {
    send: jest.fn().mockResolvedValue({} as Message)
  } as unknown as TextChannel

  const channelManager: ChannelManager = {
    cache: new Map([
      [
        channel.id,
        channel
      ]
    ]),
    fetch: jest.fn().mockResolvedValue(channel)
  } as unknown as ChannelManager

  const client: Client = {
    channels: channelManager
  } as Client

  test("loadSettings", async (): Promise<void> => {
    await loadSettings(client)

    expect(COUNT).toBeGreaterThan(0)
  })

  test("loadSettings - no words", async (): Promise<void> => {
    mock.module("random-words", (): unknown => {
      return {
        count: jest.fn().mockReturnValue(0)
      }
    })

    expect(loadSettings(client)).rejects.toThrowError("No words")
  })

  test("newWord", async (): Promise<void> => {
    mock.module("random-words", (): unknown => {
      return {
        generate: jest.fn().mockReturnValue("test")
      }
    })

    await newWord()

    expect(WORD).toBe("test")
  })

  test("checkWord - no word", (): void => {
    mock.module("./loadWord.ts", (): unknown => {
      return {
        WORD: null
      }
    })

    expect(checkWord({} as Message)).rejects.toThrowError("Invalid WORD")
  })

  test("checkWord", async (): Promise<void> => {
    mock.module("./db.ts", (): unknown => {
      return {
        updatePoints: jest.fn()
      }
    })

    mock.module("./loadWord.ts", (): unknown => {
      return {
        WORD: "test"
      }
    })

    const ID_LEN: number = 19

    const message: Message = {
      channelId: fake("#".repeat(ID_LEN)),
      content: WORD,
      member: {
        user: {
          bot: false,
          displayName: fullName()
        } as User
      } as GuildMember
    } as Message

    await checkWord(message)

    expect(WORD).not.toBeNull()
  })

  test("startWord", async (): Promise<void> => {
    mock.module("./loadWord.ts", (): unknown => {
      return {
        newWord: jest.fn()
      }
    })

    await startWord()

    expect(RUNNING).toBeTrue()
  })

  test("stopWord", async (): Promise<void> => {
    await stopWord()

    expect(RUNNING).toBeFalse()
    expect(WORD).toBeNull()
  })
})
