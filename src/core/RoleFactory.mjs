import { FarmerRole } from '../roles/FarmerRole.mjs'

export function createRole(roleName) {
    switch (roleName) {
        case 'farmer':
            return new FarmerRole()
        default:
            throw new Error(`Unknown role: ${roleName}`)
    }
}