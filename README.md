# Squad-Protector


## Project Overview

This project utilizes SquadJS, a powerful server administration tool for the game Squad. We've integrated several plugins to enhance security and detect potential cheating behaviors within the game.

## Plugins Overview

1. **DiscordBayonetCheaterDetector.js**:
   - This plugin detects players who exploit the Bayonet weapon to kill multiple players rapidly.
   - **Configuration**:
     - `checkInterval`: Time interval for checking Bayonet kills.
     - `bayonetKills.length`: Number of kills within the specified time interval to trigger the detection.

2. **DiscordCheaterDetector.js**:
   - Simple kill counter plugin to detect suspicious kill rates.
   - **Configuration**:
     - `checkInterval`: Time interval for checking kill rates.
     - `recentKills.length`: Number of recent kills to trigger detection.

3. **DiscordPlayerConnectLogger.js**:
   - Logs player information including name, IP address, SteamID, and EOS ID.
   - **Usage**:
     - Essential for detecting lag switchers and for DDoS protection.
     - Configure paths in `config.json`:
       - `ipAddressLogFile`: Logs IP addresses for DDoS protection.
       - `playerInfoFile`: Logs player info for lag switcher detection (save as JSON).

## Setup Instructions

1. **Installation**:
   - Clone or download the SquadJS repository: `git clone https://github.com/Team-Silver-Sphere/SquadJS.git`
   - Replace Squad Protector files inside squad-server folder


2. **Configuration**:
   - Adjust configurations within each plugin file as per your server's requirements.
   - Modify `log-parser/PacketAcknowledgementWarning.js` to match the `playerInfoPath` specified in `config.json`.


## Usage Tips

- Regularly monitor plugin logs to identify and take action against potential cheaters.
- Fine-tune plugin configurations based on server activity and player feedback.


## Disclaimer

While these plugins aim to improve server security and gameplay experience, they may not catch all instances of cheating. Admin discretion is advised for handling detected cases.
