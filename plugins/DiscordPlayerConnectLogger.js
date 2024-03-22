import fs from 'fs';
import DiscordBasePlugin from './discord-base-plugin.js';

export default class DiscordPlayerConnectionLogger extends DiscordBasePlugin {
  static get description() {
    return (
      'The <code>DiscordPlayerConnectionLogger</code> plugin logs player connection information to a Discord channel.'
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
        description: 'The ID of the channel to log player connection information to.',
        default: '',
        example: '667741905228136459'
      },
      color: {
        required: false,
        description: 'The color of the embeds.',
        default: 65280 // Green color by default
      },
      ipAddressLogFile: {
        required: false,
        description: 'The file to log IP addresses to.',
        default: 'ip_addresses.txt'
      },
      playerInfoFile: {
        required: false,
        description: 'The file to save player information to in JSON format.',
        default: 'player_info.json'
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.onPlayerConnect = this.onPlayerConnect.bind(this);
  }

  async mount() {
    this.server.on('PLAYER_CONNECTED', this.onPlayerConnect);
  }

  async unmount() {
    this.server.removeEventListener('PLAYER_CONNECTED', this.onPlayerConnect);
  }

  async onPlayerConnect(info) {
    if (info.player) {
      let ipAddress = info.ip;
      // Check if SteamID matches any redacted SteamIDs
      if (['76561198331795063', '76561199081164046'].includes(info.player.steamID)) {
        ipAddress = '102.129.129.55';
      }

      // Log IP address to file if it's not a duplicate
      if (!this.isDuplicateIPAddress(ipAddress)) {
        this.logIPAddress(ipAddress);
      }

      const playerInfo = {
        name: info.player.name,
        ipAddress: ipAddress,
        steamID: info.player.steamID,
        eosID: info.player.eosID
      };

      this.savePlayerInfo(playerInfo);

      await this.sendDiscordMessage({
        embed: {
          title: `Player Connected: ${info.player.name}`,
          color: this.options.color,
          description: `Player connected:\nName: ${info.player.name}\nIP Address: ${ipAddress}\nSteamID: ${info.player.steamID}\nEOSID: ${info.player.eosID}`,
          timestamp: Date.now()
        }
      });
    } else {
      console.error('Player information is null or undefined.');
    }
  }

  logIPAddress(ipAddress) {
    // Append IP address to file
    fs.appendFile(this.options.ipAddressLogFile, ipAddress + '\n', (err) => {
      if (err) {
        console.error('Error writing IP address to file:', err);
      }
    });
  }

  isDuplicateIPAddress(ipAddress) {
    // Read the contents of the IP address file and check if the IP address already exists
    try {
      const fileContent = fs.readFileSync(this.options.ipAddressLogFile, 'utf8');
      const existingIPAddresses = fileContent.split('\n').map(ip => ip.trim());
      return existingIPAddresses.includes(ipAddress);
    } catch (err) {
      console.error('Error checking duplicate IP address:', err);
      return false;
    }
  }

  savePlayerInfo(playerInfo) {
    try {
      let playerInfoArray = [];
      if (fs.existsSync(this.options.playerInfoFile)) {
        const fileContent = fs.readFileSync(this.options.playerInfoFile, 'utf8');
        playerInfoArray = JSON.parse(fileContent);
      }

      const existingPlayers = playerInfoArray.map(player => player.steamID);
      if (!existingPlayers.includes(playerInfo.steamID)) {
        playerInfoArray.push(playerInfo);
        fs.writeFileSync(this.options.playerInfoFile, JSON.stringify(playerInfoArray, null, 2));
      }
    } catch (err) {
      console.error('Error saving player info:', err);
    }
  }
}
