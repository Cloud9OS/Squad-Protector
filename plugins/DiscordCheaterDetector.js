import DiscordBasePlugin from './discord-base-plugin.js';

export default class DiscordCheaterDetector extends DiscordBasePlugin {
  static get description() {
    return (
      'The <code>DiscordCheaterDetector</code> plugin detects and logs instances where a player kills more than 9 ' +
      'players within an 65-second timeframe to a Discord channel for administrators to review.'
    );
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      ...DiscordBasePlugin.optionsSpecification,
      channelID: {
        required: true,
        description: 'The ID of the channel to log cheater information to.',
        default: '',
        example: '667741905228136459'
      },
      color: {
        required: false,
        description: 'The color of the embeds.',
        default: 16761867
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.killsInTimeframe = new Map();
    this.checkInterval = 65000; // 11 seconds in milliseconds

    this.onWound = this.onWound.bind(this);
    this.checkCheaters = this.checkCheaters.bind(this);
  }

  async mount() {
    this.server.on('PLAYER_WOUNDED', this.onWound);
    this.checkIntervalId = setInterval(this.checkCheaters, this.checkInterval);
  }

  async unmount() {
    this.server.removeEventListener('PLAYER_WOUNDED', this.onWound);
    clearInterval(this.checkIntervalId);
  }

  async onWound(info) {
    const currentTime = Date.now();

    // Check if info.attacker is not null and has a steamID property
    if (info.attacker && info.attacker.steamID) {
      if (!this.killsInTimeframe.has(info.attacker.steamID)) {
        this.killsInTimeframe.set(info.attacker.steamID, [currentTime]);
      } else {
        const timestamps = this.killsInTimeframe.get(info.attacker.steamID);
        timestamps.push(currentTime);
        this.killsInTimeframe.set(info.attacker.steamID, timestamps);
      }
    }
  }

  async checkCheaters() {
    const currentTime = Date.now();
    for (const [steamID, timestamps] of this.killsInTimeframe.entries()) {
      const recentKills = timestamps.filter(ts => currentTime - ts <= this.checkInterval);
      if (recentKills.length > 9) {
        const player = await this.server.getPlayerBySteamID(steamID);
        if (player) {
          await this.sendDiscordMessage({
            embed: {
              title: `Cheater Detected: ${player.name}`,
              color: this.options.color,
              description: `Player ${player.name} (${player.steamID}) has killed ${recentKills.length} players within 65 seconds.`,
              timestamp: currentTime
            }
          });
        }
      }
      // Remove timestamps older than the check interval
      this.killsInTimeframe.set(steamID, timestamps.filter(ts => currentTime - ts <= this.checkInterval));
    }
  }
}
