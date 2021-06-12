import { config } from 'dotenv'
config()
import Eris, { Client } from 'eris'
import { CommandHandler } from './classes'
import { prefixes } from './config'
export interface ModifiedClient extends Client {
  commandHandler: CommandHandler
}
const bot: ModifiedClient = new Client(process.env.TOKEN) as ModifiedClient

Object.assign(bot, {
  commandHandler: new CommandHandler(bot, prefixes, false),
})

bot.once('ready', () => {
  console.log(`Logged in as:`, bot.user.username)
  bot.commandHandler.autoRegisterAll()
})

bot.on('messageCreate', (msg) => {
  bot.commandHandler.parseEvent(msg as Eris.Message<Eris.TextableChannel>)
})

bot.connect()
