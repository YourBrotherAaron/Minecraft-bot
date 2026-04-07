import { BaseRole } from '../core/BaseRole.mjs'
import { sleep } from '../utils/sleep.mjs'

export class FarmerRole extends BaseRole {
    constructor() {
        super('farmer')
    }

    async start(ctx) {
        await super.start(ctx)
        ctx.bot.chat('Farmer bot online')

        try {
            while (this.active && ctx.bot && ctx.bot.entity) {
                await ctx.services.farming.runFarmingCycle()
                await sleep(1000)
            }
        } catch (err) {
            if (this.active) {
                console.error(`[${this.name}] loop error: ${err.message}`)
            }
        }

    }
}