/** @module Discord */
const Discord = require(`discord.js`);
const client = require(`../constants/Client.js`);

/**
 * The ReactionRoleEmote class for reaction roles.
**/
module.exports = class ReactionRoleEmote {
	/**
	 * Constructor for ReactionRoleEmote, returning an object with the message ID, the channel ID, the guild ID, and the role ID.
	 *
	 * @param {Discord.Message} message The specified Message of the ReactionRoleEmote.
	 * @param {Discord.RoleResolvable} role The specified Role or Role ID Snowflake of the ReactionRoleEmote.
	**/
	constructor(message, role) {
		/**
		 * The ID of the reaction role message
		 * @type {Discord.Snowflake}
		**/
		this.id = message.id;
		/**
		 * The ID of the reaction role message's channel
		 * @type {Discord.Snowflake}
		**/
		this.channel = message.channel.id;
		const guild = message.guild;
		/**
		 * The ID of the reaction role message's guild
		 * @type {Discord.Snowflake}
		**/
		this.guild = guild.id;

		var roleId;
		if (guild.roles.cache.get(role)) { roleId = role; }
		else if (role.constructor.name === 'Role') { roleId = role.id; }
		else { throw new TypeError('Given role parameter is not a valid role ID or Role'); }

		/**
		 * The ID of the reaction role
		 * @type {Discord.Snowflake}
		**/
		this.role = roleId;
	}
	/**
	 * Change the role of a ReactionRoleEmote.
	 *
	 * @param {Discord.RoleResolvable} role The desired Role or Role ID Snowflake to change the role property of this to.
	**/
	set setRole(role) {
		var roleId = this.role;

		if (client.guilds.cache.get(this.guild)?.roles.cache.get(role)) { roleId = role; }
		else if (role instanceof Discord.Role) { roleId = role.id; }
		else { throw new TypeError('Given role parameter is not a valid role ID or Role'); }

		/**
		 * The ID of the reaction role
		 * @type {Discord.Snowflake}
		**/
		this.id = roleId;
	}
}