import DiscordBasePlugin from './discord-base-plugin.js';

export default class DiscordItemSpawnReporter extends DiscordBasePlugin {
  static get description() {
    return (
      'The <code>DiscordItemSpawnReporter</code> plugin detects and logs instances where a player attempts to spawn an item ' +
      'and sends the information to a Discord channel for administrators to review.'
    );
  }

  static get defaultEnabled() {
    return true;
  }

  static get optionsSpecification() {
    return {
      ...DiscordBasePlugin.optionsSpecification,
      channelID: {
        required: true,
        description: 'The ID of the channel to log item spawn attempts to.',
        default: '',
        example: '667741905228136459'
      },
      color: {
        required: false,
        description: 'The color of the embeds.',
        default: 16761867
      },
      warnInGameAdmins: {
        required: false,
        description: 'Whether to warn in-game admins with the suspected player name.',
        default: true
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.onItemSpawnAttempt = this.onItemSpawnAttempt.bind(this);
  }

  async mount() {
    this.server.on('ITEM_SPAWN_ATTEMPT', this.onItemSpawnAttempt);
  }

  async unmount() {
    this.server.removeEventListener('ITEM_SPAWN_ATTEMPT', this.onItemSpawnAttempt);
  }

  async onItemSpawnAttempt(data) {
    const embed = {
      title: 'Item Spawn Attempt Detected',
      description: `Suspected Player :\nName: ${data.playerName}\nEOSID: ${data.playerEOSID}\nSteamID: ${data.playerSteamID}\nItem ${data.item}`,
      color: this.options.color,
      timestamp: Date.now()
    };

    await this.sendDiscordMessage({ embed });

    if (this.options.warnInGameAdmins) {
      const adminWarningMessage = `Suspected Player Spawner: ${data.playerName}\nItem ${data.item}`;
      const admins = await this.server.getAdminsWithPermission('canseeadminchat');
      for (const adminSteamID of admins) {
        await this.server.rcon.warn(adminSteamID, adminWarningMessage);
      }
    }
  }
}
