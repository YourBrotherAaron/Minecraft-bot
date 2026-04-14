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
            console.log(`[fishing] found water block position: ${waterBlock.position}`)



            await this.goToFishingSpot(waterBlock)
            console.log('[fishing] after move pos:', this.ctx.bot.entity.position)
            console.log('[fishing] after move vel:', this.ctx.bot.entity.velocity)
            
            await this.lookAtFishingSpot(waterBlock)

            await this.ctx.bot.equip(rod, 'hand')

            
            console.log('[fishing] before fishing yaw:', this.ctx.bot.entity.yaw)
            console.log('[fishing] before fishing pitch:', this.ctx.bot.entity.pitch)
            const fishingPromise = this.ctx.bot.fish()
            await sleep(3000)

            const bobber = this.findFishingBobber()
            if (bobber) {
                console.log('[fishing] bobber spawn position:', bobber.position)
                console.log('[fishing] while fishing yaw:', this.ctx.bot.entity.yaw)
                console.log('[fishing] while fishing pitch:', this.ctx.bot.entity.pitch)
            } else {
                console.log('[fishing] no bobber found after cast')
            }
            
            await fishingPromise
            
            console.log('[fishing] after fishing yaw:', this.ctx.bot.entity.yaw)
            console.log('[fishing] after fishing pitch:', this.ctx.bot.entity.pitch)
            
            
            


            await sleep(500)
        } catch (err) {
            console.log(`[fishing] runFishingCycle error: ${err.message}`)
        } finally {
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
        await sleep(5000)
    }

    async lookAtFishingSpot(waterBlock) {
        console.log('[fishing] before look yaw:', this.ctx.bot.entity.yaw)
        console.log('[fishing] before look pitch:', this.ctx.bot.entity.pitch)
        
        const lookTarget = waterBlock.position.offset(0.5, 0.5, 0.5)

        await this.ctx.bot.lookAt(lookTarget, true)

        console.log('[fishing] after look yaw:', this.ctx.bot.entity.yaw)
        console.log('[fishing] after look pitch:', this.ctx.bot.entity.pitch)

        await sleep(5000)
    }

    findFishingBobber() {
        const bot = this.ctx.bot

        for (const entity of Object.values(bot.entities)) {
            if (!entity) continue

            if (entity.name === 'fishing_bobber' || entity.name === 'fishing_hook') {
                return entity
            }
        }

        return null
    }
}