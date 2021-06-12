import Eris from 'eris'

export type ErisPermissions = (
  "createInstantInvite" |
  "kickMembers" |
  "banMembers" |
  "administrator" |
  "manageChannels" |
  "manageGuild" |
  "addReactions" |
  "viewAuditLog" |
  "viewAuditLogs" |
  "voicePrioritySpeaker" |
  "voiceStream" |
  "stream" |
  "viewChannel" |
  "readMessages" |
  "sendMessages" |
  "sendTTSMessages" |
  "manageMessages" |
  "embedLinks" |
  "attachFiles" |
  "readMessageHistory" |
  "mentionEveryone" |
  "useExternalEmojis" |
  "externalEmojis" |
  "viewGuildInsights" |
  "voiceConnect" |
  "voiceSpeak" |
  "voiceMuteMembers" |
  "voiceDeafenMembers" |
  "voiceMoveMembers" |
  "voiceUseVAD" |
  "changeNickname" |
  "manageNicknames" |
  "manageRoles" |
  "manageWebhooks" |
  "manageEmojis" |
  "useSlashCommands" |
  "voiceRequestToSpeak" |
  "allGuild" |
  "allText" |
  "allVoice" |
  "all"
)

export interface CommandExtra {
  usage?: string
  description?: string
  category?: string
  aliases?: string[]
  type?: 'dm' | 'guild' | 'all'
  devOnly?: boolean
}

export interface CommandProps {
  message: Eris.Message
  args: string[]
  guild: Eris.Guild
  botMember: Eris.Member
  guildChannel: Eris.AnyGuildChannel
  send(content: string | { embed: Eris.EmbedOptions }): Promise<Eris.Message>
  embed(options: Eris.EmbedOptions): Promise<Eris.Message>
  quickEmbed(title: string, description: string, color?: number): Promise<Eris.Message>
  createMessage(channel: string, content: string | { embed: Eris.EmbedOptions }): Promise<Eris.Message>
  checkIfHasPerms(channel: Eris.Channel, member: Eris.Member, permissions: ErisPermissions[]): { has: boolean, missingPerm?: ErisPermissions }
  deleteMessage(reason?: string): void
}

export abstract class BaseCommand {
  private _name: string
  private _extra: CommandExtra
  constructor(name: string, extra?: CommandExtra) {
    this._name = name
    this._extra = extra
  }
  get name(): string {
    return this._name
  }
  get extra(): CommandExtra {
    return this._extra
  }
  public abstract execute(props: CommandProps): void
}
