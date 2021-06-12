import Eris from 'eris'
import {
  BaseCommand,
  CommandProps,
} from '../../classes'

class PingCommand extends BaseCommand {
  private bot: Eris.Client
  constructor(bot: Eris.Client) {
    super("ping", {
      usage: "",
      description: "Ping discord websocket",
      category: "utility",
      aliases: [
        "pong",
        "latency",
      ],
      //type: 'all',
      devOnly: false,
    })
    this.bot = bot
  }
  public execute(props: CommandProps): void {
    const {
      send,
    } = props
    send(`PONG!`)

    return
  }
}

export default PingCommand
