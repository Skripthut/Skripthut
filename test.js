const Discord = require(`discord.js`);
const fs = require(`fs-extra`);

const client = new Discord.Client();

var clientData = loadJSON('./discord/client.json');

/**
 * Read a file and parse it using JSON.
 *
 * @param {String} file The directory of the file you want to load.
 * @returns {JSON} Returns the stringified JSON as JavaScript object.
**/
function loadJSON(file) {
    return JSON.parse(fs.readFileSync(file, `utf8`));
}

console.log('starting');

client.on('ready', () => {
	console.log('ready yay');
});

client.login(Buffer.from(clientData.encodedBotToken, 'base64').toString('ascii'));