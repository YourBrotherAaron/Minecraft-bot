import { sleep } from '../utils/sleep.mjs'

export class FishingService {
    constructor(ctx) {
        this.ctx = ctx
        this.busy = false
    }

    async runFishingCycle() {
        if (this.busy) return
        this.busy = true

        try {
            const rod = this.findFishingRod()

            if (!rod) {
                console.log('[fishing] no fishing rod found in inventory')
                return
            }

            const waterBlock = this.findFishingWater()

            if (!waterBlock) {
                console.log('[fishing] no suitable water found nearby')
                return
            }

            await this.goToFishingSpot(waterBlock)
            await this.lookAtFishingSpot(waterBlock)

            await this.ctx.bot.equip(rod, 'hand')
            console.log('[fishing] casting line')
            
            await this.ctx.bot.fish()
            console.log('[fishing] caught something')

            await sleep(500)
        } catch (err) {
            console.log(`[fishing] runFishingCycle error: ${err.message}`)
        }finally {
            this.busy = false
        }
    }

    findFishingRod() {
        return this.ctx.services.inventory.findItemByName('fishing_rod')
    }

    findFishingWater() {
        const bot = this.ctx.bot

        const positions = bot.findBlocks({
            maxDistance: 16,
            count: 20,
            matching: (block) => {
                if (!block) return false
                return block.name === 'water'
            }
        })

        for (const pos of positions) {
            const block = bot.blockAt(pos)
            if (!block) continue
            if (!block.position) continue
            
            return block
        }

        return null
    }

    async goToFishingSpot(waterBlock) {
        await this.ctx.services.movement.goNear(waterBlock.position, 2)

        await sleep(300)
    }

    async lookAtFishingSpot(waterBlock) {
        const bot = this.ctx.bot

        const lookTarget = waterBlock.position.offset(0.5, 0.5, 0.5)

        await bot.lookAt(lookTarget, true)
        await sleep(200)
    }
}