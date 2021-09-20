/** @module Discord */
const Discord = require(`discord.js`);
const database = require(`../../database/database.js`);

/**
 * The callback function for the discord.js `messageDelete` event
 * 
 * @param {Discord.Message} message The message of the event
**/
module.exports = async function(message) {
	var user = message.author;
	if (user.bot) { return; }

	var { guild, channel, content } = message;

	var logs = guild.channels.cache.get(database.discord.guilds?.[guild.id].message_logs);
	if (logs) {
		var description = `📎 **A message sent by ${user} was deleted in ${channel} (ID: ${message.id}).**`;
		var descLength = description.length - 2;
		const embed = new Discord.MessageEmbed()
			.setColor('#e73535')
			.setDescription(description)
			.setAuthor(user.tag, user.avatarURL(), user.avatarURL())
			.addFields(
				{ name: 'Message Content', value: content.substr(0, Math.min(content.length, 4000 - descLength)) }
			);
		logs.send(embed);
	}
};