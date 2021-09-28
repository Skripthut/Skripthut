/** @module Discord */
const Discord = require(`discord.js`);
const client = require(`./lib/constants/Client.js`);
const database = require(`../../database/database.js`);

/**
 * The callback function for the discord.js `messageReaction` event
 * 
 * @param {(Discord.MessageReaction | Discord.PartialMessageReaction)} reaction The reaction of the event
 * @param {(Discord.User | Discord.PartialUser)} user The user of the event
**/
module.exports = async function(reaction, user) {
	if (!user || user.bot) { return; }
	var message = reaction.message;
	var channel = message.channel;
	console.log('reaction', reaction, channel.type);
	const guild = message.guild;
	var member = await guild.members.fetch(user);

	const reactionRole = database.discord.reactionRoleMessages?.[message.id];
	if (reactionRole) {
		var emoji = reaction.emoji;
		var reactionRoleEmote = reactionRole.emotes[emoji.name] || reactionRole.emotes[emoji.id];
		if (reactionRoleEmote) { member.roles.remove(reactionRoleEmote.role, 'Unreacted to reaction role message'); }
	}
}