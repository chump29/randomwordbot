import { type Channel, type Client, type Message, MessageFlags, type TextChannel } from "discord.js"

import { count, generate } from "random-words"

import { updatePoints } from "./db.ts"
import { info } from "./logger.ts"

let CLIENT: Client | null = null

let WORD: string = ""

let MAX: number = 0
let MIN: number = 3

let RUNNING: boolean = false

interface IOptions {
  maxLength?: number
  minLength: number
}

const getOptions = (): IOptions => {
  const options: IOptions = {
    minLength: MIN
  }
  if (MAX) {
    options.maxLength = MAX
  }
  return options
}

const loadSettings = (client: Client): void => {
  if (!client) {
    throw new Error("Invalid client")
  }

  CLIENT = client

  MAX = isNaN(Number(Bun.env.MAX_LENGTH)) ? 0 : Number(Bun.env.MAX_LENGTH)
  MIN = isNaN(Number(Bun.env.MIN_LENGTH)) ? MIN : Number(Bun.env.MIN_LENGTH)

  if (Bun.env.DEBUG) {
    info(`Loaded ${count(getOptions())} words`)
  }
}

const newWord = (): void => {
  WORD = generate(getOptions()) as string

  if (!WORD.length) {
    throw new Error("Invalid word")
  }

  if (Bun.env.DEBUG) {
    info(`New word: ${WORD}`)
  }
}

const checkWord = async (message: Message): Promise<void> => {
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
      .then((): void => newWord())
  }
}

const startWord = (): void => {
  newWord()
  RUNNING = true

  if (Bun.env.DEBUG) {
    info("Started")
  }
}

const stopWord = (): void => {
  RUNNING = false
  WORD = ""

  if (Bun.env.DEBUG) {
    info("Stopped")
  }
}

export { checkWord, loadSettings, newWord, RUNNING, startWord, stopWord, WORD }
