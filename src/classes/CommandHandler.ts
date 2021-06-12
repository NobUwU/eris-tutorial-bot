/* eslint-disable @typescript-eslint/ban-ts-comment */
import Eris from 'eris'
import { EventEmitter } from 'events'
import path from 'path'
import fs from 'fs'
import {
  BaseCommand, CommandProps, ErisPermissions,
} from './BaseCommand'
import {
  colors,
  devs,
} from '../config'

export class TemplateCommand extends BaseCommand {
  private bot: Eris.Client
  constructor(bot: Eris.Client) {
    super("template", {
      usage: "",
      description: "",
      category: "",
      aliases: [],
      type: 'all',
      devOnly: false,
    })
    this.bot = bot
  }
  public execute(props: CommandProps): void {
    const {} = props

    return
  }
}

export class CommandHandler extends EventEmitter {
  private _bot: Eris.Client
  private commands = new Map<string, BaseCommand>()
  private prefixes: string[] = []
  private prefixRegex: RegExp
  private sendErrorLogs = false
  constructor(bot: Eris.Client, prefixes: string[], sendErrorLogs?: boolean) {
    super()
    this._bot = bot
    this.prefixes = prefixes
    this.sendErrorLogs = sendErrorLogs

    let prefixRegexString = ""
    for (const prefix of prefixes) {
      prefixRegexString += `|^${prefix}(\\s+|)`
    }
    this.prefixRegex = new RegExp(`(${prefixRegexString.slice(1)})`)

  }
  public add(command: BaseCommand): this {
    this.commands.set(command.name, command)

    return this
  }
  public remove(command: string | BaseCommand): this {
    this.commands.delete(typeof command === 'string' ? command : command.name)

    return this
  }
  public get(command: string | BaseCommand): BaseCommand | undefined {
    return this.commands.get(typeof command === 'string' ? command : command.name)
  }
  public getByAlias(name: string): BaseCommand | undefined {
    const command: BaseCommand[] = Array.from(this.filter((cmd) => cmd.name === name || cmd.extra.aliases?.includes(name)).values())

    return command[0] || undefined
  }
  public filter(filter: (val: BaseCommand) => boolean): Map<string, BaseCommand> {
    const results = new Map<string, BaseCommand>()
    for (const [k, v] of this.commands.entries()) {
      if (filter(v)) {
        results.set(k, v)
      }
    }

    return results
  }
  public autoRegisterAll(): Promise<boolean> {
    fs.readdirSync(path.resolve(__dirname, '../commands'))
      .forEach(async dir => {
        const commandFiles = fs.readdirSync(path.resolve(__dirname, `../commands/${dir}/`)).filter(file => file.endsWith(process.env.NODE_ENV === 'development' ? ".ts" : ".js"))
        for (const file of commandFiles) {
          let commandImport: typeof TemplateCommand = await import(path.resolve(__dirname, `../commands/${dir}/${file}`))
          // @ts-expect-error
          commandImport = commandImport.default ? commandImport.default : commandImport
          const command = new commandImport(this._bot)
          if (command.name) {
            this.add(command)
          } else {
            console.error(new Error(`${file} does not include a name prop, cannot be executed`))
          }
        }
      })

    return Promise.resolve(true)
  }

  public async parseEvent(message: Eris.Message): Promise<void> {
    const {
      author,
      channel,
      guildID,
    } = message
    const { content } = message
    if (author.bot) return
    if (channel.type !== 0) return

    const guild = this._bot.guilds.get(guildID)
    
    const args = content.split(" ")
      .filter(args => args.length > 0)

    if (!args[0]) return

    if (!this.prefixRegex.test(args[0].toLowerCase())) return // Means Incorrect Prefix
    args[0] = args[0]
      .toLowerCase()
      .replace(this.prefixRegex, "")

    if (args[0].length === 0) args.shift() // Remoave Preifx From Args

    if (!args[0]) return // No Command

    const command = this.getByAlias(args[0].toLowerCase())
    if (!command) return
    args.shift() // Remove command from args array

    if (command.extra.devOnly && !devs.includes(author.id)) return

    // if (command.extra.type) {
    //   if (command.extra.type === 'dm' && channel.type !== 1) return
    //   if (command.extra.type === 'guild' && channel.type !== 0) return
    // }

    const send = (content: string | { embed: Eris.EmbedOptions }): Promise<Eris.Message> => {
      const message = channel.createMessage(content)
      message.catch(err => {
        if (this.sendErrorLogs) {
          console.error(new Error(`Caught Error: CommandHandler.send`), err)
        }
      })

      return message
    }
    const createMessage = (channel: string, content: string | { embed: Eris.EmbedOptions }): Promise<Eris.Message> => {
      const message = this._bot.createMessage(channel, content)
      message.catch(err => {
        if (this.sendErrorLogs) {
          console.error(new Error(`Caught Error: CommandHandler.createMessage`), err)
        }
      })

      return message
    }
    const embed = (options: Eris.EmbedOptions): Promise<Eris.Message> => {
      return send({ embed: options })
    }
    const quickEmbed = (title: string, description: string, color?: number): Promise<Eris.Message> => {
      return embed({
        title,
        description,
        color: color || colors.default,
      })
    }

    const deleteMessage = (reason?: string): void => {
      message.delete(reason).catch(err => {
        if (this.sendErrorLogs) {
          console.error(new Error(`Caught Error: CommandHandler.deleteMessage`), err)
        }
      })
    }

    const checkIfHasPerms = (channel: Eris.AnyGuildChannel, member: Eris.Member, permissions: ErisPermissions[]): { has: boolean, missingPerm?: ErisPermissions } => {
      let hasPerms = true
      let missingPerm = undefined
      for (const perm of permissions) {
        if (member.permissions.has(perm)) {
          if (!channel.permissionsOf(member).has(perm)) {
            hasPerms = false
            missingPerm = perm
            break
          }
        } else {
          if (!channel.permissionsOf(member).has(perm)) {
            hasPerms = false
            missingPerm = perm
            break
          }
        }
      }

      return {
        has: hasPerms,
        missingPerm,
      }
    }

    const guildChannel = guild.channels.get(channel.id)
    const botMember = guild.members.get(this._bot.user.id)

    if (!checkIfHasPerms(guildChannel, botMember, ['sendMessages']).has) return

    try {
      const props: CommandProps = {
        message,
        args,
        send,
        embed,
        quickEmbed,
        checkIfHasPerms,
        deleteMessage,
        createMessage,
        guild,
        botMember,
        guildChannel,
      }

      await command.execute(props)

      return
    } catch (error) {
      embed({
        color: colors.error,
        title: "An Error Has Occured",
        description: `\`\`\`${error}\`\`\``,
      })
    }

  }
}
