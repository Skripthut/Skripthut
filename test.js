case 'createticket':
				if (!member.hasPermission("MANAGE_MESSAGES")) {
					reply(interaction, 'no lmao');
					break;
				}
				reply(interaction, 'Sending ticket messsage...');
				var ticketChannel = await client.channels.cache.get(args.channel);
				var message = args.message.replace(/%(n(?:ew)?l(?:ine)?|line(?: )?break)%/g, "\n");
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

			/*
			 * Role Commands
			*/

			// ROLE COMMAND
			case 'role':
				if (!member.hasPermission("MANAGE_ROLES")) {
					reply(interaction, `You don't have permission to do this!`);
					break;
				}
				var option = options[0];
				var type = option.name;

				if (type === 'grant') {
					var target = guild.member(option.options[0].value);
					var role = guild.roles.cache.get(option.options[1].value);
					var reason = option.options[2].value || `Granted by ${member.tag}`;

					reply(interaction, `Added ${role} to ${target}'s roles...`);
					target.roles.add(role, reason);
					break;
				}
				if (type === 'revoke') {
					var target = guild.member(option.options[0].value);
					var role = guild.roles.cache.get(option.options[1].value);
					var reason = option.options[2].value || `Removed by ${member.tag}`;

					reply(interaction, `Removed ${role} from ${target}'s roles...`);
					target.roles.remove(role, reason);
					break;
				}
				if (type === 'roles') {
					console.log('hello');
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
							.setFooter(`Requested by ${member.tag}`, member.avatarURL());
						reply(interaction, embed);
						break;
					}
					var roles = Array.from(guild.roles.cache);
					roleInfo = [];
					for (var i = 0; i < roles.length; i++) {
						var role = roles[i][1];
						roleInfo[i] = role;
					}
					//console.log(roles);
					reply(interaction, `.${roleInfo}`);
					break;
				}
				reply(interaction, `noob`);
				break;
			// END ROLE COMMAND

			// COLOURROLE COMMAND
			case 'colourrole':
				var roles = await member.roles.cache;
				var hasRoles = await 
				(
					roles.get('854843596553715814') ||
					roles.get('244542234895187979') ||
					roles.get('422479365255987202') ||
					roles.get('854843824818618379') ||
					roles.get('854841465087852574')
				);
				if (!hasRoles && !member.hasPermission("MANAGE_ROLES")) {
					reply(interaction, `You don't have permission to do this!`);
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
						console.log(highestRole.position);
						guild.roles.create(
						{
							data: {
								name: createdRole,
								color: color,
								position: highestRole.rawPosition
							},
							reason: `Created colour role for ${member}`,
						})
							.then(async result => {
								const embed = new Discord.MessageEmbed()
									.setColor('#0099ff')
									.setTitle(createdRole)
									.setAuthor('Skripthut', skripthut, skripthut)
									.setDescription(`Created the colour role ${result}`)
									.setFooter(`Requested by ${member.tag}`, member.avatarURL());
								reply(interaction, `Created the colour role "\`${createdRole}\`"`);
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
							await deleteStat(member, "colourRole");
							reply(interaction, 'Deleted your colour role');
							break;
						}
						reply(interaction, `You have a colour role... but it's invalid`);
						break;
					}
					reply(interaction, `You currently don't have a colour role`);
					break;
				}
				break;
			// END COLOURROLE COMMAND

			/*
			 * Admin Commands
			 */
			default:
				reply('nani');