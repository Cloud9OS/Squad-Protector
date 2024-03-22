import fs from 'fs';

const playerInfoPath = 'C:/Users/Administrator/Desktop/anti/new2/player_info.json';

const getPlayerInfo = async (eosID) => {
    try {
        const playerInfo = JSON.parse(fs.readFileSync(playerInfoPath, 'utf8'));
        const player = playerInfo.find(player => player.eosID === eosID);
        return player;
    } catch (error) {
        console.error('Error reading player info:', error);
        return null;
    }
};


export default {
    regex: /^\[(\d{4}\.\d{2}\.\d{2}-\d{2}.\d{2}.\d{2}:\d{3})]\[\d+\]LogNet: Warning: UNetConnection::ReceivedPacket - Too many received packets to ack \(256\) since last sent packet\. InSeq: (\d+) \[UNetConnection\] RemoteAddr: (\d+\.\d+\.\d+\.\d+):\d+, Name: EOSIpNetConnection_(\w+), Driver: GameNetDriver EOSNetDriver_\d+, IsServer: YES, PC: BP_PlayerController_C_\d+, Owner: BP_PlayerController_C_\d+, UniqueId: RedpointEOS:(\w+) NextOutGoingSeq: (\d+)/,
    onMatch: async function (args, logParser) {
        const time = args[1];
        const eosID = args[5];
        const ipAddress = args[3];
        let playerName = "Unknown";
        let steamID = "Unknown";

        const player = await getPlayerInfo(eosID);
        if (player) {
            playerName = player.name;
            steamID = player.steamID;
        }

        const logMessage = `[${time}] Packet acknowledgment warning received from ${playerName} (EOS: ${eosID}, SteamID: ${steamID}, IP Address: ${ipAddress}`;

        const data = {
            time,
            playerName,
            eosID,
            steamID,
            ipAddress
        };

        logParser.emit('PACKET_ACKNOWLEDGMENT_WARNING', data);
        return data;
    }
};
