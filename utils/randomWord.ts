import { info } from "@postfmly/logger"
import { type Nullable } from "@postfmly/types"

import { default as pluralize } from "@jarrodek/pluralize"
import { type Channel, type Client, type Message, MessageFlags, type TextChannel } from "discord.js"
import { caseInsensitive, createRegExp, exactly } from "magic-regexp"
import { wordList } from "random-words"
import { match, P } from "ts-pattern"
import { exhaustiveUniqueRandom } from "unique-random"

import { DB } from "./db.ts"
import { env, MAX_WORD_LEN, MIN_WORD_LEN } from "./env.ts"

interface IInput {
  readonly max: number
  readonly min: number
}

interface IOptions {
  readonly maxLength: number
  readonly minLength: number
}

interface IRandomWordBot {
  COUNT: number
  checkForWord: (message: Message) => Promise<void>
  getNewWord: () => void
  init: (client: Client) => Promise<void>
  WORD: Nullable<string>
}

class RandomWordBot implements IRandomWordBot {
  private CHANNEL!: TextChannel

  private OPTIONS: IOptions = {} as IOptions

  private WORDS: string[] = []

  private random!: ReturnType<typeof exhaustiveUniqueRandom>

  WORD!: string

  get COUNT(): number {
    return this.WORDS.length
  }

  /**
   * Generates minimum and maximum options for word
   *
   * **Rules:**
   * - `min > 0 && max > 0`:
   *   - `max < min` ➜ { minLength: `min`, maxLength: {@link MAX_WORD_LEN} }
   *   - Otherwise ➜ { minLength: `min`, maxLength: `max` }
   * - `min > 0 && max = 0` ➜ { minLength: `min`, maxLength: {@link MAX_WORD_LEN} }
   * - `min = 0 && max > 0` ➜ { minLength: {@link MIN_WORD_LEN}, maxLength: `max` }
   * - Otherwise ➜ throw {@link Error}
   * @param input *{ min, max }* as {@link IInput}, *(Range: `0 |` {@link MIN_WORD_LEN}`-`{@link MAX_WORD_LEN})*
   * @returns Minimum and maximum length options
   */
  private static getOptions(): IOptions {
    return match<IInput, IOptions>({
      max: env.MAX_LENGTH < env.MIN_LENGTH ? 0 : env.MAX_LENGTH,
      min: env.MIN_LENGTH
    } satisfies IInput)
      .with(
        { max: P.number.gt(0), min: P.number.gt(0) },
        ({ min, max }: IInput): IOptions =>
          max < min
            ? ({ maxLength: MAX_WORD_LEN, minLength: min } satisfies IOptions)
            : ({ maxLength: max, minLength: min } satisfies IOptions)
      )
      .with(
        { max: 0, min: P.number.gt(0) },
        ({ min }: IInput): IOptions => ({ maxLength: MAX_WORD_LEN, minLength: min }) satisfies IOptions
      )
      .with(
        { max: P.number.gt(0), min: 0 },
        ({ max }: IInput): IOptions => ({ maxLength: max, minLength: MIN_WORD_LEN }) satisfies IOptions
      )
      .otherwise((): never => {
        throw new Error("Min/max could not be determined")
      })
  }

  // * /word
  getNewWord(): void {
    const word: Nullable<string> = this.random ? (this.WORDS[this.random()] ?? null) : null
    if (!word) {
      throw new Error("Could not get word")
    }

    this.WORD = word

    if (env.DEBUG) {
      info(`💬 New word: ${this.WORD}`)
    }
  }

  async init(client: Client): Promise<void> {
    const channel: Nullable<Channel> = await client.channels.fetch(env.CHANNEL_ID)
    if (!channel) {
      throw new Error("Could not get channel")
    }

    this.CHANNEL = channel as TextChannel

    this.OPTIONS = RandomWordBot.getOptions()

    this.WORDS = wordList.filter(
      (word: string): boolean => word.length >= this.OPTIONS.minLength && word.length <= this.OPTIONS.maxLength
    )
    if (this.COUNT === 0) {
      throw new Error("Could not find words matching length")
    }

    this.random = exhaustiveUniqueRandom(0, this.COUNT - 1)

    this.getNewWord()

    if (env.DEBUG) {
      info(`ℹ️  Found ${pluralize("word", this.COUNT, true)}`)
    }
  }

  async checkForWord(message: Message): Promise<void> {
    if (createRegExp(exactly(this.WORD), [caseInsensitive]).test(message.content)) {
      if (!message.member || message.member.user.bot) {
        return
      }

      const points: string = pluralize("point", env.POINTS, true)

      const name: string = message.member.user.displayName

      await this.CHANNEL.send({
        content: `-# > \`${name}\` said \`${this.WORD}\`\n-# > Awarding \`${points}\``,
        flags: MessageFlags.SuppressNotifications
      })

      await DB.updatePoints(name)

      if (env.DEBUG) {
        info(`${name} said ${this.WORD} • Awarding ${points}`)
      }

      this.getNewWord()
    }
  }
}

const RandomWord: IRandomWordBot = new RandomWordBot()

export { RandomWord }
