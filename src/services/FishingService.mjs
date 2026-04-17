import { sleep } from '../utils/sleep.mjs'

const FISHING_SEARCH_RADIUS = 16
const FISHING_SEARCH_COUNT = 30

export class FishingService {

    constructor(ctx) {
        this.ctx = ctx
        this.busy = false
    }

    async runFishingCycle() {
        if (this.busy) return
        this.busy = true

        try {
            const threshold = this.ctx.config.settings?.inventoryThreshold ?? 30
            
            if (this.ctx.services.inventory.isInventoryNearlyFull(threshold)) {
                console.log(`[fishing] inventory is getting full`)
                await this.ctx.services.storage.depositExcessItems({
                    fishing_rod: 1
                })
            }

            const rod = this.findFishingRod()

            if (!rod) {
                console.log('[fishing] no fishing rod found in inventory')
                return
            }

            const fishingSpot = this.findFishingSpot()

            if (!fishingSpot) {
                console.log('[fishing] no suitable water found nearby')
                return
            }

            await this.goToFishingSpot(fishingSpot.standPos)
            await this.ctx.bot.equip(rod, 'hand')
            await this.lookAtFishingSpot(fishingSpot.waterBlock)

            console.log('[fishing] casting line')
            await this.ctx.bot.fish()
            console.log('[fishing] caught something')
            
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

    hasAirAboveWater(block) {
        const bot = this.ctx.bot
        if (!block) return false
        if (block.name !== 'water') return false

        const above1 = bot.blockAt(block.position.offset(0, 1, 0))
        const above2 = bot.blockAt(block.position.offset(0, 2, 0))

        if (!above1 || above1.name !== 'air') return false
        if (!above2 || above2.name !== 'air') return false

        return true
    }

    isStandableSpot(standPos) {
        const bot = this.ctx.bot

        const feetBlock = bot.blockAt(standPos)
        const headBlock = bot.blockAt(standPos.offset(0, 1, 0))
        const belowBlock = bot.blockAt(standPos.offset(0, -1, 0))

        if (!feetBlock || feetBlock.name !== 'air') return false
        if (!headBlock || headBlock.name !== 'air') return false
        if (!belowBlock) return false

        // Must stand on something solid-ish
        if (belowBlock.name === 'air' || belowBlock.name === 'water' || belowBlock.name === 'lava') {
            return false
        }

        return true
    }

    hasCastObstructionFrom(standPos, waterBlock) {
        const bot = this.ctx.bot
        const waterPos = waterBlock.position

        const dx = waterPos.x - standPos.x
        const dz = waterPos.z - standPos.z

        const steps = Math.max(Math.abs(dx), Math.abs(dz))
        if (steps === 0) return false

        // Check a simple line from stand position toward water
        for (let i = 1; i <= steps; i++) {
            const x = standPos.x + Math.round((dx * i) / steps)
            const z = standPos.z + Math.round((dz * i) / steps)

            // Check at body/head heights
            const bodyBlock = bot.blockAt(standPos.offset(x - standPos.x, 1, z - standPos.z))
            const headBlock = bot.blockAt(standPos.offset(x - standPos.x, 2, z - standPos.z))

            const blockedBody = bodyBlock && bodyBlock.name !== 'air' && bodyBlock.name !== 'water'
            const blockedHead = headBlock && headBlock.name !== 'air' && headBlock.name !== 'water'

            if (blockedBody || blockedHead) {
                return true
            }
        }

        return false
    }

    findFishingSpot() {
        const bot = this.ctx.bot

        const positions = bot.findBlocks({
            maxDistance: FISHING_SEARCH_RADIUS,
            count: FISHING_SEARCH_COUNT,
            matching: (block) => {
                if (!block) return false
                return block.name === 'water'
            }
        })

        const candidates = []

        for (const pos of positions) {
            const waterBlock = bot.blockAt(pos)
            if (!waterBlock) continue
            if (!waterBlock.position) continue
            if (!this.hasAirAboveWater(waterBlock)) continue

            const depth = this.getWaterDepth(waterBlock)
            if (depth <= 0) continue

            const standPos = this.findNearbyStandingPos(waterBlock, 3)
            if (!standPos) continue

            if (this.hasCastObstructionFrom(standPos, waterBlock)) continue

            const beachDistance = this.getHorizontalDistance(standPos, waterBlock.position)

            candidates.push({
                waterBlock,
                standPos,
                depth,
                beachDistance
            })
        }

        if (candidates.length === 0) return null

        candidates.sort((a, b) => {
            if (b.depth !== a.depth) return b.depth - a.depth
            if (a.beachDistance !== b.beachDistance) return a.beachDistance - b.beachDistance

            const distA = a.standPos.distanceTo(bot.entity.position)
            const distB = b.standPos.distanceTo(bot.entity.position)
            return distA - distB
        })

        return {
            waterBlock: candidates[0].waterBlock,
            standPos: candidates[0].standPos
        }
    }

    getWaterDepth(waterBlock) {
        const bot = this.ctx.bot

        let depth = 0

        let pos = waterBlock.position.clone()

        while (true) {
            const block = bot.blockAt(pos)
            if (!block || block.name !== 'water') break

            depth++
            pos = pos.offset(0, -1, 0)
        }

        return depth
    }

    findNearbyStandingPos(waterBlock, maxDistance = 3) {
        const possibleStandPos = []

        for (let dx = -maxDistance; dx <= maxDistance; dx++) {
            for (let dz = -maxDistance; dz <= maxDistance; dz++) {
                if (dx === 0 && dz === 0) continue

                const horizontalDistance = Math.abs(dx) + Math.abs(dz)
                if (horizontalDistance > maxDistance) continue

                const standPos = waterBlock.position.offset(dx, 1, dz)

                if (!this.isStandableSpot(standPos)) continue

                possibleStandPos.push({
                    standPos,
                    distance: horizontalDistance
                })
            }
        }

        if (possibleStandPos.length === 0) return null

        possibleStandPos.sort((a, b) => a.distance - b.distance)
        return possibleStandPos[0].standPos
    }

    getHorizontalDistance(posA, posB) {
        return Math.abs(posA.x - posB.x) + Math.abs(posA.z - posB.z)
    }

    async goToFishingSpot(standPos) {
        await this.ctx.services.movement.goNear(standPos, 0.5)
        await sleep(500)
    }

    async lookAtFishingSpot(waterBlock) {
        const bot = this.ctx.bot

        await bot.lookAt(waterBlock.position.offset(0.5, 0.5, 0.5), true)

        await sleep(500)
    }
}