export default {
  regex: /^\[(\d{4}\.\d{2}\.\d{2}-\d{2}.\d{2}.\d{2}:\d{3})]\[\d+\]LogSquad: Warning: ASQPlayerController::ProcessDeployableItemRequest : Player (.+?) \[Online IDs= EOS: (\w{32}) steam: (\d{17})\] (.+?) attempted to spawn item (.+) out of line of sight/,
  onMatch: async (args, logParser) => {
    const playerName = args[5];
    const playerEOSID = args[3];
    const playerSteamID = args[4];
    const item = args[6];
    const time = args[1];



    const data = {
      ...logParser.eventStore.session[playerName],
      time,
      playerName,
      playerEOSID,
      playerSteamID,
      item
    };

    logParser.eventStore.session[playerName] = data;

    logParser.emit('ITEM_SPAWN_ATTEMPT', data);
    return data;
  }
};
