// https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md#messagestr-message-messageposition-jsonmsg-sender-verified

console.trace = () => {}
import mineflayer from 'mineflayer'
const mineflayerViewer = require('prismarine-viewer').mineflayer
const bot = mineflayer.createBot({
  username: 'bot3',
  host: 'localhost',
  port: 60858,
  version: '1.8.9',
  hideErrors: false
})

bot.once('spawn', () => {
  if (!mineflayerViewer) {
    console.warn('prismarine-viewer not available, skipping viewer');
    return;
  }
  mineflayerViewer(bot, { port: 60858, firstPerson: true });
});

const log = (message) => {
    console.log(`[${bot.username}] ${message}`)
}

bot.on('login', () => {
    log('Logged in')
})

bot.on('spawn', () => {
    log('Spawned')
    setTimeout(() => {
        bot.chat('Hello world')
    }, 1000);
})

bot.on('kicked', (reason, loggedIn) => {
  const text = typeof reason === 'string' ? reason : JSON.stringify(reason)

  if (loggedIn) {
    log(`Kicked from the server: ${text}`)
  } else {
    log(`Kicked whilst trying to connect: ${text}`)
  }
})

bot.on('messagestr', (message, messagePosition, jsonMsg, sender, verified, username) => {
    if (messagePosition === "chat" && message.includes('quit')) {
        log(message)
        log(jsonMsg)
        bot.quit()
    }
})


bot.on('chat', (username, message) => {
  if (username === "bot3") return
  bot.chat(message)
})

bot.on('error', (err) => {
    log(`Error: ${err.message}`)
})

bot.on('end', () => {
    log('Disconnected')
})
