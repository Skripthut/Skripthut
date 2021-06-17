const Discord = require(`discord.js`);
require('dotenv').config();
const fs = require(`fs-extra`);

var clientData = loadJSON('./client.json');

const client = new Discord.Client();
var guildId = "854838419677904906";
var skripter = "854841582754857000";
var discord = loadJSON('./discord.json');

var skripthut = "https://i.imgur.com/Wp34CFf.png";

function loadJSON(file) {
    return JSON.parse(fs.readFileSync(file, `utf8`));
}
function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 4), `utf8`);
}

function getApp(guildId) { 
	const app = client.api.applications(client.user.id); 
	if (guildId) { 
		app.guilds(guildId); 
	} 
	return app;
}

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
	const commands = getApp(guildId).commands;
	await commands.post({ 
		data: { 
			name: 'delete', 
			description: 'Delete your current ticket channel', 
		},
	});
	await commands.post({ 
		data: { 
			name: 'createticket', 
			description: 'Create a ticket message in specified channel with specified description', 
		},
	});
	client.ws.on('INTERACTION_CREATE', async (interaction) => {
		const command = interaction.data.name.toLowerCase();
		const guild = client.guilds.cache.get(interaction.guild_id);
		const interactions = client.api.interactions(interaction.id, interaction.token);

		// CREATETICKET COMMAND
		if (command === 'createticket') {
			console.log(`createticket ${discord}`)
			console.log(`tickets interaction ${discord.tickets[interaction.channel_id]}`)
			interactions.callback.post(
			{
				data: {
					type: 4,
					data: {
						content: 'Sending ticket message...',
					}
				}
			});
			guild.channels.get(channel_id).delete('Ticket removed');
			discord.ticketMessages[message.id] = {
				id: message.id
			};
			return;
		}
		// END CREATETICKET COMMAND

		// DELETE COMMAND
		else if (command === 'delete') {
			console.log(`delete ${discord}`)
			var channel_id = discord.tickets[interaction.channel_id];
			if (channel_id) {
				console.log(`tickets interaction ${discord.tickets[interaction.channel_id]}`)
				interactions.callback.post(
				{
					data: {
						type: 4,
						data: {
							content: 'Deleting...',
						}
					}
				});
				guild.channels.get(channel_id).delete('Ticket removed');
				delete discord.tickets[interaction.channel_id];
				return;
			}
			interactions.callback.post(
			{
				data: {
					type: 4,
					data: {
						content: 'You can only use this in a ticket channel!'
					}
				}
			});
		}
		// END DELETE COMMAND

	});
});

client.on('guildMemberAdd', member => {
	member.roles.add(skripter);
});

client.on('messageReactionAdd', (reaction, user) => {
	var message = reaction.message;
	for(const ticket of discord.ticketMessages) {
		if (ticket.id === message.id) {
			var ticketName = `Ticket-${Date.now}`;
			guild.channels.create({
				data: {
					name: ticketName,
					options: {
						topic: `This ticket was created for ${ticket.shortDesc}`,
					}
				},
				reason: `Roles are cool`,
			})
				.then(function(channel) {
					channel.send(`${user}`)
					const embed = new Discord.MessageEmbed()
						.setColor('#0099ff')
						.setTitle(ticketName)
						.setURL(`https://discord.com/channels/${message.channel.id}${message.id}`)
						.setAuthor('Skripthut', skripthut, skripthut)
						.setDescription('You created a ticket!')
						.setThumbnail('https://i.imgur.com/skkhgOy.png')
						.addFields(
							{ name: 'Voice Commands', value: 'Commands that are used for voice channels.' },
						)
						.setImage(`https://i.imgur.com/qbgmzfI.gif`)
						.setTimestamp()
						.setFooter('We da gangsters', 'https://i.imgur.com/AAilG4C.png');

					channel.send(embed);
				});
		}
	}
});

setInterval(function() {
	writeJSON('./discord.json', discord);
}, 30000);

client.login(clientData.botToken);