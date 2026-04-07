import { sleep } from "../utils/sleep.mjs"

export class ItemPickupService {
    constructor(ctx) {
        this.ctx = ctx
    }

    findNearestDroppedItem(maxDistance = 8) {
        const bot = this.ctx.bot
 
        const entity = bot.nearestEntity((entity) => {
            if (!entity) return false
            if (!entity.position) return false

            // Dropped ground items are entities of type "object"
            // and usually have name "item"
            if (entity.name !== 'item') return false

            const distance = bot.entity.position.distanceTo(entity.position)
            return distance <= maxDistance
        })

        return entity ?? null
    } 
    
    async collectNearest(maxDistance = 8) {
        const bot = this.ctx.bot
        const item = this.findNearestDroppedItem(maxDistance)

        if(!item) {
            console.log('[pickup] no dropped item nearby')
            return false
        }

        const pos = item.position

        await this.ctx.services.movement.goNear(pos, 0.6)
        
        return true
    }

    async collectAllNearby(maxDistance = 8, maxItems = 5) {
        let collectedAny = false
        
        for (let i = 0; i < maxItems; i++) {
            const collected = await this.collectNearest(maxDistance)
            if (!collected) break

            collectedAny = true

            // small pause so the server can register the pickup
            await sleep(200)
        }

        return collectedAny
    }
}