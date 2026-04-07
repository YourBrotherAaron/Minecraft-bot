import { botConfig } from './src/config/botConfig.mjs'
import { BotManager } from './src/core/BotManager.mjs'
import { BaseRole } from './src/core/BaseRole.mjs'
import { FarmerRole } from './src/roles/FarmerRole.mjs'

// const role = new BaseRole('idle')
const role = new FarmerRole()
const manager = new BotManager(botConfig, role)

await manager.start()