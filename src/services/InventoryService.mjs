export class InventoryService{
    constructor(ctx) {
        this.ctx = ctx
    }

    getInventoryItems() {
        return this.ctx.bot.inventory.items()
    }

    findItemByName(itemName) {
        return this.getInventoryItems().find(item => item.name === itemName) ?? null
    }

    countItem(itemName) {
        return this.getInventoryItems()
            .filter(item => item.name === itemName)
            .reduce((total, item) => total + item.count, 0)
    }

    hasItem(itemName, minCount = 1) {
        return this.countItem(itemName) >= minCount
    }

    getUsedSlotCount() {
        return this.getInventoryItems().length
    }

    isInventoryNearlyFull(threshold = 30) {
        return this.getUsedSlotCount() >= threshold
    }

    printInventory() {
        const items = this.getInventoryItems()

        if (items.length === 0) {
            console.log('[inventory] inventory is empty')
            return
        }

        console.log('[inventory] items:')
        for (const item of items) {
            console.log(`- ${item.name} x${item.count}`)
        }
    }
}