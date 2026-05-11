import { parse } from "node:path"

import {
  type ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder
} from "discord.js"

import pluralize from "pluralize"

import { WORD } from "../../utils/loadWord.ts"

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody => {
  return new SlashCommandBuilder()
    .setName(parse(import.meta.file).name)
    .setDescription("Show status")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON()
}

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  let content: string = `-# > ❌ ${Bun.env.NAME} is not running`
  if (WORD) {
    const points: number = isNaN(Number(Bun.env.POINTS)) ? 1 : Number(Bun.env.POINTS)
    content = `-# > 💬 Listening for \`${WORD}\` worth ${pluralize("point", points, true)}`
  }

  await interaction.reply({
    content: content,
    flags: MessageFlags.Ephemeral
  })
}

export { create, invoke }
