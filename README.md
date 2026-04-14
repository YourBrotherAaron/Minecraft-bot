# Farming Bot

A Node.js Minecraft bot project built with Mineflayer. The project can run one or more bots, assign each bot a role, and use shared services for movement, farming, fishing, inventory management, item pickup, and chest storage.

## Features

- Multi-bot startup from a single configuration file
- Role-based bot behavior
- Farmer role for harvesting and replanting mature crops
- Fisher role for finding water and fishing with a rod
- Mineflayer Pathfinder movement
- Inventory threshold checks
- Nearby dropped item pickup
- Chest deposit support for excess items
- Optional farming-area bounds per farmer bot

## Requirements

- Node.js 18 or newer
- npm
- A Minecraft server reachable from the machine running the bot
- A Minecraft version compatible with the configured Mineflayer version

The current bot config targets Minecraft `1.21.11` on `127.0.0.1:25565`.

## Installation

Install dependencies from the project root:

```bash
npm install
```

The main dependencies are:

- `mineflayer`
- `mineflayer-pathfinder`

## Running

Start the bots with:

```bash
node index.mjs
```

The entry point loads bot definitions from:

```text
src/config/botDefinitions.mjs
```

For every bot definition, it creates the configured role and starts a separate Mineflayer bot.

## Configuration

### Server Config

Shared server settings live in:

```text
src/config/botConfig.mjs
```

Example:

```js
export const botConfig = {
    host: '127.0.0.1',
    port: 25565,
    version: '1.21.11',
    username: 'TestBot'
}
```

`username` is overwritten by each bot definition when bots are started.

### Bot Definitions

Individual bots are configured in:

```text
src/config/botDefinitions.mjs
```

Example fisher bot:

```js
{
    username: 'FisherBot1',
    role: 'fisher',
    settings: {
        inventoryThreshold: 30
    }
}
```

Example farmer bot:

```js
{
    username: 'FarmerBot1',
    role: 'farmer',
    settings: {
        inventoryThreshold: 30,
        farmArea: {
            minX: 0,
            maxX: 6,
            minY: -64,
            maxY: 64,
            minZ: -2,
            maxZ: 10
        }
    }
}
```

Supported roles:

- `farmer`
- `fisher`

## Roles

### Farmer

The farmer role repeatedly runs a farming cycle:

1. Find a mature crop nearby.
2. Check that it is inside the configured farm area, if one exists.
3. Move near the crop.
4. Harvest it.
5. Pick up nearby drops.
6. Replant the crop when possible.
7. Deposit excess items into nearby chests when inventory usage reaches the threshold.

Supported crop logic includes:

- Wheat
- Carrots
- Potatoes
- Beetroots
- Nether wart

### Fisher

The fisher role repeatedly runs a fishing cycle:

1. Find a fishing rod in inventory.
2. Find nearby water.
3. Move near the water block.
4. Look at the fishing spot.
5. Equip the rod.
6. Cast and wait for the fishing action to complete.

## Project Structure

```text
index.mjs                         Application entry point
package.json                      Node dependencies
src/config/                       Shared config and bot definitions
src/core/                         Bot manager, context, role factory, and base role
src/roles/                        Role loops for farmer and fisher bots
src/services/                     Reusable bot services
src/utils/                        Small utility helpers
```

Important files:

```text
src/core/BotManager.mjs           Creates Mineflayer bots and registers events
src/core/RoleFactory.mjs          Maps role names to role classes
src/roles/FarmerRole.mjs          Farmer role loop
src/roles/FisherRole.mjs          Fisher role loop
src/services/FarmingService.mjs   Crop harvesting and replanting
src/services/FishingService.mjs   Fishing behavior
src/services/MovementService.mjs  Pathfinder movement wrapper
src/services/InventoryService.mjs Inventory helpers
src/services/StorageService.mjs   Chest deposit logic
src/services/ItemPickupService.mjs Dropped item pickup
```

## Chat Control

If the bot sees a chat message containing `quit`, it disconnects from the server.

## Notes

- `ACCOUNT.json` is ignored by git and should stay private.
- `node_modules/` is ignored by git and should be recreated with `npm install`.
- Make sure the bot has the required items before starting a role. For example, the fisher needs a `fishing_rod`, and the farmer needs seeds or crops for replanting.
- Farmers deposit excess items only when a usable chest is nearby.
- Movement uses Mineflayer Pathfinder with digging disabled.

## Troubleshooting

If the bot cannot connect, check the server host, port, Minecraft version, and whether online/offline authentication matches your server setup.

If the farmer does not harvest, check that mature crops are within range and inside the configured `farmArea` bounds.

If the fisher does not fish, check that it has a fishing rod and that water exists within the search radius.

If pathfinding fails, make sure the target can be reached without digging, since digging is disabled in `MovementService`.

## License

No license file is currently included in this project.
