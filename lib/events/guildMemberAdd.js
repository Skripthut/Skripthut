/** @module Discord **/
const Discord = require(`discord.js`);

/**
 * The callback function for the discord.js `guildMemberAdd` event
 * 
 * @param {Discord.GuildMember} member 
**/
module.exports = async function guildMemberRemove(member) {
	const guild = member.guild;
	const user = member.user;
	client.channels.cache.get('854842141498277908')?.send(
		shuffle(discord.guilds?.[guild.id]?.joinMessages || [
			"\\:O It's ${user}, thanks for joining!",
			"Welp, here's ${user}...",
			"Well then, ${user}'s here...",
			"Whoa, whoa, whoa, when did ${user} get here?",
			"Ah shoot, here comes ${user}...",
			"And then came ${user}!"
		])[0]
			.replace('${user}', user.toString()) // Replace ${user} with the user's tag (username#discriminator)
			.replace('${user.tag}', user.tag) // Replace ${user.mention} with the user's mention
			.replace('${guild}', guild.name) // Replace ${guild} with the guild name
	); // Gets join messages, shuffles, and replaces format strings with values
};