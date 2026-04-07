import { FarmerRole } from '../roles/FarmerRole.mjs'
import { FisherRole } from '../roles/FisherRole.mjs'

export function createRole(roleName) {
    switch (roleName) {
        case 'farmer':
            return new FarmerRole()
        case 'fisher':
            return new FisherRole()
        default:
            throw new Error(`Unknown role: ${roleName}`)
    }
}