/** All supported discord.js events */
module.exports = {
	guildBanRemove: require(`./events/guildBanRemove.js`),
	guildMemberAdd: require(`./events/guildMemberAdd.js`),
	guildMemberRemove: require(`./events/guildMemberRemove.js`),		
	interactionCreate: require(`./events/interactionCreate.js`),		
	messageCreate: require(`./events/messageCreate.js`),
	messageDelete: require(`./events/messageDelete.js`),
	messageReactionAdd: require(`./events/messageReactionAdd.js`),	  
	messageReactionRemove: require(`./events/messageReactionRemove.js`),
	messageUpdate: require(`./events/messageUpdate.js`),
}