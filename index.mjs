import { botConfig } from './src/config/botConfig.mjs'
import { botDefinitions } from './src/config/botDefinitions.mjs'
import { BotManager } from './src/core/BotManager.mjs'
import { createRole } from './src/core/RoleFactory.mjs'

const managers = []

for (const botDef of botDefinitions) {
    const role = createRole(botDef.role)

    const config = {
        ...botConfig,
        username: botDef.username,
        settings: botDef.settings ?? {}
    }

    const manager = new BotManager(config, role)
    managers.push(manager)

    await manager.start()
}