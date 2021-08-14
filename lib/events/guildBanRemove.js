/** @module Discord **/
const Discord = require(`discord.js`);

/**
 * The callback function for the discord.js `guildBanRemove` event
 * 
 * @param {Discord.GuildBan} ban The ban data
**/
module.exports = async function guildBanRemove(ban) {
    const guild = ban.guild;
    const user = ban.user;
	_.unset(discord.guilds, `${guild.id}.members.${user.id}.banned`);
}