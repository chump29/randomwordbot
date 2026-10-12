import { parse } from "node:path"

import pluralize from "@jarrodek/pluralize"
import {
  type ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder
} from "discord.js"

import { env } from "../../utils/env.ts"
import { RandomWord } from "../../utils/randomWord.ts"

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody =>
  new SlashCommandBuilder()
    .setName(parse(import.meta.file).name)
    .setDescription("Show status")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON()

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  await interaction.editReply({
    content: `-# > 💬 Listening for \`${RandomWord.WORD}\` worth \`${pluralize("point", env.POINTS, true)}\``
  })
}

export { create, invoke }
