import { default as assert } from "node:assert/strict"
import { readdir } from "node:fs/promises"
import { default as path } from "node:path"

import { afterAll, beforeAll, describe, expect, jest, spyOn, test } from "bun:test"

import { type Optional } from "@postfmly/types"

import { fakerEN_US as fake } from "@faker-js/faker"
import {
  type APIEmbed,
  type Channel,
  ChannelType,
  type ChatInputCommandInteraction,
  type Client,
  EmbedBuilder,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  type User
} from "discord.js"
import { match } from "ts-pattern"

import { type IPoints, points } from "../../db/schema.ts"
import { author, version } from "../../package.json" with { type: "json" }
import { DB } from "../../utils/db.ts"
import { env } from "../../utils/env.ts"
import { RandomWord } from "../../utils/randomWord.ts"

interface ICommandFile {
  create: () => RESTPostAPIChatInputApplicationCommandsJSONBody
  invoke: (interaction: ChatInputCommandInteraction) => Promise<void>
}

const HEX_BASE: number = 16
const COLOR_LEN: number = 6
const decimalToHex = (c: Optional<number>): string => (c ? `#${c.toString(HEX_BASE).padStart(COLOR_LEN, "0")}` : "N/A")

const dir: string = "events/commands"

const commands: string[] = (await readdir(dir)).filter((file: string): boolean => file.endsWith(".ts"))

// * NOTE: suppress console output
spyOn(console, "info").mockImplementation((): void => undefined)

beforeAll(async (): Promise<void> => {
  DB.open()

  assert(DB.db)

  await DB.db.delete(points)

  const users: IPoints[] = Array.from(
    { length: 2 },
    (): IPoints =>
      ({
        name: fake.internet.username(),
        points: fake.number.int({ max: 100, min: 1 })
      }) satisfies IPoints
  )

  await DB.db.insert(points).values(users)

  const mockChannel = createMock<Channel>({ type: ChannelType.GuildText })

  await RandomWord.init(
    createMock<Client>({
      channels: {
        fetch: mockChannel
      }
    })
  )
})

afterAll((): void => {
  DB.close()
})

await Promise.all(
  commands.map(async (command: string): Promise<void> => {
    const { create, invoke } = (await import(`${path.join("../..", dir)}/${command}`)) satisfies ICommandFile

    const name: string = path.basename(command, ".ts")

    describe(`/${name}`, (): void => {
      test("create", (): void => {
        const c: RESTPostAPIChatInputApplicationCommandsJSONBody = create()

        expect(c.name).toBe(name)
        expect(c.description).not.toBeEmpty()
        expect(c.contexts ?? []).not.toBeEmpty()
      })

      test("invoke", async (): Promise<void> => {
        const mockDeferReply: jest.Mock = jest.fn()
        const mockEditReply: jest.Mock = jest.fn()

        const interaction = createMock<ChatInputCommandInteraction>({
          createdTimestamp: fake.date.past().getTime(),
          deferReply: mockDeferReply,
          editReply: mockEditReply,
          user: createMock<User>({
            displayName: fake.internet.displayName(),
            username: fake.internet.username()
          }),
          options: {
            getString: jest.fn().mockReturnValue("all")
          }
        })

        expect(await invoke(interaction)).toBeUndefined()

        expect(mockDeferReply).toHaveBeenCalledTimes(1)
        expect(mockEditReply).toHaveBeenCalledTimes(1)

        const { calls } = mockEditReply.mock
        const payload: unknown = calls[0]?.[0]
        if (!payload || typeof payload !== "object") {
          throw new Error("Payload not found")
        }

        const isEmbed = (e: unknown): e is APIEmbed => typeof e === "object" && e !== null && !Array.isArray(e)

        let embed: APIEmbed = {}
        if ("embeds" in payload && Array.isArray(payload.embeds)) {
          const [firstEmbed] = payload.embeds
          if (!isEmbed(firstEmbed)) {
            throw new Error("Embed not found")
          }

          embed = firstEmbed
        }

        let content: string = ""
        if ("content" in payload && typeof payload.content === "string") {
          ;({ content } = payload)
        }

        match<string, void>(name)
          .with("info", (): void => {
            const { data }: { data: APIEmbed } = EmbedBuilder.from(embed)

            expect(decimalToHex(data.color)).toBe(env.COLOR)
            expect(data.author?.icon_url).toBe(env.LOGO_URL)
            expect(data.author?.name).toBe(`${env.NAME} v${version}`)
            expect(data.thumbnail?.url).toBe(env.LOGO_URL)
            expect(data.description).not.toBeEmpty()
            expect(data.footer?.text).toEndWith(author.name)
          })
          .with("leaderboard", (): void => {
            const { data }: { data: APIEmbed } = EmbedBuilder.from(embed)

            expect(decimalToHex(data.color)).toBe(env.COLOR)
            expect(data.title).not.toBeEmpty()
            expect(data.fields).not.toBeUndefined()
            expect(data.fields).not.toBeEmpty()
          })
          .with("ping", (): void => expect(content).toInclude("Pong"))
          .with("reset", (): void => expect(content).toInclude("Reset"))
          .with("status", (): void => expect(content).toInclude("Listening"))
          .with("word", (): void => expect(content).toInclude("New"))
          .otherwise((): never => {
            throw new Error(`Payload tests not found for /${name}`)
          })
      })
    })
  })
)
