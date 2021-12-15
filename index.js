// 'use strict';

Object.defineProperty(Object.prototype, '_object', { get: function() { return this; } });

/**
 * Returns a number limited between the specified minimum and maximum.
 * 
 * @param {number} number The desired number to limit
 * @param {number} min The lowest the specified number can be
 * @param {number} max The highest the specified number can be
**/
const limit = (number, min, max) => Math.max(Math.min(number, max), min);

const shuffle = require(`./lib/methods/shuffle.js`);

console.log(shuffle([ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 ]));

try {
	require(`dotenv`).config({ path: './secrets/client.env/' });
} catch(error) {}
/**
 * @module Discord
**/
const Discord = require(`discord.js`);
const client = require(`./lib/constants/Client.js`);
const fs = require(`fs-extra`);
global._ = require(`lodash`);

const database = require(`./database/database.js`);
const { metadata } = require(`./lib/util/Metadata.js`);

const events = require(`./lib/events.js`);

const Color = require(`./lib/constants/Color.js`);
const { guild } = require(`./lib/constants/General.js`);

console.log('guild', guild);

/**
 * Gets the application of the Discord client in a specific guild.
 *
 * @param {Discord.Snowflake} guildId The ID of the specific guild.
 * @returns Returns the application for the specified guild.
**/
function getApp(guildId) {
	const app = client.api.applications(client.user.id);
	if (guildId) { app.guilds(guildId); }
	return app;
}
/**
 * Delete all commands currently on Discord server.
 *
 * @param {Discord.Snowflake} guildId The ID of the guild which the commands you want to delete are on.
 * @returns Returns once all commands are deleted.
**/
async function deleteCommands(guildId) {
	console.log('deleting commands...')
	const commands = getApp(guildId).commands;
	const awaitCommands = await commands.get();
	for (const command of awaitCommands) {
		console.log('deleting', command.name)
		let deleteCommand = getApp(guildId).commands(command.id);
		await deleteCommand.delete();
	}
	console.log('deleted all commands!');
	return true;
}
/**
 * Register all commands stored in main.json.
 *
 * @param {Discord.Guild} guild The guild you want to register the commands onto
 * @param ignoreSame Whether to not register commands that are identical to already registered commands
 * @param deleteUnset Whether to delete all commands that have no identical registered commands
 * @returns Returns once all commands are registered
**/
async function registerCommands(guild, ignoreSame = true, fixJSON = true, deleteUnset = true) {
	console.log('registering commands...', ignoreSame, fixJSON, deleteUnset);
	if (!client.application?.owner) { await client.application?.fetch(); }
	
	const appCommands = guild.commands;

	if (ignoreSame || fixJSON || deleteUnset) {
		let dynamicProperties = [ 'id', 'applicationId', 'version', 'guild', 'guildId', 'permissions', 'defaultPermission' ];
		let appCommandsArray = await appCommands.fetch();
		
		let registeredCommands = {};
		for (const appCommand of appCommandsArray) {
			const applicationCommand = appCommand[1];
			dynamicProperties.forEach((key) => delete applicationCommand[key]);
			registeredCommands[appCommand[0]] = applicationCommand;
		}
		
		if (Object.keys(registeredCommands)) {
			let entries = Object.entries(registeredCommands).filter(() => true);
			let isCommandSet = function(command) {
				for (let i = entries.length - 1; i > -1; i--) {
			   		const entry = entries[i];
					if (JSON.stringify(command) === JSON.stringify(entry[1])) {
						entries.splice(i, 1);
						return true;
					}
				}
				return; 
			}
		}
	}

	let commands = [];
	let commandNames = [];
	let localCommands = fs.readdir('./commands');
	await localCommands.then(async (localCommands) => {
		for (const command of localCommands) {
			const commandData = fs.readJSONSync(`./commands/${command}`);
			commands.push(commandData);
			commandNames[command.substring(0, (command.length - 4))] = commandData.name;
		}
	});
	
	for (const command of commands) {
		if (isCommandSet) {
			const result = isCommandSet(command);
			if (result) { continue; }
		}

		console.log(`register ${command.name}`);
		await appCommands.create(command);
		database.discord.totalRegisteredCommands++;
	}
	
	if ((fixJSON || deleteUnset) && entries.length) {
		let newAppCommandsArray = await appCommands.fetch();
		console.log(newAppCommandsArray);
		if (deleteUnset) {
			console.log(`deleting unset commands...`);
			for (let i = newAppCommandsArray.length - 1; i > -1; i--) {
				const command = newAppCommandsArray[i];
				const name = command.name;
				if (!commandNames.includes(name)) {
					console.log(`delete unset ${name}`);
					(await appCommands.fetch(command.id)).delete();````````````````````
					
					newAppCommandsArray.splice(i, 1);
				}
			}
			console.log(`deleted all unset commands!`);
		}

		if (fixJSON) {
			console.log(`fixing command json...`);
			let newAppCommandsDataArray = JSON.parse(JSON.stringify(newAppCommandsArray));
			for (const newCommand of newAppCommandsDataArray) {
				dynamicProperties.forEach((key) => delete newCommand[key]);
			}
			
			async function fixCommandJSON(name) {
				for (const newCommand of newAppCommandsDataArray) {
					if (newCommand.name === name) {
						console.log(`Fix ./commands/${name}.json`);
						fs.writeFile(`./commands/${name}.json`, JSON.stringify(newCommand, null, 4));
						return;
					}
				}
			}
			
			for (const [ key, value ] of entries) {
				let name = value.name;
				fixCommandJSON(name);
			}
			console.log(`fixed all command json!`);
		}
	}
	console.log(`registered all commands!`);
	return true;
}

console.log('hello');
client.on('ready', async () => {
	console.log(`Logged in as ${client.user.tag}!`);

	await registerCommands(guild).catch(console.error);

	client.on('raw', async (packet) => {
		if ([ 'MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE' ].includes(packet.t)) {
			console.log('packet.d', packet.d);
			const channel = client.channels.cache.get(packet.d.channel_id);
			if (channel.messages.cache.get(packet.d.message_id)) { return };
			channel.messages.fetch(packet.d.message_id).then((message) => {
				const emoji = packet.d.emoji.id ?? packet.d.emoji.name;
				const reaction = message.reactions.cache.get(emoji);
				if (packet.t === 'MESSAGE_REACTION_ADD') {
					client.emit('messageReactionAdd', reaction, client.users.cache.get(packet.d.userId));
				}
				else {
					client.emit('messageReactionRemove', reaction, client.users.cache.get(packet.d.userId));
				}
			})
				.catch(console.error);
		}
	});
	
	console.log('registering events...');
	for (const [ key, value ] of Object.entries(events)) {
		console.log(key);
		client.on(key, value);
	}
	console.log('registered!')

	setInterval(reloadDiscordJSON, 1000);
});

/**
 * Returns a pseudorandom float between a minimum and maximum range.
 *
 * @param {number} min The minimum number to get a random number between
 * @param {number} max The maximum number to get a random number between
 * @returns {number} The pseudorandom float between `min` and `max`
**/
function getRandom(min, max) {
	return min + Math.random() * max;
}

let now = (new Date).toISOString().substring(0, 10);
if (database.lastActivation !== now) {
	database.activations = 0;
}

database.lastActivation = now;
database.activations++;

/*let access = fs.createWriteStream(`./logs/${now}**${database.activations}.stdout`);
process.stdout.write = process.stderr.write = access.write.bind(access);

process.on('uncaughtException', function(err) {
  console.error((err && err.stack) ? err.stack : err);
});*/

client.on('guildBanRemove', async (ban) => {
	_.unset(database.discord.guilds, `${guild.id}.members.${user.id}.banned`);
});

function clearEmpties(object) {
	for (let key in object) {
		if (!object[key] || typeof object[key] !== "object") { continue; }
		clearEmpties(object[key]);
		if (!Object.keys(object[key]).length) { delete object[key]; }
	}
}

async function reloadDiscordJSON() {
	let now = Date.now();
	Object.keys(database.discord.guilds).forEach(async (guildId) => {
		let guildData = database.discord.guilds[guildId];
		/** @type {Discord.Guild} */
		let guild = client.guilds.cache.get(guildId);
		let bans = await client.guilds.cache.get(guildId).bans.fetch();
		for (const banInfo of bans) {
			let userId = banInfo[1].user.id;
			let banned = guildData.members?.[userId]?.banned;
			if (banned) {
				let banTime = banned.banTime;
				let banDate = banned.banDate;
				let moderator = client.users.cache.get(banned.moderator);
				if (banDate + banTime <= now) {
					await guild.members.unban(userId, `Temporary ban ran out (${moderator.tag})`);
					delete database.discord.guilds[guildId].members[userId].banned;
				}
			}
		}
	});

	(/**
	 * Clears all empties in `database` and `metadata` objects asynchronously.
	**/
	async function() {
		clearEmpties(database);
		clearEmpties(metadata);
	})();

	fs.writeJSON('./database/main.json', database, { spaces: '\t' });
}

process.on('exit', (code) => {
	console.log('Exiting...');
	clearEmpties(database);
	fs.writeJSONSync('./database/main.json', database, { spaces: '\t' });
	console.log('Saved main.json!');
});

/*console.log('proceeding to log in', process.env.TOKEN);
client.on('rateLimit', (...args) => console.log('rateLimit', ...args));
client.on('debug', console.debug);*/
client.login(process.env.TOKEN);
console.log('started log in procedure');