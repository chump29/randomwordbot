import { parse } from "path"

import {
  type ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder
} from "discord.js"

import { WORD } from "../../utils/loadWord.ts"
import { error } from "../../utils/logger.ts"

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody => {
  return new SlashCommandBuilder()
    .setName(parse(import.meta.file).name)
    .setDescription("Show status")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON()
}

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  await interaction
    .reply({
      content: `-# > 💬 Listening for \`${WORD.length ? WORD : "N/A"}\``,
      flags: MessageFlags.Ephemeral
    })
    .catch((e: unknown): void => {
      error(e)
      throw e
    })
}

export { create, invoke }
