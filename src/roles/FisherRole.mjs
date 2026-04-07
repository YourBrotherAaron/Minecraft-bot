import { BaseRole } from '../core/BaseRole.mjs'
import { sleep } from '../utils/sleep.mjs'

export class FisherRole extends BaseRole {
    constructor() {
        super('fisher')
    }

    async start(ctx) {
        await super.start(ctx)
        ctx.bot.chat('Fisher bot online')

        try {
            while (this.active && ctx.bot && ctx.bot.entity) {
                await ctx.services.fishing.runFishingCycle()
                await sleep(800)
            }
        } catch (err) {
            if (this.active) {
                console.error(`[${this.name}] loop error: ${err.message}`)
            }
        }
    }
}