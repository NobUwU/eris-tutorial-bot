import { config } from 'dotenv'
config()
import { Client } from 'eris'
const bot = new Client(process.env.TOKEN)

bot.once('ready', () => {
  console.log(`Logged in as:`, bot.user.username)
})

bot.on('messageCreate', (msg) => {
  if (msg.content.toLowerCase() === "!ping") {
    bot.createMessage(msg.channel.id, "PONG!")
  }
})

bot.connect()
