export class BotContext {
    constructor({ bot, config, role }) {
        this.bot = bot
        this.config = config
        this.role = role

        this.services = {}
        this.eventBus = null
    }
}