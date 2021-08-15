/** @module Discord **/
const Discord = require(`discord.js`);

/**
 * The callback function for the discord.js `messageCreate` event
 * 
 * @param {Discord.Message} message The message of the event
**/
module.exports = async function messageCreate(message) {
	var user = message.author;
	if (user.bot) { return; }

	var { guild, channel, content } = message;
	var member = await guild.members.fetch(user);
	var lower = content.toLowerCase();
	
	if (member.permissions.has("ADMINISTRATOR")) {
		if (lower.includes('!eval')) {
			try {
				const result = await eval(`(async () => { ${content.substr(6, lower.length)} })();`);
				if (result) {
					const resultString = result.toString();
					const resultStringLength = resultString.length;
					if (resultStringLength && resultStringLength <= 5000) { channel.send(resultString); }
				}
			}
			catch (error) {
				if (!error instanceof EvalError) { console.error(error); } 
				else { throw error; }
			}
		}
	}
}