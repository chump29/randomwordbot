import { parse } from "path"

import {
  type ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder
} from "discord.js"

import { error } from "../../utils/logger.ts"
import { newWord, RUNNING, WORD } from "../../utils/word.ts"

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody => {
  return new SlashCommandBuilder()
    .setName(parse(import.meta.file).name)
    .setDescription("Generate new word")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON()
}

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  if (!RUNNING) {
    await interaction
      .reply({
        content: `-# > ❌ ${Bun.env.NAME} is not started`,
        flags: MessageFlags.Ephemeral
      })
      .catch((e: unknown): void => {
        error(e)
        throw e
      })
    return
  }

  newWord()

  await interaction
    .reply({
      content: `-# > 💬 New word: \`${WORD}\``,
      flags: MessageFlags.Ephemeral
    })
    .catch((e: unknown): void => {
      error(e)
      throw e
    })
}

export { create, invoke }
