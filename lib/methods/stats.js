/**
 * Set a stat of a member in a guild.
 *
 * @param {Discord.GuildMember} member The desired member of the stat
 * @param {string} key The key of the desired stat to set
 * @param value The value to set the stat to
**/
module.exports.setStat = function setStat(member, key, value) {
	const guild = member.guild;
	_.set(discord.guilds, `${guild.id}.members.${member.id}.${key}`, value);
}

/**
 * Delete a stat of a member in a guild.
 *
 * @param {Discord.GuildMember} member The desired member of the stat
 * @param {String} key The key of the desired stat to delete
**/
module.exports.deleteStat = function deleteStat(member, key) {
	const guild = member.guild;
	_.unset(discord.guilds, `${guild.id}.members.${member.id}.${key}`);
}

/**
 * Get a stat of a member in a guild.
 *
 * @param {Discord.GuildMember} member The desired member of the stat.
 * @param {string} key The key of the desired stat.
 * @returns The value of the stat specified.
**/
module.exports.getStat = function getStat(member, key) {
	const guild = member.guild;
	return _.get(discord.guilds, `${guild.id}.members.${member.id}.${key}`);
}