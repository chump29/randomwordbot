import { type Channel, type Client, type Message, MessageFlags, type TextChannel } from "discord.js"

import { info } from "@postfmly/logger"

import pluralize from "pluralize"
import { count, generate } from "random-words"

import { updatePoints } from "./db.ts"

let CLIENT: Client | null = null

let WORD: string | null = null

const MIN_DEFAULT: number = 3
const MAX_DEFAULT: number = 0
let MIN: number = 0
let MAX: number = 0

let COUNT: number = 0

let RUNNING: boolean = false

const loadSettings = async (client: Client): Promise<void> => {
  if (!client) {
    throw new Error("Invalid client")
  }

  CLIENT = client

  MIN = isNaN(Number(Bun.env.MIN_LENGTH)) ? MIN_DEFAULT : Number(Bun.env.MIN_LENGTH)
  MAX = isNaN(Number(Bun.env.MAX_LENGTH)) ? MAX_DEFAULT : Number(Bun.env.MAX_LENGTH)

  if (MAX < MIN) {
    MAX = MIN
  }

  COUNT = count({
    maxLength: MAX,
    minLength: MIN
  })

  if (!COUNT) {
    throw new Error("No words")
  }

  if (Bun.env.DEBUG) {
    info(`Loaded ${pluralize("word", COUNT, true)}`)
  }
}

const newWord = async (): Promise<void> => {
  WORD = generate({
    maxLength: MAX,
    minLength: MIN
  }) as string

  if (Bun.env.DEBUG) {
    info(`New word: ${WORD}`)
  }
}

const checkWord = async (message: Message): Promise<void> => {
  if (!WORD) {
    throw new Error("Invalid WORD")
  }

  if (message.content.toLowerCase().includes(WORD)) {
    if (!CLIENT) {
      throw new Error("Invalid client")
    }

    if (!message.member || message.member.user.bot) {
      return
    }

    const name: string = message.member.user.displayName

    await CLIENT.channels
      .fetch(message.channelId)
      .then(async (channel: Channel | null): Promise<void> => {
        if (!channel) {
          throw new Error("Invalid channel")
        }

        await (channel as TextChannel).send({
          content: `-# > \`${name}\` said \`${WORD}\`!`,
          flags: MessageFlags.SuppressNotifications
        })
      })
      .then(async (): Promise<void> => {
        await updatePoints(name)

        if (Bun.env.DEBUG) {
          info(`${name} said ${WORD}`)
        }
      })
      .then(async (): Promise<void> => await newWord())
  }
}

const startWord = async (): Promise<void> => {
  await newWord()
  RUNNING = true

  if (Bun.env.DEBUG) {
    info("Started")
  }
}

const stopWord = async (): Promise<void> => {
  RUNNING = false
  WORD = null

  if (Bun.env.DEBUG) {
    info("Stopped")
  }
}

export { COUNT, checkWord, loadSettings, newWord, RUNNING, startWord, stopWord, WORD }
