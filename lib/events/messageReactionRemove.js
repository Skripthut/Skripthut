/** @module Discord **/
const Discord = require(`discord.js`);

/**
 * The callback function for the discord.js `messageReaction` event
 * 
 * @param {(Discord.MessageReaction | Discord.PartialMessageReaction)} reaction The reaction of the event
 * @param {(Discord.User | Discord.PartialUser)} user The user of the event
**/
module.exports = async function messageReactionRemove(reaction, user) {
	if (user.bot) { return; }
	var message = reaction.message;async (guild, user) => {
	_.unset(discord.guilds, `${guild.id}.members.${user.id}.banned`);
}
	var channel = message.channel;
	const guild = message.guild;
	var member = await guild.members.fetch(user);

	const reactionRole = discord.reactionRoleMessages?.[message.id];
	if (reactionRole) {
		var emoji = reaction._emoji;
		var reactionRoleEmote = reactionRole.emotes[emoji.name] || reactionRole.emotes[emoji.id];
		if (reactionRoleEmote) { member.roles.remove(reactionRoleEmote.role, 'Unreacted to reaction role message'); }
	}
}