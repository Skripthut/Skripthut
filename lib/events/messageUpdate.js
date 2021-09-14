/** @module Discord **/
const Discord = require(`discord.js`);

/**
 * The callback function for the discord.js `messageUpdate` event
 * 
 * @param {(Discord.Message | Discord.PartialMessage)} oldMessage The message before it was updated
 * @param {(Discord.Message | Discord.PartialMessage)} newMessage The current message, after it was updated
 * @returns 
**/
module.exports = async function(oldMessage, newMessage) {
	var user = newMessage.author;
	if (user.bot) { return; }
	var oldContent = oldMessage.content;
	var newContent = newMessage.content;
	if (oldContent === newContent) { return; }
	var guild = newMessage.guild;
	var channel = newMessage.channel;
	var logs = guild.channels.cache.get(database.guilds?.[guild.id].message_logs);
	if (logs) {
		var description = `📎 **${user} edited [a message](https://database.com/channels/${guild.id}/${channel.id}/${newMessage.id}) in ${channel}.**`;
		var descLength = description.length - 2;
		const embed = new Discord.MessageEmbed()
			.setColor('#dfdf22')
			.setDescription(description)
			.setAuthor(user.tag, user.avatarURL(), user.avatarURL())
			.addFields(
				{ name: 'Old Message', value: oldContent.substr(0, Math.min(oldContent.length, 2000 - descLength)) },
				{ name: 'New Message', value: newContent.substr(0, Math.min(newContent.length, 2000 - descLength)) }
			);
		logs.send(embed);
	}
}