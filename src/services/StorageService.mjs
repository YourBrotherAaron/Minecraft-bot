import { sleep } from "../utils/sleep.mjs"

export class StorageService {
    constructor(ctx) {
        this.ctx = ctx
        this.recentChests = new Map()
    }

    findNearbyChests(maxDistance = 16, maxCount = 20) {
        const bot = this.ctx.bot

        const positions = bot.findBlocks({
            maxDistance,
            count: 20,
            matching: (block) => {
                if(!block) return false
                return block.name === 'chest'
            }
        })

        const chests = []

        for (const pos of positions) {
            const block = bot.blockAt(pos)
            if (!block) continue
            if (!block.position) continue
            if (this.isChestOnCooldown(block.position)) continue

            chests.push(block)
        }

        return chests
    }

    async depositIntoChest(chestBlock, keepAmounts = {}) {
        const bot = this.ctx.bot

        await this.ctx.services.movement.goNear(chestBlock.position, 2)

        let chest

        try {
            chest = await bot.openContainer(chestBlock)

            const items = bot.inventory.items()

            const totalCounts = {}
            for (const item of items) {
                totalCounts[item.name] = (totalCounts[item.name] ?? 0) + item.count
            }

            const remainingToDeposit = {}
            for (const [itemName, total] of Object.entries(totalCounts)) {
                const keepAmount = keepAmounts[itemName] ?? 0
                const excess = total - keepAmount
                remainingToDeposit[itemName] = Math.max(0, excess)
            }

            let depositedAnything = false

            for (const item of items) {
                const amountToDeposit = remainingToDeposit[item.name] ?? 0
                if (amountToDeposit <= 0) continue

                const amountToDepositNow = Math.min(item.count, amountToDeposit)

                console.log(`[storage] depositing ${item.name} x${amountToDepositNow}`)
                await chest.deposit(item.type, null, amountToDepositNow)

                remainingToDeposit[item.name] -= amountToDepositNow
                depositedAnything = true

                await sleep(500)
            }

            if (!depositedAnything) {
                console.log('[storage] nothing needed to be deposited')
            } else {
                console.log('[storage] deposited items into chest')
            }

            return true
        } catch (err) {
            console.log(`[storage] chest at ${chestBlock.position.x},${chestBlock.position.y},${chestBlock.position.z} failed: ${err.message}`)
            this.markChestCooldown(chestBlock.position, 30000)
            return false
        } finally {
            if (chest) chest.close()
        }
    }

    async depositExcessItems(keepAmounts = {}) {
        const chests = this.findNearbyChests()

        if (chests.length === 0) {
            console.log('[storage] no usable chests found nearby')
            return false
        }

        for (const chestBlock of chests) {
            const success = await this.depositIntoChest(chestBlock, keepAmounts)
            if (success) {
                return true
            }
        }

        console.log('[storage] no usable chests found nearby')
        return false
    }

    getChestKey(position) {
        if (!position) return null
        return `${position.x},${position.y},${position.z}`
    }

    isChestOnCooldown(position) {
        const key = this.getChestKey(position)
        if (!key) return false

        const until = this.recentChests.get(key)
        if (!until) return false

        if (Date.now() > until) {
            this.recentChests.delete(key)
            return false
        }

        return true
    }

    markChestCooldown(position, ms = 5000) {
        const key = this.getChestKey(position)
        if (!key) return

        this.recentChests.set(key, Date.now() + ms)
    }
}