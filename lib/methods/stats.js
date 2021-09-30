const Discord = require(`discord.js`);
const client = require(`../constants/Client.js`);
const database = require(`../../database/database.js`);

/**
 * Set a stat of a member in a guild.
 *
 * @param {Discord.GuildMember} member The desired member of the stat
 * @param {string} key The key of the desired stat to set
 * @param value The value to set the stat to
**/
module.exports.setStat = function(member, key, value) {
	const guild = member.guild;
	_.set(database.discord.guilds, `${guild.id}.members.${member.id}.${key}`, value);
}

/**
 * Delete a stat of a member in a guild.
 *
 * @param {Discord.GuildMember} member The desired member of the stat
 * @param {String} key The key of the desired stat to delete
**/
module.exports.deleteStat = function(member, key) {
	const guild = member.guild;
	_.unset(database.discord.guilds, `${guild.id}.members.${member.id}.${key}`);
}

/**
 * Get a stat of a member in a guild.
 *
 * @param {Discord.GuildMember} member The desired member of the stat.
 * @param {string} key The key of the desired stat.
 * @returns The value of the stat specified.
**/
module.exports.getStat = function(member, key) {
	const guild = member.guild;
	return _.get(database.discord.guilds, `${guild.id}.members.${member.id}.${key}`);
}