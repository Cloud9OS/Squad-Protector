import DiscordBasePlugin from './discord-base-plugin.js';

export default class DiscordBayonetCheaterDetector extends DiscordBasePlugin {
  static get description() {
    return (
      'The <code>DiscordBayonetCheaterDetector</code> plugin detects and logs instances where a player kills with ' +
      'a weapon containing "Bayonet" within a 4-second timeframe to a Discord channel for administrators to review. It also kicks the suspected cheaters automatically.'
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
      },
      warnInGameAdmins: {
        required: false,
        description: 'Whether to warn in-game admins about suspected cheaters.',
        default: true
      },
      kickCheaters: {
        required: false,
        description: 'Whether to automatically kick suspected cheaters.',
        default: true
      },
      kickMessage: {
        required: false,
        description: 'Message to send to kicked players.',
        default: 'You have been automatically kicked for suspected cheating.'
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.killsInTimeframe = new Map();
    this.checkInterval = 5000; // 5 seconds in milliseconds

    this.onWound = this.onWound.bind(this);
  }

  async mount() {
    this.server.on('PLAYER_WOUNDED', this.onWound);
  }

  async unmount() {
    this.server.removeEventListener('PLAYER_WOUNDED', this.onWound);
  }

  async onWound(info) {
    const currentTime = Date.now();

    // Check if info.attacker is not null and has a steamID property
    if (info.attacker && info.attacker.steamID) {
      // Record the kill with the weapon and timestamp
      const killInfo = { timestamp: currentTime, weapon: info.weapon };

      // Check if the player already has recorded kills
      if (!this.killsInTimeframe.has(info.attacker.steamID)) {
        this.killsInTimeframe.set(info.attacker.steamID, [killInfo]);
      } else {
        const kills = this.killsInTimeframe.get(info.attacker.steamID);
        kills.push(killInfo);
        this.killsInTimeframe.set(info.attacker.steamID, kills);
      }

      // Remove kills older than the check interval
      const recentKills = this.killsInTimeframe.get(info.attacker.steamID).filter(kill => currentTime - kill.timestamp <= this.checkInterval);
      this.killsInTimeframe.set(info.attacker.steamID, recentKills);

      // Check if there is at least one kill with a weapon containing "Bayonet"
      const bayonetKills = recentKills.filter(kill => kill.weapon.toLowerCase().includes('bayonet'));
      if (bayonetKills.length >= 3) {
        const player = await this.server.getPlayerBySteamID(info.attacker.steamID);
        if (player) {
          const description = `Player ${player.name} (${player.steamID}) has killed with a weapon containing "Bayonet" within 4 seconds. They are suspected of cheating.`;
          await this.sendDiscordMessage({
            embed: {
              title: 'Cheater Detected',
              color: this.options.color,
              description,
              timestamp: currentTime
            }
          });

          // Warn in-game admins about suspected cheater
          if (this.options.warnInGameAdmins) {
            const adminWarningMessage = `Suspected Cheater Found: ${player.name}`;
            const admins = await this.server.getAdminsWithPermission('canseeadminchat');
            for (const adminSteamID of admins) {
              await this.server.rcon.warn(adminSteamID, adminWarningMessage);
            }
          }

          // Kick suspected cheater if enabled
          this.server.rcon.kick(info.attacker.steamID, 'You have been kicked for cheating.');
        }
      }
    }
  }
}
