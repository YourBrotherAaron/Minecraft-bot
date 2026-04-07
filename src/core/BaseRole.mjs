import { sleep } from "../utils/sleep.mjs"

export class BaseRole {
    constructor(name = 'base') {
        this.name = name
        this.ctx = null
        this.active = false
    }

    async start(ctx) {
        this.ctx = ctx
        this.active = true
        console.log(`[role:${this.name}] started`)
        await sleep(5000)
    }

    async stop() {
        this.active = false
        console.log(`[role:${this.name}] stopped`)
    }
}