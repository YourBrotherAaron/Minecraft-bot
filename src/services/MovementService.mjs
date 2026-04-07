import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { Movements, goals } = require('mineflayer-pathfinder')
const { GoalNear } = goals

export class MovementService {
    constructor(ctx) {
        this.ctx = ctx
        this.movements = null
    }

    ensureReady() {
        const bot = this.ctx.bot

        if (!bot.pathfinder) {
            throw new Error('Pathfinder plugin is not loaded')
        }

        if (!this.movements) {
            this.movements = new Movements(bot)
            this.movements.canDig = false
            this.movements.allow1by1towers = false
            bot.pathfinder.setMovements(this.movements)
        }
    }

    async goNear(position, range = 1) {
        const bot = this.ctx.bot

        this.ensureReady()

        await bot.pathfinder.goto(
            new GoalNear(position.x, position.y, position.z, range)
        )
    }
}