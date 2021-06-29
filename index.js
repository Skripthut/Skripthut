'use strict';

/**
 * Returns a number limited between the specified minimum and maximum.
 * 
 * @param {number} number The desired number to limit
 * @param {number} min The lowest the specified number can be
 * @param {number} max The highest the specified number can be
**/
function limit(number, min, max) {
	return Math.max(Math.min(number, max), min);
}

/**
 * Returns a shuffled copy of this array. Please advise from using this with massive arrays, since this can produce lag.
 * 
 * @param {number} [totalElements] The total amount of elements to return (this value is limited to the length of the list -- negative or positive -- and defaults to the length of the list if unspecified)
 * @returns {any[]} Returns a shuffled copy of this array
**/
Array.prototype.shuffle = function(totalElements) {
	var length = this.length;
	totalElements = (totalElements === undefined) ? length : limit(totalElements, length * (-1) + 1, length);
	var array = [ ...this ];
    for (let i = length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ array[i], array[j] ] = [ array[j], array[i] ];
    }
	return array.slice(0, totalElements);
}

console.log([ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 ].shuffle(8));

/**
 * @module Discord
**/
const Discord = require(`discord.js`);
const fs = require(`fs-extra`);

var clientData = loadJSON('./discord/client.json');

const client = new Discord.Client(/*{ ws: { intents: Discord.Intents.PRIVILEGED } }*/);
var discord = loadJSON('./discord/discord.json');

var skripthut = "https://i.imgur.com/ocMfwH5.png";

/**
 * The ReactionRoleEmote class for reaction roles.
**/
class ReactionRoleEmote {
	/**
	 * Constructor for ReactionRoleEmote, returning an object with the message ID, the channel ID, the guild ID, and the role ID.
	 *
	 * @param {Discord.Message} message The specified Message of the ReactionRoleEmote.
	 * @param {(Discord.Snowflake | Discord.Role)} role The specified Role or Role ID Snowflake of the ReactionRoleEmote.
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
		/**
		 * The ID of the reaction role message's guild
		 * @type {Discord.Snowflake}
		**/
		this.guild = message.guild.id;

		var roleId;
		if (message.guild.roles.cache.get(role)) { roleId = role; }
		else if ((role.constructor || {}).name === 'Role') { roleId = role.id; }
		else { throw new Error('Given role parameter is not a valid role ID or Role'); }

		/**
		 * The ID of the reaction role
		 * @type {Discord.Snowflake}
		**/
		this.role = roleId;
	}
	/**
	 * Change the role of a ReactionRoleEmote.
	 *
	 * @param {(Discord.Snowflake | Discord.Role)} role The desired Role or Role ID Snowflake to change the role property of this to.
	**/
	set setRole(role) {
		var roleId = this.role;

		if (message.guild.cache.get(role)) { roleId = role; }
		else if (role.constructor.name === 'Role') { roleId = role.id; }
		else { throw new Error('Given role parameter is not a valid role ID or Role') }

		/**
		 * The ID of the reaction role
		 * @type {Discord.Snowflake}
		**/
		this.id = roleId;
	}
}

/**
 * Read a file and parse it using JSON.
 *
 * @param {String} path The directory of the file you want to load.
 * @returns Returns the stringified JSON as JavaScript object.
**/
function loadJSON(path) {
	return JSON.parse(fs.readFileSync(path, `utf8`));
}
/**
 * Stringifies JSON and writes it into a file.
 *
 * @param {String} path The directory of the file you want to write.
 * @param data The JSON to be stringified.
 * @returns Returns the writeFile Promise.
**/
async function writeJSON(path, data) {
	return fs.writeFile(path, JSON.stringify(data, null, 4), `utf8`);
}

/**
 * Gets the application of the Discord client in a specific guild.
 *
 * @param {String} guildId The ID of the specific guild.
 * @returns Returns the application for the specified guild.
**/
function getApp(guildId) {
	const app = client.api.applications(client.user.id);
	if (guildId) {
		app.guilds(guildId);
	}
	return app;
}
/**
 * Delete all commands currently on Discord server.
 *
 * @param {string} guildId The ID of the guild which the commands you want to delete are on.
 * @returns Returns once all commands are deleted.
**/
async function deleteCommands(guildId) {
	const commands = getApp(guildId).commands;
	const awaitCommands = await commands.get();
	for (const command of awaitCommands) {
		var deleteCommand = getApp(guildId).commands(command.id);
		await deleteCommand.delete();
	}
	return true;
}
/**
 * Register all commands stored in discord.json.
 *
 * @param {string} guildId The ID of the guild you want to register the commands onto.
 * @param {boolean} ignoreSame If true, do not register commands that are identical to already registered commands.
 * @param {boolean} deleteUnset If true, delete all commands that have no identical registered commands.
 * @returns Returns once all commands are registered.
**/
async function registerCommands(guildId, ignoreSame = true, deleteUnset = true) {
	const commands = getApp(guildId).commands;

	var awaitCommands = {};
	if (ignoreSame) {
		awaitCommands = await commands.get();
	}

	var unset = {};
	if (deleteUnset) {
		for (const awaitCommand of awaitCommands) {
			unset[awaitCommand.id] = true;
		}
	}

	commandLoop: for (const command of discord.commands) {
		for (const awaitCommand of awaitCommands) {
			var id = awaitCommand.id;
			[ 'id', 'application_id', 'version', 'guild_id', 'default_permission' ].forEach((key) => delete awaitCommand[key]);
			if (JSON.stringify(command) === JSON.stringify(awaitCommand)) {
				delete unset[id];
				continue commandLoop;
			}
		}
		console.log(`register ${command.name}`);
		await commands.post({
			data: command
		});
		discord.totalRegisteredCommands++;
	}
	/*if (deleteUnset) {
		for (const unsetCommand in unset) {
			var deleteCommand = getApp(guildId).commands(unsetCommand);
			console.log(`unset delete ${deleteCommand.name}`, deleteCommand, ''+deleteCommand);
			await deleteCommand.delete();
		}
	}*/
	return true;
}

var millis = {};
millis.seconds = [ 's', 1000 ];
millis.minutes = [ 'm', millis.seconds[1] * 60 ];
millis.hours = [ 'h', millis.minutes[1] * 60 ];
millis.days = [ 'd', millis.hours[1] * 24 ];
millis.years = [ 'y', millis.days[1] * 365 ];

var timespanRegex = {};
for (const key of Object.keys(millis)) {
	timespanRegex[key] = RegExp(`[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+) *${millis[key][0]}`, 'gi');
}

/**
 * Get millis from a formatted string:
 * 
 * { [x]s - seconds, [x]m - minutes, [x]h - hours, [x]d - days, [x]y - years } where [x] is any floating point number
 * 
 * @param {string} string The formatted string to parse
 * @returns Returns millis from formatted string
**/
async function getMillisFromString(string) {
	if (!string) { return NaN; }
	var millisTimespan = 0;
	for (const key of Object.keys(timespanRegex)) {
		[ ...string.matchAll(timespanRegex[key]) ].forEach((timespan) => {
			millisTimespan += parseFloat(timespan[1]) * millis[key][1];
		});
	}
	return millisTimespan;
}

/**
 * @param {number} millisTimespan The length of the punishment in milliseconds
 * @returns Returns an object containing the total milliseconds of the formatted timespan, and a readable timespan using said milliseconds
**/
async function getPunishmentDetails(millisTimespan) {
	var timespan = await getMillisFromString(millisTimespan);
	if (timespan === Infinity || timespan === NaN) { return null; }

	var now = Date.now();
	var milliseconds = timespan;

	/** @type {string[]} **/
	var time = [];
	for (const key of Object.keys(millis).reverse()) {
		var milliValue = Math.floor(timespan / millis[key][1]);
		if (milliValue) { time.push(`${milliValue} ${milliValue === 1 ? key.substr(0, key.length - 1) : key}`); }
		timespan -= milliValue * millis[key][1];
	}

	return {
		now: now,
		milliseconds: milliseconds,
		readableTimespan: time.join(", "),
		endDate: (milliseconds) ? new Date(now + milliseconds) : null
	};
}

var permissionMessage;
var guildId;
var guild;
var skripter;
var tickets;
client.on('ready', async () => {
	console.log(`Logged in as ${client.user.tag}!`);

	permissionMessage = `You don't have permission to do this!`;
	guildId = "854838419677904906";
	guild = client.guilds.cache.get(guildId);
	skripter = "854841582754857000";
	tickets = "854954327268786227";

	//await deleteCommands(guildId);
	await registerCommands(guildId);

	client.ws.on('INTERACTION_CREATE', async (interaction) => { // WebSocket Interaction Create Event (for slash commands)
		const { name, options } = interaction.data;
		const command = name.toLowerCase();

		/**
		 * The ID of the guild of the interaction
		 * @type {Discord.Snowflake}
		**/
		const guild_id = interaction.guild_id;
		/**
		 * The guild of the interaction
		 * @type {Discord.Guild}
		**/
		const guild = client.guilds.cache.get(guild_id);

		/**
		 * The ID of the channel of the interaction
		 * @type {Discord.Snowflake}
		**/
		const channel_id = interaction.channel_id;
		/**
		 * The channel of the interaction
		 * @type {Discord.TextChannel}
		**/
		const channel = guild.channels.cache.get(channel_id);

		/**
		 * The ID of the user who created the interaction
		 * @type {Discord.Snowflake}
		**/
		const user_id = interaction.member.user.id;
		/**
		 * The user who created the interaction
		 * @type {Discord.User}
		**/
		const user = client.users.cache.get(user_id);

		/** The GuildMember version of the user who created the interaction **/
		const member = guild.member(user);

		const args = {};
		if (options) {
			for (const option of options) {
				const { name, value } = option;
				args[name] = value;
			}
		}

		console.log(`${user.tag} executed /${command}`);

		switch(command) {
			/*
			 * Reaction Commands
			 */

			// CREATETICKET COMMAND
			case 'createticket':
				if (!member.hasPermission("MANAGE_MESSAGES")) {
					reply(interaction, 'no lmao');
					break;
				}
				reply(interaction, 'Sending ticket messsage...');
				var ticketChannel = await client.channels.cache.get(args.channel);
				var message = args.message.replace(/%(n(?:ew)?l(?:ine)?|line ?break)%/g, "\n");
				ticketChannel.send(message).then((message) => {
					discord.ticketMessages[message.id] = {
						id: message.id,
						description: args.description,
						channel: args.channel
					};
					message.react(`📰`);
				});
				break;
				// END CREATETICKET COMMAND

			// CLOSE COMMAND
			case 'close':
				if (discord.tickets[channel_id]) {
					var creator = guild.member(client.users.cache.get(discord.tickets[channel_id].member));

					if (discord.tickets[channel_id].closed) {
						reply(interaction, 'Closing permanently...');
						await channel.delete("Ticket closed permanently");
						delete discord.tickets[channel_id];
						break;
					}
					reply(interaction, 'Closed...');
					const id = creator.id;
					const type = "member";

					const permissionOverwrite = await channel.permissionOverwrites.find((overwrites) => overwrites.type === type && overwrites.id === id);
					if (permissionOverwrite) { await permissionOverwrite.delete("Ticket closed"); }

					deleteStat(creator, "hasTicket");
					discord.tickets[channel_id].closed = true;

					channel.send('__Do `/close` again to permanently close the ticket.__')
					break;
				}
				reply(interaction, 'You can only use this in a ticket channel!')
				break;
				// END CLOSE COMMAND

			/*
			 * Role Commands
			*/

			// ROLE COMMAND
			case 'role':
				if (!member.hasPermission("MANAGE_ROLES")) {
					reply(interaction, permissionMessage);
					break;
				}
				var option = options[0];
				var type = option.name;

				if (type === 'grant') {
					var highestRole = member.roles.highest;
					var role = guild.roles.cache.get(option.options[1].value);
					if (highestRole.position <= role.position) {
						reply(interaction, `You don't have enough permission to grant ${role}!`);
						break;
					}
					var target = guild.member(option.options[0].value);
					var reason = (option.options[2] || { value: `Granted by ${user.tag}`}).value;

					reply(interaction, `Added ${role} to ${target}'s roles...`);
					target.roles.add(role, reason);
					break;
				}
				if (type === 'revoke') {
					var highestRole = member.roles.highest;
					var role = guild.roles.cache.get(option.options[1].value);
					if (highestRole.position <= role.position) {
						reply(interaction, `You don't have enough permission to revoke ${role}!`);
						break;
					}
					var target = guild.member(option.options[0].value);
					var reason = (option.options[2] || { value: `Removed by ${user.tag}`}).value;

					reply(interaction, `Removed ${role} from ${target}'s roles...`);
					target.roles.remove(role, reason);
					break;
				}
				if (type === 'roles') {
					if (option.options) {
						var role = guild.roles.cache.get(option.options[0].value);
						const embed = new Discord.MessageEmbed()
							.setColor('#0099ff')
							.setTitle(role.name)
							.setAuthor('Skripthut', skripthut, skripthut)
							.setDescription(`This is all the information of ${role}.`)
							.addFields(
								{ name: 'Ticket Description', value: ticket.description },
								{ name: 'Extra Info', value: 'Do `/close` to close the ticket. You may only have one ticket at a time.'}
							)
							.setFooter(`Requested by ${user.tag}`, user.avatarURL());
						reply(interaction, embed);
						break;
					}
					var roles = Array.from(guild.roles.cache);
					var roleInfo = [];
					for (var i = 0; i < roles.length; i++) {
						var role = roles[i][1];
						roleInfo[i] = role;
					}
					reply(interaction, `${roleInfo}`);
					break;
				}
				reply(interaction, `noob`);
				break;
			// END ROLE COMMAND

			// REACTIONROLE COMMAND
			case 'reactionrole':
				if (!member.hasPermission("MANAGE_ROLES")) {
					reply(interaction, permissionMessage);
					break;
				}
				var option = options[0];
				var type = option.name;

				if (type === 'create') {
					var chosenEmote = (option.options[2] || { value: '📰' }).value;

					if (chosenEmote.match(/\p{Extended_Pictographic}/u)) {
						var reactionRoleEmote = chosenEmote;
						var reactionRoleEmoteId = chosenEmote;
					}
					else {
						var reactionRoleEmote = client.emojis.cache.find((emote) => emote.name.toLowerCase() === chosenEmote || emote.id === chosenEmote) || { id: '' };
						var reactionRoleEmoteId = reactionRoleEmote.id;
					}

					if (!reactionRoleEmoteId) {
						reply(interaction, `That's not a valid emote!`);
						break;
					}

					var reactionRoleChannel = guild.channels.cache.get(option.options[0].value);
					var reactionRoleMessage = option.options[1].value.replace(/%(n(?:ew)?l(?:ine)?|line ?break)%/g, "\n");
					var reactionRole = option.options[3].value;

					var sentMessage = reactionRoleChannel.send(reactionRoleMessage);
					await reply(interaction, 'Sending...');

					sentMessage.then(async (message) => {
						await message.react(reactionRoleEmote);
						discord.reactionRoleMessages[message.id] = {
							id: message.id,
							emotes: {}
						}
						discord.reactionRoleMessages[message.id].emotes[reactionRoleEmoteId] = new ReactionRoleEmote(message, reactionRole);
					});
					break;
				}

				if (type === 'add') {
					var ids = Array.from(option.options[0].value.matchAll(/https:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/))[0]; // Get ID's from URL

					if (ids[1] !== guild_id) {
						reply(interaction, `That's not a valid message URL (guild ID invalid)!`);
						break;
					}
					var reactionRoleChannel = guild.channels.cache.get(ids[2]);
					if (!reactionRoleChannel) {
						reply(interaction, `That's not a valid message URL (channel ID invalid)!`);
						break;
					}
					var reactionRoleMessageId = ids[3];
					var reactionRoleMessage = await reactionRoleChannel.messages.fetch(reactionRoleMessageId);
					if (!reactionRoleMessage) {
						reply(interaction, `That's not a valid message URL (message ID invalid)!`);
						break;
					}

					var chosenEmote = (option.options[1] || { value: '📰' }).value;

					if (chosenEmote.match(/\p{Extended_Pictographic}/u)) {
						var reactionRoleEmote = chosenEmote;
						var reactionRoleEmoteId = chosenEmote;
					}
					else {
						var reactionRoleEmote = client.emojis.cache.find((emote) => emote.name.toLowerCase() === chosenEmote || emote.id === chosenEmote) || { id: null };
						var reactionRoleEmoteId = reactionRoleEmote.id;
					}

					if (!reactionRoleEmoteId) {
						reply(interaction, `That's not a valid emote!`);
						break;
					}

					var reactionRole = option.options[2].value;

					const _reactionRoleMessage = Get(discord, `reactionRoleMessages.${reactionRoleMessageId}`);
					if (_reactionRoleMessage) {
						const emotes = _reactionRoleMessage.emotes;
						if (emotes[reactionRoleEmoteId]) {
							reply(interaction, `This reaction role message already has this emote set!`);
							break;
						}
						if (JSON.stringify(emotes).includes(reactionRole)) {
							reply(interaction, `This reaction role message already has this role set!`);
							break;
						}
					}

					await reply(interaction, 'Adding...');
					await reactionRoleMessage.react(reactionRoleEmote);
					if (!_reactionRoleMessage) {
						Set(discord, `reactionRoleMessages.${reactionRoleMessageId}`, 
						{
							id: reactionRoleMessageId,
							emotes: {}
						});
					}
					discord.reactionRoleMessages[reactionRoleMessageId].emotes[reactionRoleEmoteId] = new ReactionRoleEmote(reactionRoleMessage, reactionRole);
					break;
				}

				if (type === 'remove') {
					var ids = Array.from(option.options[0].value.matchAll(/https:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/))[0]; // Get ID's from URL

					if (ids[1] !== guild_id) {
						reply(interaction, `That's not a valid message URL (guild ID invalid)!`);
						break;
					}
					var reactionRoleChannel = guild.channels.cache.get(ids[2]);
					if (!reactionRoleChannel) {
						reply(interaction, `That's not a valid message URL (channel ID invalid)!`);
						break;
					}
					var reactionRoleMessageId = ids[3];
					var reactionRoleMessage = await reactionRoleChannel.messages.fetch(reactionRoleMessageId);
					if (!reactionRoleMessage) {
						reply(interaction, `That's not a valid message URL (message ID invalid)!`);
						break;
					}

					var _reactionRoleMessage = Get(discord, `reactionRoleMessages.${reactionRoleMessageId}`);

					if (!_reactionRoleMessage) {
						reply(interaction, `This message doesn't have any reaction roles!`);
						break;
					}

					var reactionRoleId = option.options[1].value;

					const emotes = _reactionRoleMessage.emotes;
					const keys = Object.keys(emotes);
					for (var i = 0; i < keys.length; i++) {
						const key = keys[i];
						if (emotes[key].role === reactionRoleId) {
							var reactionRoleEmote = key;
							delete discord.reactionRoleMessages[reactionRoleMessageId].emotes[key];
						}
					}

					if (!Object.keys(discord.reactionRoleMessages[reactionRoleMessageId].emotes).length) {
						delete discord.reactionRoleMessages[reactionRoleMessageId];
					}

					if (!reactionRoleEmote) {
						reply(interaction, `This message doesn't have that role!`);
						break;
					}

					var reactionRole = guild.roles.cache.get(reactionRoleId);

					reply(interaction, `Removing ${reactionRole} from the specified message...`);
					reactionRoleMessage.reactions.resolve(reactionRoleEmote).remove();
					break;
				}
				reply(interaction, 'bruh moment');
				break;

			// COLOURROLE COMMAND
			case 'colourrole':
				var roles = member.roles.cache;
				var hasRoles =
				(
					roles.get('854843596553715814') ||
					roles.get('244542234895187979') ||
					roles.get('422479365255987202') ||
					roles.get('854843824818618379') ||
					roles.get('854841465087852574')
				);
				if (!hasRoles && !member.hasPermission("MANAGE_ROLES")) {
					reply(interaction, permissionMessage);
					break;
				}

				var option = options[0];
				var type = option.name;

				if (type === 'create') {
					var color = option.options[0].value
						.replace(`#`, ``);

					if (color.match(/[a-f0-9]{6}/i)) {
						var createdRole = `#${color.toUpperCase()}`;
						var highestRole = member.roles.highest;
						guild.roles.create(
						{
							data: {
								name: createdRole,
								color: color,
								position: highestRole.position + 1
							},
							reason: `Created colour role for ${member}`,
						})
							.then(async (result) => {
								const embed = new Discord.MessageEmbed()
									.setColor(color)
									.setTitle(createdRole)
									.setAuthor('Skripthut', skripthut, skripthut)
									.setDescription(`Created the colour role ${result}`)
									.setFooter(`Requested by ${user.tag}`, user.avatarURL());
								reply(interaction, embed);
								await member.roles.add(result.id);

								var colourRole = await getStat(member, "colourRole");
								if(colourRole) {
									var role = await guild.roles.cache.get(colourRole);
									if (role !== null && role !== undefined) {
										role.delete();
									}
								}
								setStat(member, "colourRole", result.id);
							});
						break;
					}
					reply(interaction, `Please input a valid HEX code as a colour.`);
					break;
				}
				if (type === 'remove') {
					if(getStat(member, "colourRole")) {
						var role = guild.roles.cache.get(getStat(member, "colourRole"));
						if (role !== null && role !== undefined) {
							await role.delete();
							deleteStat(member, "colourRole");
							reply(interaction, 'Deleted your colour role...');
							break;
						}
						reply(interaction, `You have a colour role... but it's invalid`);
						break;
					}
					reply(interaction, `You currently don't have a colour role...`);
				}
				break;
			// END COLOURROLE COMMAND

			/*
			 * Moderator Commands 
			 */
			case 'ban':
				if (!member.hasPermission("BAN_MEMBERS")) {
					reply(interaction, permissionMessage);
					break;
				}

				var targetMember = await guild.members.fetch(args.member);
				if (!targetMember) {
					reply(interaction, `That's not a valid member!`);
					break;
				}
				var target = targetMember.user;

				if (args.timespan) {
					var details = await getPunishmentDetails(args.timespan);
					console.log(details);
					if (!details) {
						reply(interaction, `That's not a valid timespan (where [x] is any number: [x]s, [x]m, [x]h, [x]d, [x]y)!`);
						break;
					}
					Set(discord.guilds, `${guild_id}.members.${target.id}.banned`, {
						banDate: details.now,
						banTime: details.milliseconds,
						moderator: user_id
					});
				}

				var reason = args.reason || "Not kool enough to stay in Skripthut";
				
				target.send('u ban lmao')
					.then((message) => {
						console.log(message);
					})
					.catch(() => {});
				targetMember.ban({ reason: reason });
				console.log(now, details.milliseconds);
				reply(interaction,
					new Discord.MessageEmbed()
						.setColor('#ff2f2f')
						.setAuthor(target.tag, target.avatarURL(), target.avatarURL())
						.setDescription(`Details for ${target}'s ban from ${guild.name}`)
						.addFields(
							{ name: 'Ban Length', value: details.readableTimespan || "Infinite" },
							{ name: 'Lasts Until', value: details.endDate || "Forever" },
							{ name: 'Reason', value: reason }
						)
						.setFooter(`Banned by ${user.tag}`, user.avatarURL())
				)
				break;
			case 'mute':
				var hasRoles =
				(
					roles.get('854842705363992586')
				);
				if (!hasRoles && !member.hasPermission("MANAGE_ROLES")) {
					reply(interaction, permissionMessage);
					break;
				}

				var target = client.users.cache.get(args.member);
				var targetMember = guild.member(target);

				if (args.timespan) {
					var details = await getPunishmentDetails(args.timespan);
					console.log(details);
					if (!details) {
						reply(interaction, `That's not a valid timespan (let [x] be any number: [x]s, [x]m, [x]h, [x]d, [x]y)!`);
						break;
					}
					setStat(targetMember, "banDate", now);
					setStat(targetMember, "banTime", details.milliseconds);
				}

				var reason = args.reason || "Not kool enough to stay in Skripthut";
				
				target.ban({ reason: `${reason} (${user.tag})` });
				console.log(now, details.milliseconds);
				reply(interaction,
					new Discord.MessageEmbed()
						.setColor('#ff2f2f')
						.setTitle('Ban Details')
						.setAuthor(target.tag, target.avatarURL(), target.avatarURL())
						.setDescription(`Details for ${target}'s ban from ${guild.name}`)
						.addFields(
							{ name: 'Ban Length', value: details.readableTimespan || "Infinite" },
							{ name: 'Lasts Until', value: details.endDate || "Forever" },
							{ name: 'Reason', value: reason }
						)
						.setFooter(`Banned by ${user.tag}`, user.avatarURL())
				)
				break;

			/*
			 * Admin Commands
			 */

			/*
			 * Miscellaneous Commands
			 */
			case 'tomato':
				reply(interaction, `tomato`);
				break;

			case 'remindme':
				var option = options[0];
				var type = option.name;

				var time = option.options[0].value;

				if (type === 'at') {
					if (time === 'help') {
						var examples = [
							'01 Jan 1970 00:00:00 GMT',
							'2021 06 28',
							'04 Dec 1995',
							'2015-02-31'
						];
						const embed = new Discord.MessageEmbed()
							.setColor('#808080')
							.setTitle('Date Format')
							.setAuthor('Skripthut', skripthut, skripthut)
							.setDescription(`This command uses the [JavaScript Date Format](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse#description).`)
							.addFields(
								{ name: 'Format', value: 'One of the formats is the [ISO Date Format](https://www.ionos.ca/digitalguide/websites/web-development/iso-8601/). \nCheck out [JavaScript Date Time String Format](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse#date_time_string_format) and [JavaScript Implementation-Specific Date Formats](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse#fall-back_to_implementation-specific_date_formats) for more details.' },
								{ name: 'Example Usage', value: '```' + examples.join('\n') + '```' }
							)
							.setFooter(`Requested by ${user.tag}`, user.avatarURL());
							
						reply(interaction, embed, true);
						break;
					}
					if (!date) {
						reply(interaction, `That's not a valid date!`);
						break;
					}
				}

				reply(interaction, 'yolo');
				break;

			default:
				reply(interaction, 'nani');
		}
	});
	client.on('raw', async (packet) => {
		if ([ 'MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE' ].includes(packet.t)) {
			const channel = client.channels.cache.get(packet.d.channel_id);
			if (channel.messages.cache.get(packet.d.message_id)) { return };
			channel.messages.fetch(packet.d.message_id).then((message) => {
				const emoji = packet.d.emoji.id || packet.d.emoji.name;
				const reaction = message.reactions.cache.get(emoji);
				if (packet.t === 'MESSAGE_REACTION_ADD') {
					client.emit('messageReactionAdd', reaction, client.users.cache.get(packet.d.user_id));
				}
				else {
					client.emit('messageReactionRemove', reaction, client.users.cache.get(packet.d.user_id));
				}
			})
				.catch(console.error);
		}
	});

	setInterval(reloadDiscordJSON, 1000);
});

client.on('message', (message) => {
	var user = message.author;
	if (user.bot) { return; }
	var content = message.content;
	var guild = message.guild;
	var channel = message.channel;
	var member = guild.member(user);
	var lower = content.toLowerCase();
	
	if (member.hasPermission("ADMINISTRATOR")) {
		if (lower === '!registercommands') {
			registerCommands(guild.id);
		}
		else if (lower === `!delete the kool commands ${member.id}`) {
			deleteCommands(guild.id);
		}
		else if (lower.includes('!eval')) {
			eval(message.content.substr(6, lower.length));
		}
	}
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
	var user = newMessage.author;
	if (user.bot) { return; }
	var guild = newMessage.guild;
	var channel = newMessage.channel;
	var oldContent = oldMessage.content;
	var newContent = newMessage.content;
	/** @type {Discord.TextChannel} **/
	var logs = guild.channels.cache.get(Get(discord.guilds, `${guild.id}.message_logs`));
	if (logs) {
		var description = `📎 **${user} edited [a message](https://discord.com/channels/${guild.id}/${channel.id}/${newMessage.id}) in ${channel}.**`;
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
});
client.on('messageDelete', async (message) => {
	/** @type {Discord.User} **/
	var user = message.author;
	if (user.bot) { return; }

	var guild = message.guild;
	var channel = message.channel;
	var content = message.content;
	/** @type {Discord.TextChannel} **/
	var logs = guild.channels.cache.get(Get(discord.guilds, `${guild.id}.message_logs`));
	if (logs) {
		var description = `📎 **${user} deleted a message in ${channel} (ID: ${message.id}).**`;
		var descLength = description.length - 2;
		const embed = new Discord.MessageEmbed()
			.setColor('#e73535')
			.setDescription(description)
			.setAuthor(user.tag, user.avatarURL(), user.avatarURL())
			.addFields(
				{ name: 'Message Content', value: content.substr(0, Math.min(content.length, 4000 - descLength)) }
			);
		logs.send(embed);
	}
});

client.on('guildMemberAdd', async (member) => {
	const guild = member.guild;
	const user = member.user;
	member.roles.add(skripter);
	client.channels.cache.get('854842141498277908').send(
		(Get(discord, `guilds.${guild.id}.joinMessages`) || [
			"\\:O It's ${user}, thanks for joining!",
			"Welp, here's ${user}...",
			"Well then, ${user}'s here...",
			"Whoa, whoa, whoa, when did ${user} get here?",
			"Ah shoot, here comes ${user}...",
			"And then came ${user}!"
    	])
			.shuffle(1)[0]
			.replace('${user}', user.tag) // Replace ${user} with the user's tag (username#discriminator)
			.replace('${user.mention}', user.toString()) // Replace ${user.mention} with the user's mention
			.replace('${guild}', guild.name) // Replace ${guild} with the guild name
	); // Gets join messages, shuffles, and replaces format strings with values
});

/**
 * Returns a pseudorandom float between a minimum and maximum range.
 *
 * @param {number} min The minimum number to get a random number between.
 * @param {number} max The maximum number to get a random number between.
 * @returns {number} The pseudorandom floating point number between min and max.
**/
function getRandom(min, max) {
	return min + Math.random() * max;
}
/**
 * Returns a pseudorandom integer between a minimum and maximum range.
 *
 * @param {number} min The minimum number to get a random integer between.
 * @param {number} max The maximum number to get a random integer between.
 * @returns {number} The pseudorandom integer between min and max.
**/
function getRandomInt(min, max) {
	return Math.round(getRandom(min, max));
}

var now = (new Date).toISOString().substr(0, 10);
if (discord.lastActivation !== now) {
	discord.activations = 0;
}
discord.lastActivation = now;
discord.activations++;

//var logs = fs.createWriteStream(`./logs/${now}**${discord.activations}`);
//logs.write('hi');

//var access = fs.createWriteStream(`./logs/${now}**${discord.activations}`);
//process.stdout.write = process.stderr.write = access.write.bind(access);

process.on('uncaughtException', function(err) {
  console.error((err && err.stack) ? err.stack : err);
});

client.on('messageReactionAdd', async (reaction, user) => {
	if (user.bot) { return; }
	var message = reaction.message;
	var channel = message.channel;
	const guild = message.guild;
	var member = guild.member(user);
	const ticket = discord.ticketMessages[message.id];
	if (ticket) {
		await message.reactions.resolve("📰").users.remove(user.id);
		if (getStat(member, "hasTicket")) { return; }
		discord.totalTickets++;
		var ticketName = `Ticket-${discord.totalTickets}`;
		guild.channels.create(ticketName, {
			data: {
				name: ticketName,
				options: {
					type: 'text',
					topic: ticket.description,
					parent: tickets
				}
			},
			reason: `Created ticket for ${user}`
		})
			.then(async (channel) => {
				await 	channel.setParent(tickets),
						channel.setTopic(ticket.description),
						channel.overwritePermissions([
							{
								id: user.id,
								allow: [
									"VIEW_CHANNEL",
									"SEND_MESSAGES",
									"READ_MESSAGE_HISTORY",
									"ATTACH_FILES"
								]
							},
							{
								id: guild.roles.everyone,
								deny: [ "VIEW_CHANNEL" ]
							},
							{
								id: guild.roles.cache.get("854842705363992586"),
								allow: [
									"VIEW_CHANNEL",
									"SEND_MESSAGES",
									"READ_MESSAGE_HISTORY",
									"ATTACH_FILES"
								]
							}
						], "Created ticket");

				setStat(member, "hasTicket", channel.id);

				const embed = new Discord.MessageEmbed()
					.setColor('#0099ff')
					.setTitle(ticketName)
					.setURL(`https://discord.com/channels/${guild.id}/${message.channel.id}/${message.id}`)
					.setAuthor('Skripthut', skripthut, skripthut)
					.setDescription(`You created a ticket!`)
					//.setThumbnail('https://i.imgur.com/skkhgOy.png')
					.addFields(
						{ name: 'Ticket Description', value: ticket.description },
						{ name: 'Extra Info', value: 'Do `/close` to close the ticket. You may only have one ticket at a time.' }
					)
					.setFooter(`Requested by ${user.tag}`, user.avatarURL());

				discord.tickets[channel.id] = {
					id: channel.id,
					member: user.id,
					message: message.id
				}

				setTimeout(async function() {
					await channel.send(`Hey, ${user}! Thanks for creating a ticket.`);
					channel.send(embed).then((message) => {
						embed.title = 'Click here to jump to ticket';
						embed.description = `${user.tag} created a ticket`;
						embed.url = `https://discord.com/channels/${guild.id}/${channel.id}/${message.id}`;
						embed.fields = { name: 'Ticket Description', value: ticket.description };
						client.channels.cache.get('854847882904731648').send(embed);
					});
				}, 250);
			});
	}

	const reactionRole = Get(discord, `reactionRoleMessages.${message.id}`);
	if (reactionRole) {
		var emoji = reaction._emoji;
		var reactionRoleEmote = reactionRole.emotes[emoji.name] || reactionRole.emotes[emoji.id];
		if (reactionRoleEmote) { member.roles.add(reactionRoleEmote.role, 'Reacted to reaction role message'); }
	}
});

client.on('messageReactionRemove', async (reaction, user) => {
	if (user.bot) { return; }
	var message = reaction.message;
	var channel = message.channel;
	const guild = message.guild;
	var member = guild.member(user);

	const reactionRole = Get(discord, `reactionRoleMessages.${message.id}`);;
	if (reactionRole) {
		var emoji = reaction._emoji;
		var reactionRoleEmote = reactionRole.emotes[emoji.name] || reactionRole.emotes[emoji.id];
		if (reactionRoleEmote) { member.roles.remove(reactionRoleEmote.role, 'Unreacted to reaction role message'); }
	}
});

client.on('guildBanRemove', async (guild, user) => {
	Delete(discord.guilds, `${guild.id}.members.${user.id}.banned`);
});

/**
 * @param {string} path The string path of the desired value of the object
 * @returns {[string, string, {index: number}, {input: string}, {groups: undefined}][]} The Array versions of RegExp String Iterators
**/
function getPath(path) {
	var objects = Array.from(path.matchAll(/((?:(?![\.[\]\d]).)+)\.?/gi));

	objects.push(...Array.from(path.matchAll(/\[(\d+)\]/g)));
	return objects.sort((a, b) => a.index - b.index);
}

/**
 * Dynamically sets a nested value in an object.
 * 
 * @param obj The object which contains the value you want to change/set.
 * @param {string} path The path to the value you want to set.
 * @param value The value you want to set it to.
 * 
 * @example
 * var object = { foo: { bar: [ 1, 2, 3, 4, 5 ] } };
 * Set(object, 'foo.bar[3]', 10);
 * 	console.log(
 * JSON.stringify(object) === JSON.stringify({ foo: { bar: [ 1, 2, 3, 10, 5 ] } })
 * ); // Logs true
**/
function Set(obj, path, value) {
	var schema = obj;
	var pList = getPath(path);
	var len = pList.length;
	for(var i = 0; i < len - 1; i++) {
		var elem = pList[i];
		var index = elem[0].includes('[') ? parseInt(elem[1]) : elem[1];
		if(!schema[index]) { schema[index] = {}; }
		schema = schema[index];
	}

	var elem = pList[i];
	schema[elem[0].includes('[') ? parseInt(elem[1]) : elem[1]] = value;
	return obj;
}

/**
 * Dynamically gets a nested value in an object.
 * 
 * @param obj The object which contains the value you want to get.
 * @param {string} path The path to the value you want to get.
 * 
 * @example
 * console.log(Get({ foo: { bar: [ 1, 2, 3, 4, 5 ] } }, 'foo.bar[3]') === 4); // Logs true
**/
function Get(obj, path) {
	var schema = obj;
	var pList = getPath(path);
	var len = pList.length;
	for(var i = 0; i < len - 1; i++) {
		var elem = pList[i];
		var index = elem[0].includes('[') ? parseInt(elem[1]) : elem[1];
		if(!schema[index]) { return undefined; }
		schema = schema[index];
	}

	var elem = pList[i];
	return schema[elem[0].includes('[') ? parseInt(elem[1]) : elem[1]];
}

/**
 * Dynamically deletes a nested value in an object.
 * 
 * @param obj The object which contains the value you want to delete.
 * @param {string} path The path to the value you want to delete.
 * 
 * @example
 * var object = { foo: { bar: [ 1, 2, 3, 4, 5 ] } };
 * Delete(object, 'foo.bar[3]');
 * console.log(
 * 	JSON.stringify(object) === JSON.stringify({ foo: { bar: [ 1, 2, 10, 5 ] } })
 * ); // Logs true
**/
function Delete(obj, path) {
	var schema = obj;
	var pList = getPath(path);
	var len = pList.length;
	for(var i = 0; i < len - 1; i++) {
		var elem = pList[i];
		var index = elem[0].includes('[') ? parseInt(elem[1]) : elem[1];
		if(!schema[index]) { return; }
		schema = schema[index];
	}

	var elem = pList[i];
	delete schema[elem[0].includes('[') ? parseInt(elem[1]) : elem[1]];
}

/**
 * Set a stat of a member in a guild.
 *
 * @param {Discord.GuildMember} member The desired member of the stat.
 * @param {String} key The key of the desired stat to set.
 * @param value The value to set the stat to.
**/
function setStat(member, key, value) {
	const guild = member.guild;
	Set(discord.guilds, `${guild.id}.members.${member.id}.${key}`, value);
}

/**
 * Delete a stat of a member in a guild.
 *
 * @param {Discord.GuildMember} member The desired member of the stat.
 * @param {String} key The key of the desired stat to delete.
**/
function deleteStat(member, key) {
	const guild = member.guild;
	Delete(discord.guilds, `${guild.id}.members.${member.id}.${key}`);
}

/**
 * Get a stat of a member in a guild.
 *
 * @param {Discord.GuildMember} member The desired member of the stat.
 * @param {String} key The key of the desired stat.
 * @returns The value of the stat specified.
**/
function getStat(member, key) {
	const guild = member.guild;
	return Get(discord.guilds, `${guild.id}.members.${member.id}.${key}`);
}

/**
 * Reply to a Discord interaction.
 *
 * @param {Discord.Interaction} interaction The interaction you want to reply to.
 * @param {(string | Discord.MessageEmbed)} response The message you want to respond with.
 * @param {boolean} isEphemeral Whether the reply should be strictly for the interactor or everyone to see
**/
async function reply(interaction, response, isEphemeral) {
	const data = (typeof response === 'object') ? await createAPIMessage(interaction, response) : { content: response }
	client.api.interactions(interaction.id, interaction.token)
		.callback
		.post({
			ephemeral: isEphemeral,
			data: {
				type: 4,
				data
			}
		});
}

async function createAPIMessage(interaction, content) {
	const { data, files } = await Discord.APIMessage.create(
		client.channels.resolve(interaction.channel_id),
		content
	)
		.resolveData()
		.resolveFiles();
	return { ...data, files };
}

function clearEmpties(object) {
	for (var key in object) {
		if (!object[key] || typeof object[key] !== "object") { continue; }
		clearEmpties(object[key]);
		if (!Object.keys(object[key]).length) { delete object[key]; }
	}
}

async function reloadDiscordJSON() {
	var now = Date.now();
	Object.keys(discord.guilds).forEach(async (guildId) => {
		var guildData = discord.guilds[guildId];
		/** @type {Discord.Guild} **/
		var guild = client.guilds.cache.get(guildId);
		var bans = await client.guilds.cache.get(guildId).fetchBans();
		for (const banInfo of bans) {
			var userId = banInfo[1].user.id;
			var banned = Get(guildData, `members.${userId}.banned`);
			if (banned) {
				var banTime = banned.banTime;
				var banDate = banned.banDate;
				var moderator = client.users.cache.get(banned.moderator);
				if (banDate + banTime <= now) {
					await guild.members.unban(userId, `Temporary ban ran out (${moderator.tag})`);
					delete discord.guilds[guildId].members[userId].banned;
				}
			}
		}
	});

	clearEmpties(discord);
	writeJSON('./discord/discord.json', discord);
}

client.login(Buffer.from(clientData.encodedBotToken, 'base64').toString('ascii'));