import mineflayer from 'mineflayer'
import { createRequire } from 'module'
import { BotContext } from './BotContext.mjs'
import { sleep } from '../utils/sleep.mjs'
import { FarmingService } from '../services/FarmingService.mjs'
import { FishingService } from '../services/FishingService.mjs'
import { MovementService } from '../services/MovementService.mjs'
import { ItemPickupService } from '../services/ItemPickupService.mjs'
import { InventoryService } from '../services/InventoryService.mjs'
import { StorageService } from '../services/StorageService.mjs'

const require = createRequire(import.meta.url)
const { createPlugin, goals } = require('@nxg-org/mineflayer-pathfinder')
const { GoalNear } = goals

const pathfinder = createPlugin()

export class BotManager {
    constructor(config, role) {
        this.config = config
        this.role = role
        this.bot = null
        this.ctx = null
    }

    async start() {
        this.bot = mineflayer.createBot(this.config)

        this.ctx = new BotContext({
            bot: this.bot,
            config: this.config,
            role: this.role,
        })

        this.ctx.services = {
            farming: new FarmingService(this.ctx),
            fishing: new FishingService(this.ctx),
            movement: new MovementService(this.ctx),
            pickup: new ItemPickupService(this.ctx),
            inventory: new InventoryService(this.ctx),
            storage: new StorageService(this.ctx),
        }

        this.registerEvents()

        this.bot.once('spawn', async () => {
            this.bot.loadPlugin(pathfinder)

            console.log(`[${this.bot.username}] spawned`)
            this.bot.physics.yawSpeed = 6000
            this.bot.physics.pitchSpeed = 6000
            this.bot.physics.autojumpCooldown = 0

            await sleep(5000)
            await this.role.start(this.ctx)
        })
    }

    registerEvents() {
        this.bot.on('login', () => {
            console.log(`[${this.bot.username}] logged in`)
        })

        this.bot.on('chat', async (username, message) => {
            if (username === this.bot.username) return
            if (message.toLowerCase() !== 'come to me') return
            if (!this.bot.pathfinder) return

            const player = this.bot.players[username]
            const entity = player?.entity

            if (!entity) {
                console.log(`[${this.bot.username}] cannot see ${username}`)
                return
            }

            try {
                console.log(
                    `[${this.bot.username}] coming to ${username} at ` +
                    `${entity.position.x.toFixed(2)}, ${entity.position.y.toFixed(2)}, ${entity.position.z.toFixed(2)}`
                )

                await this.bot.pathfinder.goto(
                    new GoalNear(
                        Math.floor(entity.position.x),
                        Math.floor(entity.position.y),
                        Math.floor(entity.position.z),
                        2
                    )
                )

                console.log(`[${this.bot.username}] reached ${username}`)
            } catch (err) {
                console.error(`[${this.bot.username}] come to me failed: ${err.message}`)
            }
        })

        this.bot.on('messagestr', async (message, messagePosition) => {
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