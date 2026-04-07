import  { Vec3 } from 'vec3'
import { sleep } from '../utils/sleep.mjs'

export class FarmingService {
    constructor(ctx) {
        this.ctx = ctx
        this.busy = false
        this.recentTargets = new Map()
    }

    async runFarmingCycle() {
        if (this.busy) return
        this.busy = true

        let crop = null

        try {
            crop = await this.findHarvestableCrop()

            if (!crop) {
                console.log('[farming] no harvestable crop found')
                return
            }
            
            const pos = crop.position

            await this.ctx.services.movement.goNear(pos, 2)
            const freshCrop = this.ctx.bot.blockAt(pos)

            if (!this.isHarvestableCrop(freshCrop)) {
                console.log('[farming] crop is no longer harvestable')
                this.markTargetCooldown(pos, 3000)
                return
            }

            const cropName = freshCrop.name

            await this.harvestCrop(freshCrop) 

            // wait a moment for drops to appear
            await sleep(800)
            await this.ctx.services.pickup.collectAllNearby(8, 5)
            
            await this.replantCrop(pos, cropName)
        } catch (err) {
            console.error(`[farming] runOnce error: ${err.message}`)

            if (crop?.position) {
                this.markTargetCooldown(crop.position, 5000)
            }
        } finally {
            this.busy = false
        }
    }

    async harvestCrop(block) {
        if (!block) return

        console.log(`[farming] harvesting ${block.name}`)
        await this.ctx.bot.dig(block)
        console.log('[farming] harvest complete')
    }

    async findHarvestableCrop() {
        const bot = this.ctx.bot

        const crop = bot.findBlock({
            maxDistance: 16,
            matching: (block) => {
                // TODO: check why this doesnt
                if (!block) {
                    console.log(`Block is null ${block}`)
                    return false
                } 
                // if (!block.position) {
                //     console.log(`Block position is null ${block.position}`)
                //     return false
                // } 

                return this.isHarvestableCrop(block) && !this.isOnCooldown(block.position)
            }
        })

        return crop ?? null
    }

    isHarvestableCrop(block) {
        if (!block) return false

        const rawAge = block.getProperties?.()?.age
        const age = rawAge == null ? null : Number(rawAge)

        if (
            block.name === 'wheat' ||
            block.name === 'carrots' ||
            block.name === 'potatoes' ||
            block.name === 'beetroots'
        ) {
            return this.isMatureByAge(block.name, age)
        }

        if (block.name === 'nether_wart') {
            return age === 3
        }

        return false
    }

    isMatureByAge(blockName, age) {
        if (typeof age !== 'number' || Number.isNaN(age)) return false

        switch (blockName) {
            case 'wheat':
            case 'carrots':
            case 'potatoes':
                return age === 7
            case 'beetroots':
                return age === 3
            default:
                return false
        }
    }

    // Helper to convert position into string for key > value Map
    getTargetKey(position) {
        if (!position) return null
        return `${position.x},${position.y},${position.z}`
    }

    // Checks if target crop is on cooldown
    isOnCooldown(position) {
        const key = this.getTargetKey(position)
        if (!key) return false

        const until = this.recentTargets.get(key)
        if (!until) return false

        if (Date.now() > until) {
            this.recentTargets.delete(key)
            return false
        }

        return true
    }

    // Temporarily mark failed crop targets so the bot does not keep retrying
    // the same unreachable plant every loop.
    // Flow:
    // 1. Bot selects a crop
    // 2. Bot walks to it
    // 3. Bot tries to harvest it
    // 4. Harvest fails or the crop cannot be reached
    // 5. Bot skips that crop for a short time and tries another one
    // 6. After the cooldown expires, the crop can be targeted again
    markTargetCooldown(position, ms = 5000) {
        const key = this.getTargetKey(position)
        this.recentTargets.set(key, Date.now() + ms)
    }

    async replantCrop(position, cropName) {
        const bot = this.ctx.bot

        const targetBlock = bot.blockAt(position)
        const blockBelow = bot.blockAt(position.offset(0, -1, 0))

        if (!targetBlock || targetBlock.name !== 'air') {
            console.log('[farming] cannot replant, target block is not empty')
            return
        }

        // Check soil
        const requiredSoil = this.getRequiredSoilForCrop(cropName)
        if (!requiredSoil) {
            console.log(`[farming] no soil mapping for crop ${cropName}`)
            return
        }

        if (!blockBelow || blockBelow.name !== requiredSoil) {
            console.log(`[farming] cannot replant, block below is not ${requiredSoil}`)
            return
        }

        // Check seed
        const seedItemName = this.getSeedItemNameForCrop(cropName)
        if (!seedItemName) {
            console.log(`[farming] no seed mapping for crop ${cropName}`)
            return
        }

        const seedItem = bot.inventory.items().find(item => item.name === seedItemName)
        if (!seedItem) {
            console.log(`[farming] no ${seedItemName} in inventory`)
            return
        }

        await bot.equip(seedItem, 'hand')
        await bot.placeBlock(blockBelow, new Vec3(0, 1, 0))

        console.log(`[farming] replanted ${cropName}`)
    }

    getSeedItemNameForCrop(cropName) {
        switch (cropName) {
            case 'wheat':
                return 'wheat_seeds'
            case 'carrots':
                return 'carrot'
            case 'potatoes':
                return 'potato'
            case 'beetroots':
                return 'beetroot_seeds'
            case 'nether_wart':
                return 'nether_wart'
            default:
                return null
        }
    }

    getRequiredSoilForCrop(cropName) {
        switch (cropName) {
            case 'wheat':
            case 'carrots':
            case 'potatoes':
            case 'beetroots':
                return 'farmland'
            case 'nether_wart':
                return 'soul_sand'
            default:
                return null
        }
    }
}