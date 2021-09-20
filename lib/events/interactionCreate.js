/** @module Discord */
const Discord = require(`discord.js`);
const database = require(`../../database/database.js`);
const Reply = require(`../structures/Reply.js`);
const returnCatch = require(`../methods/returnCatch.js`);
const formatBytes = require(`../methods/formatBytes.js`);

const Color = require(`../constants/Color.js`);
const { permissionMessage, skripthut, noResults } = require(`../constants/General.js`);

/**
 * The callback function for the discord.js `interactionCreate` event
 * 
 * @param {Discord.CommandInteraction} interaction The interaction of the event 
**/
module.exports = async function(interaction) {
	if (interaction.isCommand()) {
		const { reply, deleteReply, deferReply } = new Reply(interaction);
		
		const { commandName, options } = interaction;
		const command = commandName.toLowerCase();

		/**
		 * Format options received by an interaction into a more readable object.
		 * 
		 * @param {Discord.CommandInteractionOption[]} options The options to format
		 * @returns {any} The formatted options object
		**/
		 function formatOptions(options) {
			const args = {};
			if (options) {
				for (const option of options) {
					const { name, type } = option;
					args[name] = (type === "MENTIONABLE") ? (option.member ?? option.role) : option[{
						USER: 'member',
						CHANNEL: 'channel',
						ROLE: 'role'
					}[type] ?? 'value'];
				}
			}
			return args;
		}

		/** The optional subcommand group used */
		const group = options._group;
		/** The optional subcommand used */
		const subcommand = options._subcommand;

		const args = formatOptions(options._hoistedOptions);

		console.log('formatted args', args);

		/** 
		 * The member who created the interaction
		 * 
		 * @type {Discord.GuildMember}
		**/
		const member = interaction.member;

		/** The user who created the interaction */
		const user = member.user;
		/** The ID of the user who created the interaction */
		const userId = user.id;

		/** The ID of the guild of the interaction */
		const guildId = interaction.guildId;
		/** The guild of the interaction */
		const guild = member.guild;

		/** The ID of the channel of the interaction */
		const channelId = interaction.channelId;
		/** The channel of the interaction */
		const channel = interaction.channel;

		/** @type {(Discord.TextChannel | Discord.ThreadChannel)} */
		let logs = guild.channels.cache.get(database.discord.guilds?.[guild.id]?.message_logs);
		if (logs) { logs.send(`${user.tag} (${user.id}) executed /${command}`); }

		/*
		* Skript Commands
		*/

		// ADDON COMMAND
		if (command === 'addon') {
			let addonName = args.name;
			console.log('name', addonName);
			if (!addonName) {
				reply(`Hi`);
				return;
			}

			let apiName = (args.api || 'SkriptTools');
			let api = apiName.toLowerCase();
			console.log('api', args.api);
		
			await deferReply();

			console.log('started thinking');

			let addon = await getAddon(addonName, api);
			console.log('addon', addon, addonName, api);
			if (!addon) {
				reply(
					new Discord.MessageEmbed()
						.setColor(Color.RED)
						.setTitle('No Addon Found')
						.setDescription('No addons were found with that search')
						.setThumbnail(noResults)
						.setFooter(`Error | ${interaction.id}`)
					, "editReply", false);
				return;
			}

			let addonInfo;
			if (api === 'skripttools') {
				let files = addon.files;
				let file = files[files.length - 1];
				addonInfo = getAddonInfo(file, api);
			}
			else if (api === 'skripthub') {
				addonInfo = getAddonInfo(addon, api);
			}
			console.log('addonInfo', addonInfo);
			if (!addonInfo) {
				reply(`Error: Unable to get addon info`, "editReply", false);
				return;
			}

			let download = addonInfo.download;
			let depends = addonInfo.depend;
			let plugin = `${addonInfo.plugin} ${addonInfo.version}`;
			let fields = [{ name: 'Addon', value: `**${plugin}.jar** by **${addonInfo.author.join(", ")}**`, inline: true }];
			if (depends.softdepend) { fields.push({ name: 'Soft Depends', value: depends.softdepend.join(", "), inline: true }); }
			if (addonInfo.sourcecode) { fields.push({ name: 'Source Code', value: addonInfo.sourcecode, inline: true }); }
			fields.push({ name: `Download (${formatBytes(parseInt(addonInfo.bytes))})`, value: download });

			let embed = new Discord.MessageEmbed()
				.setColor(Color.GREEN)
				.setTitle(plugin)
				.setURL(download)
				.addFields(fields)
				.setFooter(`Powered by ${apiName}`);

			if (addonInfo.description) { embed.description = addonInfo.description; }

			reply(embed, "editReply");
			return;
			// END ADDON COMMAND
		}

		// DOCS COMMAND
		if (command === 'docs') {
			await deferReply();

			let query = args.query;
			let api = args.api.toLowerCase();

			let syntaxResult = await searchForSyntax(query, api);
			let syntaxList = syntaxResult.result;
			if (!syntaxList.length) { 
				reply(
					new Discord.MessageEmbed()
						.setColor(Color.RED)
						.setTitle('No Results')
						.setDescription('No results were found for that query')
						.setThumbnail(noResults)
						.setFooter(`Error | ${interaction.id}`),
				"editReply", false);
				return;
			}

			let syntax = new SkriptSyntax(syntaxList[0]);
			let example = await syntax.getExample();
			let embed = syntax.getEmbed(example);
			embed.footer = `Powered by ${(api === 'skunity') ? 'skUnity Docs 2' : 'SkriptHub Docs 1'} | ${interaction.id}`;
			reply(embed, "editReply", false);
			return;
			// END DOCS COMMAND
		}

		/*
		* Reaction Commands
		*/

		// CREATETICKET COMMAND
		if (command === 'createticket') {
			console.log('member', member, 'guild', member.guild, 'roles', member.guild.roles, 'everyone', member.guild.roles.everyone);
			if (!member.permissions.has("MANAGE_MESSAGES")) {
				reply(permissionMessage);
				return;
			}

			await deferReply();

			let ticketChannel = args.channel;
			let message = args.message.replace(/%(n(?:ew)?l(?:ine)?|line ?break)%/g, "\n");

			/** @type {Discord.Message} */
			let sentMessage = await ticketChannel.send(message);
			database.discord.ticketMessages[sentMessage.id] = {
				id: sentMessage.id,
				description: args.description,
				channel: ticketChannel.id
			};

			await sentMessage.react(`📰`);
			reply('Sent!', "editReply");
			return;
			// END CREATETICKET COMMAND
		}

		// CLOSE COMMAND
		if (command === 'close') {
			let ticket = database.discord.tickets?.[channelId];
			if (ticket) {
				let creator = await guild.members.fetch(client.users.cache.get(ticket.member));

				if (ticket.closed) {
					reply('Closing permanently...');
					await channel.delete("Ticket closed permanently");
					delete database.discord.tickets[channelId];
					return;
				}
				reply('Closed...');
				const id = creator.id;
				const type = "member";

				const permissionOverwrite = await channel.permissionOverwrites.find((overwrites) => overwrites.type === type && overwrites.id === id);
				if (permissionOverwrite) { await permissionOverwrite.delete("Ticket closed"); }

				deleteStat(creator, "hasTicket");
				database.discord.tickets[channelId].closed = true;

				reply('__Do `/close` again to permanently close the ticket.__', "followUp");
				return;
			}
			reply('You can only use this in a ticket channel!');
			return;
			// END CLOSE COMMAND
		}

		/*
		* Role Commands
		*/

		// ROLE COMMAND
		if (command === 'role') {
			if (!member.permissions.has("MANAGE_ROLES")) {
				reply(permissionMessage);
				return;
			}

			const role = args?.role;

			if (subcommand === 'grant') {
				const highestRole = member.roles.highest;
				if (highestRole.position <= role.position) {
					reply(`You don't have enough permission to grant ${role}!`);
					return;
				}
				let target = args.member;
				let reason = args.reason ?? `Granted by ${user.tag}`;

				reply(`Adding...`);
				await target.roles.add(role, reason);

				reply(`Added ${role} to ${target}'s roles!`, "followUp", true);
				return;
			}
			if (subcommand === 'revoke') {
				const highestRole = member.roles.highest;
				if (highestRole.position <= role.position) {
					reply(`You don't have enough permission to revoke ${role}!`);
					return;
				}

				await deferReply(true);
				let target = await guild.members.fetch(args.member);
				let reason = (option.options[2] || { value: `Removed by ${user.tag}`}).value;

				reply(`Removed ${role} from ${target}'s roles...`, "editReply", true);
				target.roles.remove(role, reason);
				return;
			}
			if (subcommand === 'roles') {
				if (args) {
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
					reply(embed);
					return;
				}
				let roles = Array.from(guild.roles.cache);
				let roleInfo = [];
				for (let i = 0; i < roles.length; i++) { roleInfo[i] = roles[i][1]; }
				reply(`${roleInfo}`);
				return;
			}
			return;
		// END ROLE COMMAND
		}

		// REACTIONROLE COMMAND
		if (command === 'reactionrole') {
			if (!member.permissions.has("MANAGE_ROLES")) {
				reply(permissionMessage);
				return;
			}

			/** @type {Discord.MessageReaction} */
			let reactionRoleEmote;
			/** @type {Discord.Snowflake} */
			let reactionRoleEmoteId;

			/** @type {Discord.TextChannel} */
			let reactionRoleChannel;

			/** @type {Discord.Message} */
			let reactionRoleMessage;
			/** @type {Discord.Snowflake} */
			let reactionRoleMessageId;

			/** @type {Discord.Role} */
			let reactionRole;
			/** @type {Discord.Snowflake} */
			let reactionRoleId;

			/** @type {[string, ReactionRoleEmote][]} */
			let emotes;
			/** @type {{id: string, emotes: Map<string, ReactionRoleEmote>}} */
			let _reactionRoleMessage;
			/** @type {string} */
			let chosenEmote;

			if (subcommand === 'create') {
				chosenEmote = args.emote ?? '📰';

				if (chosenEmote.match(/\p{Extended_Pictographic}/u)) {
					reactionRoleEmote = chosenEmote;
					reactionRoleEmoteId = chosenEmote;
				}
				else {
					reactionRoleEmote = client.emojis.cache.find((emote) => emote.name.toLowerCase() === chosenEmote || emote.id === chosenEmote) || { id: '' };
					reactionRoleEmoteId = reactionRoleEmote.id;
				}

				if (!reactionRoleEmoteId) {
					reply(`That's not a valid emote!`);
					return;
				}

				reactionRoleChannel = args.channel;
				reactionRoleMessageContent = args.message.replace(/%(n(?:ew)?l(?:ine)?|line ?break)%/g, "\n");
				reactionRole = args.role;

				let reactionRoleMessage = reactionRoleChannel.send(reactionRoleMessageContent);
				await reply('Sending...');

				reactionRoleMessage.then(async (message) => {
					await message.react(reactionRoleEmote);
					database.discord.reactionRoleMessages[message.id] = {
						id: message.id,
						emotes: {}
					}
					database.discord.reactionRoleMessages[message.id].emotes[reactionRoleEmoteId] = new ReactionRoleEmote(message, reactionRole);
				});
				return;
			}

			// "add" and "remove" subcommands
			let ids = Array.from(args.message.matchAll(/https:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/))[0]; // Get ID's from URL

			if (ids[1] !== guildId) {
				reply(`That's not a valid message URL (guild ID invalid)!`);
				return;
			}
			reactionRoleChannel = guild.channels.cache.get(ids[2]);

			if (!reactionRoleChannel) {
				reply(`That's not a valid message URL (channel ID invalid)!`);
				return;
			}
			reactionRoleMessageId = ids[3];
			reactionRoleMessage = await reactionRoleChannel.messages.fetch(reactionRoleMessageId);
			if (!reactionRoleMessage) {
				reply(`That's not a valid message URL (message ID invalid)!`);
				return;
			}

			if (type === 'add') {
				chosenEmote = args.emote ?? '📰';

				if (chosenEmote.match(/\p{Extended_Pictographic}/u)) {
					reactionRoleEmote = chosenEmote;
					reactionRoleEmoteId = chosenEmote;
				}
				else {
					reactionRoleEmote = client.emojis.cache.find((emote) => emote.name.toLowerCase() === chosenEmote || emote.id === chosenEmote) || { id: null };
					reactionRoleEmoteId = reactionRoleEmote.id;
				}

				if (!reactionRoleEmoteId) {
					reply(`That's not a valid emote!`);
					return;
				}

				reactionRole = args.role;

				_reactionRoleMessage = database.discord.reactionRoleMessages?.[reactionRoleMessageId];
				if (_reactionRoleMessage) {
					const emotes = _reactionRoleMessage.emotes;
					if (emotes[reactionRoleEmoteId]) {
						reply(`This reaction role message already has this emote set!`);
						return;
					}
					if (JSON.stringify(emotes).includes(reactionRole)) {
						reply(`This reaction role message already has this role set!`);
						return;
					}
				}

				await reply('Adding...');
				await reactionRoleMessage.react(reactionRoleEmote);
				if (!_reactionRoleMessage) {
					_.set(database.discord, `reactionRoleMessages.${reactionRoleMessageId}`, 
					{
						id: reactionRoleMessageId,
						emotes: {}
					});
				}
				database.discord.reactionRoleMessages[reactionRoleMessageId].emotes[reactionRoleEmoteId] = new ReactionRoleEmote(reactionRoleMessage, reactionRole);
				return;
			}

			if (type === 'remove') {
				_reactionRoleMessage = database.discord.reactionRoleMessages?.[reactionRoleMessageId];

				if (!_reactionRoleMessage) {
					reply(`This message doesn't have any reaction roles!`);
					return;
				}

				reactionRoleId = args.role.id;

				emotes = _reactionRoleMessage.emotes;

				/**
				 * Remove all emotes from a reaction role message
				 * 
				 * @param {ReactionRoleEmote[]} emotes The emotes of the reaction role message
				 * @returns The id of the removed emote, and the new length of the emotes of the reaction role message
				**/
				function removeEmotes(emotes) {
					const entries = Object.entries(emotes);
					for (let [key, value] of entries) {
						if (value.role === reactionRoleId) {
							delete database.discord.reactionRoleMessages[reactionRoleMessageId].emotes[key];
							return { id: key, length: entries.length - 1 };
						}
					}
				}					

				let removeEmotesResult = removeEmotes(emotes);

				if (!removeEmotesResult) {
					reply(`This message doesn't have that role!`);
					return;
				}

				if (!removeEmotesResult.length) {
					delete database.discord.reactionRoleMessages[reactionRoleMessageId];
				}

				let reactionRoleEmoteId = removeEmotesResult.id;

				let reactionRole = guild.roles.cache.get(reactionRoleId);

				reply(`Removing ${reactionRole} from the specified message...`);
				reactionRoleMessage.reactions.resolve(reactionRoleEmoteId).remove();
				return;
			}
			reply('bruh moment');
			return;
		}

		// COLOURROLE COMMAND
		if (command === 'colourrole') {
			if (!member.permissions.has("ADMINISTRATOR")) {
				reply('nuu');
				return;
			}
			
			let roles = member.roles.cache;
			let hasRoles =
			(
				roles.get('854843596553715814') ||
				roles.get('244542234895187979') ||
				roles.get('422479365255987202') ||
				roles.get('854843824818618379') ||
				roles.get('854841465087852574')
			);
			if (!hasRoles && !member.permissions.has("MANAGE_ROLES")) {
				reply(permissionMessage);
				return;
			}

			if (type === 'create') {
				let color = args.colour
					.replace(`#`, ``);

				if (color.match(/[a-f0-9]{6}/i)) {
					let createdRole = `#${color.toUpperCase()}`;
					let highestRole = member.roles.highest;
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
							reply(embed);
							await member.roles.add(result.id);

							let colourRole = getStat(member, "colourRole");
							if(colourRole) {
								let role = guild.roles.cache.get(colourRole);
								if (!role) { role.delete(); }
							}
							setStat(member, "colourRole", result.id);
							reply(`Added ${result} to your roles!`, "followUp", true);
						});
					return;
				}
				reply(`Please input a valid HEX code as a colour.`);
				return;
			}
			if (type === 'remove') {
				if(getStat(member, "colourRole")) {
					let role = guild.roles.cache.get(getStat(member, "colourRole"));
					if (!role) {
						await role.delete();
						deleteStat(member, "colourRole");
						reply('Deleted your colour role...');
						return;
					}
					reply(`You have a colour role... but it's invalid`);
					return;
				}
				reply(`You currently don't have a colour role...`);
			}
			return;
		// END COLOURROLE COMMAND
		}

		/*
		 * General Commands
		*/
		if (command === 'joinmessages') {
			if (!member.permissions.has("MANAGE_CHANNELS")) {
				reply(permissionMessage);
				return;
			}

			deferReply(true);

			if (subcommand === 'add') {
				/** @type {string[]} The join messages array reference */
				const joinMessages = database.discord.guilds?.[guildId]?.joinMessages;
				if (!joinMessages) {
					_.set(database.discord, `guilds.${guildId}.joinMessages`, [ args.message ]);
					return;
				}
				if (joinMessages.includes(args.message)) {
					reply('This message is already in this server\'s join messages!', "editReply");
					return;
				}

				joinMessages.push(args.message);
				reply(`Added ${args.message} to this server's join messages`, "editReply");
			}
			
			console.log(args);
		}

		/*
		* Moderator Commands 
		*/
		if (command === 'ban') {
			if (!member.permissions.has("BAN_MEMBERS")) {
				reply(permissionMessage);
				return;
			}

			let targetMember = await returnCatch(guild.members.fetch(args.member), () => {
				reply(`That's not a valid member!`);
			});
			if (!targetMember) {
				return;
			}
			
			let target = targetMember.user;

			let details = await getPunishmentDetails(args.timespan);
			if (details) {
				if (!details) {
					reply(`That's not a valid timespan (where [x] is any number: [x]s, [x]m, [x]h, [x]d, [x]y)!`);
					return;
				}
				_.set(database.discord.guilds, `${guildId}.members.${target.id}.banned`, {
					banDate: details.now,
					banTime: details.milliseconds,
					moderator: userId
				});
			}

			let reason = args.reason || "Not kool enough to stay in Skripthut";
			
			returnCatch(target.send('u ban lmao'));
			targetMember.ban({ reason: reason });
			reply(
				new Discord.MessageEmbed()
					.setColor(Color.RED)
					.setAuthor(target.tag, target.avatarURL(), target.avatarURL())
					.setDescription(`Details for ${target}'s ban from ${guild.name}`)
					.addFields(
						{ name: 'Ban Length', value: details.readableTimespan || "Infinite" },
						{ name: 'Lasts Until', value: details.endDate || "The End of Time" },
						{ name: 'Reason', value: reason }
					)
					.setFooter(`Banned by ${user.tag}`, user.avatarURL())
			)
			return;
		}
		if (command === 'mute') {
			let hasRoles =
			(
				roles.get('854842705363992586')
			);
			if (!hasRoles && !member.permissions.has("MANAGE_ROLES")) {
				reply(permissionMessage);
				return;
			}
			
			let targetMember = args.member;
			let target = target.user;

			if (args.timespan) {
				let details = await getPunishmentDetails(args.timespan);
				if (!details) {
					reply(`That's not a valid timespan (let [x] be any number: [x]s, [x]m, [x]h, [x]d, [x]y)!`);
					return;
				}
				setStat(targetMember, "banDate", now);
				setStat(targetMember, "banTime", details.milliseconds);
			}

			let reason = args.reason || "Not kool enough to stay in Skripthut";
			
			targetMember.ban({ reason: `${reason} (${user.tag})` });
			reply(
				new Discord.MessageEmbed()
					.setColor(Color.RED)
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
			return;
		}

		/*
		* Admin Commands
		*/

		/*
		* Miscellaneous Commands
		*/
		if (command === 'tomato') {
			reply(`tomato`);
			return;
		}

		if (command === 'remindme') {
			let time = args.date;

			if (subcommand === 'at') {
				if (time) {
					let examples = [
						'2019-09-07T-15:50+00',
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
							{ name: 'Example Usage', value: getCodeBlock(examples.join('\n'), '') }
						)
						.setFooter(`Requested by ${user.tag}`, user.avatarURL());
						
					reply(embed);
					return;
				}
				
				const date = Date.parse(time);
				if (!date) {
					reply(`That's not a valid date!`);
					return;
				}
			}

			reply('yolo');
			return;
		}

		if (command === 'test') {
			deferReply();
			setTimeout(function() {
				reply(':O', "editReply");
			}, 5000);
			return;
		}
	}
}