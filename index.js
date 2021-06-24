'use strict';

/**
 * @returns Returns a random element from an array 
**/
Array.prototype.getRandomElement = function() {
	return this[Math.floor(this.length - getRandom(0, this.length))];
}
/**
 * @module Discord
**/
const Discord = require(`discord.js`);
const fs = require(`fs-extra`);

var clientData = loadJSON('./discord/client.json');

const client = new Discord.Client();
var discord = loadJSON('./discord/discord.json');

var skripthut = "https://i.imgur.com/ocMfwH5.png";

/**
 * The ReactionRoleEmote class made for reaction roles.
 * 
 * @constructor Create a ReactionRoleEmote using a Message and Role/Role ID.
 * @method setRole() Change the role of a ReactionRoleEmote.
**/
class ReactionRoleEmote {
	/**
	 * Constructor for ReactionRoleEmote, returning an object with the message ID, the channel ID, the guild ID, and the role ID.
	 *
	 * @param {Discord.Message} message The specified Message of the ReactionRoleEmote.
	 * @param {(Discord.Snowflake | Discord.Role)} role The specified Role or Role ID Snowflake of the ReactionRoleEmote.
	**/
	constructor(message, role) {
		this.id = message.id;
		/** @type {String} */
		this.channel = message.channel.id;
		this.guild = message.guild.id;

		if (message.guild.roles.cache.get(role)) { this.role = role; }
		else if ((role.constructor || {}).name === 'Role') { this.role = role.id; }
		else { throw new Error('Given role parameter is not a valid role ID or Role') }
	}
	/**
	 * Change the role of a ReactionRoleEmote.
	 *
	 * @param {(Discord.Snowflake | Discord.Role)} role The desired Role or Role ID Snowflake to change this's role property to.
	**/
	setRole(role) {
		if (message.guild.cache.get(role)) { this.role = role; }
		else if (role.constructor.name === 'Role') { this.role = role.id; }
		else { throw new Error('Given role parameter is not a valid role ID or Role') }
	}
}

/**
 * Read a file and parse it using JSON.
 *
 * @param {String} file The directory of the file you want to load.
 * @returns {JSON} Returns the stringified JSON as JavaScript object.
**/
function loadJSON(file) {
    return JSON.parse(fs.readFileSync(file, `utf8`));
}
/**
 * Stringifies JSON and writes it into a file.
 *
 * @param {String} file The directory of the file you want to write.
 * @param {JSON} data The JSON to be stringified.
 * @returns Returns the writeFile Promise.
**/
async function writeJSON(file, data) {
    return fs.writeFile(file, JSON.stringify(data, null, 4), `utf8`);
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
			[ 'id', 'application_id', 'version', 'guild_id', 'default_permission' ].forEach(key => delete awaitCommand[key]);
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

	client.ws.on('INTERACTION_CREATE', async interaction => { // WebSocket Interaction Create Event (for slash commands)
		const { name, options } = interaction.data;
		const command = name.toLowerCase();

		const guild_id = interaction.guild_id;
		/**
		 * @type {Discord.Guild}
		**/
		const guild = client.guilds.cache.get(guild_id);

		const channel_id = interaction.channel_id;
		const channel = guild.channels.cache.get(channel_id);

		const user_id = interaction.member.user.id;
		const user = client.users.cache.get(user_id);

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
				ticketChannel.send(message).then(message => {
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

					const permissionOverwrite = await channel.permissionOverwrites.find(overwrites => overwrites.type === type && overwrites.id === id);
					if (permissionOverwrite) { await permissionOverwrite.delete("Ticket closed"); }

					deleteStat(creator, "hasTicket");
					discord.tickets[channel_id].closed = true;

					channel.send('__Do `/close` again to permanently close the ticket.__')
					break;
				}
				reply(interaction, 'You can only use this in a ticket channel!')
				break;
				// END CLOSE COMMAND

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
						var reactionRoleEmote = client.emojis.cache.find(emote => emote.name === chosenEmote || emote.id === chosenEmote) || { id: '' };
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

					sentMessage.then(async message => {
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
					var chosenEmote = (option.options[2] || { value: '📰' }).value;

					if (chosenEmote.match(/\p{Extended_Pictographic}/u)) {
						var reactionRoleEmote = chosenEmote;
						var reactionRoleEmoteId = chosenEmote;
					}
					else {
						var reactionRoleEmote = client.emojis.cache.find(emote => emote.name === chosenEmote || emote.id === chosenEmote) || { id: '' };
						var reactionRoleEmoteId = reactionRoleEmote.id;
					}

					if (!reactionRoleEmoteId) {
						reply(interaction, `That's not a valid emote!`);
						break;
					}

					var reactionRoleChannel = guild.channels.cache.get(option.options[0].value);
					var reactionRoleMessageId = option.options[1].value;
					var reactionRoleMessage = await reactionRoleChannel.messages.fetch(reactionRoleMessageId);
					if (!reactionRoleMessage) {
						reply(interaction, `That's not a valid message ID!`);
						break;
					}

					var reactionRole = option.options[3].value;

					const _reactionRoleMessage = discord.reactionRoleMessages[reactionRoleMessageId];
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
						discord.reactionRoleMessages[reactionRoleMessageId] = {
							id: reactionRoleMessageId,
							emotes: {}
						}
					}
					discord.reactionRoleMessages[reactionRoleMessageId].emotes[reactionRoleEmoteId] = new ReactionRoleEmote(reactionRoleMessage, reactionRole);
					break;
				}
				reply(interaction, 'wait a bit bruh');
				break;

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
							.then(async result => {
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
					break;
				}
				break;
			// END COLOURROLE COMMAND

			/*
			 * Admin Commands
			 */

			/*
			 * Miscellaneous Commands
			 */
			case 'tomato':
				reply(interaction, `tomato`);
				break;

			default:
				reply(interaction, 'nani');
		}
	});
});

client.on('message', message => {
	var content = message.toString();
	var guild = message.guild;
	var user = message.author;
	var member = guild.member(user);
	var lower = content.toLowerCase();
	if (member.hasPermission("ADMINISTRATOR")) {
		if (lower === '!registercommands') {
			registerCommands(guild.id);
		}
		else if (lower === `!delete the kool commands ${member.id}`) {
			deleteCommands(guild.id);
		}
	}
});

client.on('guildMemberAdd', async member => {
	member.roles.add(skripter);
	client.channels.cache.get('854842141498277908').send(
		discord.joinMessages.getRandomElement()
			.replace('${user}', `${member}`)
	);
});

/**
 * Returns a pseudo-random float between a minimum and maximum range.
 *
 * @param {number} min The minimum number to get a random number between.
 * @param {number} max The maximum number to get a random number between.
 * @returns {number} The pseudo-random floating point number between min and max.
**/
function getRandom(min, max) {
	return min + Math.random() * max;
}
/**
 * Returns a pseudo-random integer between a minimum and maximum range.
 *
 * @param {number} min The minimum number to get a random integer between.
 * @param {number} max The maximum number to get a random integer between.
 * @returns {number} The pseudo-random integer between min and max.
**/
function getRandomInt(min, max) {
	return Math.round(getRandom(min, max));
}

client.on('raw', packet => {
    if ([ 'MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE' ].includes(packet.t)) {
    	const channel = client.channels.cache.get(packet.d.channel_id);
		if (channel.messages.cache.get(packet.d.message_id)) { return };
		channel.messages.fetch(packet.d.message_id).then(message => {
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
			.then(async channel => {
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
					channel.send(embed).then(message => {
						embed.title = 'Click here to jump to ticket';
						embed.description = `${user.tag} created a ticket`;
						embed.url = `https://discord.com/channels/${guild.id}/${channel.id}/${message.id}`;
						embed.fields = { name: 'Ticket Description', value: ticket.description };
						client.channels.cache.get('854847882904731648').send(embed);
					});
				}, 250);
			});
		return;
	}

	const reactionRole = discord.reactionRoleMessages[message.id];
	if (reactionRole) {
		var reactionRoleEmote = reactionRole.emotes[reaction] || reactionRole.emotes[reaction._emoji.id];
		if (reactionRoleEmote) { member.roles.add(reactionRoleEmote.role, 'Reacted to reaction role message'); }
		return;
	}
});

client.on('messageReactionRemove', async (reaction, user) => {
	if (user.bot) { return; }
	var message = reaction.message;
	var channel = message.channel;
	const guild = message.guild;
	var member = guild.member(user);

	const reactionRole = discord.reactionRoleMessages[message.id];
	if (reactionRole) {
		var reactionRoleEmote = reactionRole.emotes[reaction] || reactionRole.emotes[reaction._emoji.id];
		if (reactionRoleEmote) { member.roles.remove(reactionRoleEmote.role, 'Unreacted to reaction role message'); }
		return;
	}
});
/**
 * Set a stat of a member in a guild.
 *
 * @param {Discord.GuildMember} member The desired member of the stat.
 * @param {String} key The key of the desired stat to set.
 * @param value The value to set the stat to.
**/
function setStat(member, key, value) {
	const guild = member.guild;
	if (!discord.guilds) { discord.guilds = {} }
	if (!discord.guilds[guild.id]) { discord.guilds[guild.id] = {}; }
	if (!discord.guilds[guild.id].members) { discord.guilds[guild.id].members = {}; }
	if (!discord.guilds[guild.id].members[member.id]) { discord.guilds[guild.id].members[member.id] = {}; }
	discord.guilds[guild.id].members[member.id][key] = value;
}

/**
 * Delete a stat of a member in a guild.
 *
 * @param {Discord.GuildMember} member The desired member of the stat.
 * @param {String} key The key of the desired stat to delete.
**/
function deleteStat(member, key) {
	const guild = member.guild;
	if (!discord.guilds) { discord.guilds = {} }
	if (!discord.guilds[guild.id]) { discord.guilds[guild.id] = {}; }
	if (!discord.guilds[guild.id].members) { discord.guilds[guild.id].members = {}; }
	if (!discord.guilds[guild.id].members[member.id]) { discord.guilds[guild.id].members[member.id] = {}; }
	delete discord.guilds[guild.id].members[member.id][key];
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
	if (!discord.guilds) { discord.guilds = {} }
	if (!discord.guilds[guild.id]) { discord.guilds[guild.id] = {}; }
	if (!discord.guilds[guild.id].members) { discord.guilds[guild.id].members = {}; }
	if (!discord.guilds[guild.id].members[member.id]) { discord.guilds[guild.id].members[member.id] = {}; }
	return discord.guilds[guild.id].members[member.id][key];
}

/**
 * Reply to a Discord interaction.
 *
 * @param {Discord.Interaction} interaction The interaction you want to reply to.
 * @param {String} response The message you want to respond with.
**/
async function reply(interaction, response) {
	const data = (typeof response === 'object') ? await createAPIMessage(interaction, response) : { content: response }
	client.api.interactions(interaction.id, interaction.token)
		.callback
		.post(
			{
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

setInterval(async function() {
	client.guilds.cache.forEach(async guild => {
		var clientMember = guild.member(client.user);
		getStat(clientMember, "test");
		/*Object.values(discord.guilds[guild.id].members).forEach(members => {
			var keys = Object.keys(members);
			if (!keys.length) { delete discord.guilds[guild.id].members; }
			else {
				for (const key of keys) {
					const member = members[key];
					if (!Object.keys(member).length) { delete discord.guilds[guild.id].members[member]; }
				}
			}
		});*/
	});
	writeJSON('./discord/discord.json', discord);
}, 1000);

client.login(Buffer.from(clientData.encodedBotToken, 'base64').toString('ascii'));