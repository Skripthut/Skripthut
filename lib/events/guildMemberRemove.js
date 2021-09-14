/** @module Discord **/
const Discord = require(`discord.js`);

/**
 * The callback function for the discord.js `guildMemberRemove` event
 * 
 * @param {Discord.GuildMember} member 
**/
module.exports = async function guildMemberAdd(member) {
	var guild = member.guild;
	/** @type {(Discord.TextChannel | Discord.ThreadChannel)} **/
	var logs = guild.channels.cache.get(discord.guilds?.[guild.id]?.message_logs);
	if (logs) { logs.send(`${member} left ${guild}!`); }
}