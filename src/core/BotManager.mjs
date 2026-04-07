import mineflayer from 'mineflayer'
import { createRequire } from 'module'
import { BotContext } from './BotContext.mjs'
import { FarmingService } from '../services/FarmingService.mjs'
import { MovementService } from '../services/MovementService.mjs'
import { ItemPickupService } from '../services/ItemPickupService.mjs'
import { InventoryService } from '../services/InventoryService.mjs'
import { StorageService } from '../services/StorageService.mjs'

const require = createRequire(import.meta.url)
const { pathfinder } = require('mineflayer-pathfinder')

export class BotManager {
    constructor(config, role) {
        this.config = config
        this.role = role
        this.bot = null
        this.ctx = null
    }

    async start() {
        this.bot = mineflayer.createBot(this.config)
        this.bot.loadPlugin(pathfinder)

        this.ctx = new BotContext({
            bot: this.bot,
            config: this.config,
            role: this.role,
        })

        this.ctx.services = {
            farming: new FarmingService(this.ctx),
            movement: new MovementService(this.ctx),
            pickup: new ItemPickupService(this.ctx),
            inventory: new InventoryService(this.ctx),
            storage: new StorageService(this.ctx),
        }

        this.registerEvents()

        this.bot.once('spawn', async () => {
            console.log(`[${this.bot.username}] spawned`)
            await this.role.start(this.ctx)
        })
    }

    registerEvents() {
        this.bot.on('login', () => {
            console.log(`[${this.bot.username}] logged in`)
        })

        this.bot.on('messagestr', (message, messagePosition) => {
            if (messagePosition === 'chat' && message.includes('quit')) {
                this.bot.quit()
            }
        })

        this.bot.on('kicked', (reason, loggedIn) => {
            const text = typeof reason === 'string' ? reason : JSON.stringify(reason)

            if (loggedIn) {
                console.log(`[${this.bot.username}] kicked: ${text}`)
            } else {
                console.log(`[${this.bot.username}] kicked while connecting: ${text}`)
            }
        })

        this.bot.on('error', (err) => {
            console.log(`[${this.bot.username}] error: ${err.message}`)
        })

        this.bot.on('end', async () => {
            console.log(`[${this.bot.username}] disconnected`)

            try {
                await this.role.stop()
            } catch (err) {
                console.error(`[${this.bot.username}] role stop error: ${err.message}`)
            }
        })
    }
}