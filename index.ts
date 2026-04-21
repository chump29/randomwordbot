import { type Client } from "discord.js"

import { loadCommands } from "./events/loadCommands.ts"
import { client, login, shutdown } from "./utils/client.ts"
import { openDatabase } from "./utils/db.ts"
import { error, info } from "./utils/logger.ts"
import { logo } from "./utils/logo.ts"
import { loadSettings, startWord } from "./utils/word.ts"

Bun.env.DEBUG = Bun.env.IS_DEBUG === "true" ? true : false

await openDatabase()
  .then(async (): Promise<void> => await loadCommands(await client()))
  .then(async (): Promise<Client> => await login())
  .then((client: Client): void => loadSettings(client))
  .then(async (): Promise<void> => await logo())
  .then((): void => info("Running..."))
  .then((): void => {
    if (Bun.env.AUTOSTART === "true") {
      startWord()
    }
  })
  .catch(async (e: unknown): Promise<void> => {
    error(e)
    await shutdown()
  })
