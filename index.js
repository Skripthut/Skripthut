// 'use strict';

Object.defineProperty(Object.prototype, '_object', { get: function() { return this; } });

/**
 * Returns the logarithm of a number with a specified base, defaulting to E.
 * 
 * @param {number} argument The argument of the logarithm
 * @param base The base of the logarithm
**/
const log = (argument, base = Math.E) => (base === Math.E) ? Math.log(argument) : Math.log(argument) / Math.log(base);

/**
 * Returns a number limited between the specified minimum and maximum.
 * 
 * @param {number} number The desired number to limit
 * @param {number} min The lowest the specified number can be
 * @param {number} max The highest the specified number can be
**/
const limit = (number, min, max) => Math.max(Math.min(number, max), min);

/**
 * Format a number of bytes to KiB, MiB, GiB, TiB, etc.
 * 
 * @param {number} bytes The number of bytes to format
 * @param decimals The decimal precision of the formatted string (2 = 0.01, 3 = 0.001)
**/
function formatBytes(bytes, decimals = 2) {
	if (bytes <= 0) { return '0 Bytes'; }

	const k = 1024;
	const dm = Math.max(0, decimals);
	const sizes = [ 'Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB' ];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Sleeps for a certain amount of time (specified in milliseconds)
 * 
 * @param {number} ms The amount of milliseconds to wait before continuing
 * @returns {Promise<void>} Returns a promise which resolves after `ms` milliseconds.
**/
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Returns a shuffled copy of the specified array using the Fisher-Yates Shuffle. Please advise from using this with massive arrays, since this can produce lag.
 * 
 * @template {Array} T
 * @param {T} array The array to shuffle
 * @returns {T} Returns a shuffled copy of `array`
**/
function shuffle(array) {
	if (!array instanceof Array) { return null; }
	var length = array.length;
	var copy = [ ...array ];
	for (let i = length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[ copy[i], copy[j] ] = [ copy[j], copy[i] ];
	}
	return copy;
}

console.log(shuffle([ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 ]));

try {
	require(`dotenv`).config({ path: './secrets/client.env/' });
} catch(error) {}
const axios = require(`axios`);
/**
 * @module Discord
**/
const Discord = require(`discord.js`);
const events = require(`./lib/events.js`);

const fs = require(`fs-extra`);
global._ = require(`lodash`);

var intentsField = 0;
const intentLength = Object.keys(Discord.Intents.FLAGS).length;
for (let i = 0; i <= intentLength; i++) { intentsField += 1 << i; }

const client = new Discord.Client({ intents: new Discord.Intents(intentsField) /* All Intents */ });
global.discord = fs.readJSONSync('./database/discord.json');

global.metadata = {};

/**
 * Sets persistent value of an object
 * 
 * @param object The object which persistent value to set (works as long as an id property is set)
 * @param {string} tag The persistent value to set (works recursively)
 * @param value The value to set to
 * @returns Returns the new persistent value object
**/
function setPersistent(object, tag, value) {
	if (!object.id) { return; }
	return _.set(discord, `persistentValues.${object.constructor.name}.${object.id}.${tag}`, value);
}

/**
 * Gets persistent value of an object
 * 
 * @param object The object which persistent value to get (works as long as an id property is set)
 * @param {string} tag The persistent value to get (works recursively)
 * @returns Returns the persistent value of the object
**/
function getPersistent(object, tag) {
	if (!object.id) { return; }
	return _.get(discord, `persistentValues.${object.constructor.name}.${object.id}.${tag}`);
}

/**
 * Deletes persistent value of an object
 * 
 * @param object The object which persistent value to delete (works as long as an id property is set)
 * @param {string} tag The persistent value to delete (works recursively)
 * @returns Returns true if the persistent value is deleted, else false
**/
function deletePersistent(object, tag) {
	if (!object.id) { return; }
	return _.unset(discord, `persistentValues.${object.constructor.name}.${object.id}.${tag}`);
}

/**
 * Color constant for simple colours
**/
const Color = {
	RED: '#ff0000',
	YELLOW: '#ffff00',
	GREEN: '#00ff00',
	SKRIPTHUB: {
		EVENTS: '#a763ff',
		CONDITIONS: '#ff3d3d',
		EFFECTS: '#0178ff',
		EXPRESSIONS: '#0de505',
		TYPES: '#f39c12',
		FUNCTIONS: '#b4b4b4'
	}
}
global.Color = Color;

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
	const commands = getApp(guildId).commands;
	const awaitCommands = await commands.get();
	for (const command of awaitCommands) {
		console.log('deleting', command.name)
		var deleteCommand = getApp(guildId).commands(command.id);
		await deleteCommand.delete();
	}
	console.log('deleted');
	return true;
}
/**
 * Register all commands stored in discord.json.
 *
 * @param {Discord.Guild} guild The guild you want to register the commands onto.
 * @param ignoreSame If true, do not register commands that are identical to already registered commands.
 * @param deleteUnset If true, delete all commands that have no identical registered commands.
 * @returns Returns once all commands are registered.
**/
async function registerCommands(guild, ignoreSame = true, fixJSON = true, deleteUnset = true) {
	console.log('registering');
	if (!client.application?.owner) { await client.application?.fetch(); }
	
	const appCommands = guild.commands;

	if (ignoreSame || fixJSON || deleteUnset) {
		var dynamicProperties = [ 'id', 'applicationId', 'version', 'guild', 'guildId', 'permissions', 'defaultPermission' ];
		var appCommandsArray = await appCommands.fetch();
		
		var registeredCommands = {};
		for (const appCommand of appCommandsArray) {
			const applicationCommand = appCommand[1];
			dynamicProperties.forEach((key) => delete applicationCommand[key]);
			registeredCommands[appCommand[0]] = applicationCommand;
		}
		
		if (Object.keys(registeredCommands)) {
			var entries = Object.entries(registeredCommands).filter(() => true);
			var isCommandSet = function(command) {
				for (var i = entries.length - 1; i > -1; i--) {
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

	var commands = [];
	var commandNames = [];
	var localCommands = fs.readdir('./commands');
	await localCommands.then(async (localCommands) => {
		for (const command of localCommands) {
			const commandData = fs.readJSONSync(`./commands/${command}`);
			commands = [ ...commands, commandData ];
			commandNames = [ ...commandNames, commandData.name ];
		}
	});
	
	for (const command of commands) {
		if (isCommandSet) {
			const result = isCommandSet(command);
			if (result) { continue; }
		}

		console.log(`register ${command.name}`);
		await appCommands.create(command);
		discord.totalRegisteredCommands++;
	}
	
	if ((fixJSON || deleteUnset) && entries.length) {
		let newAppCommandsArray = await appCommands.fetch();
		if (deleteUnset) {
			for (let i = newAppCommandsArray.length - 1; i > -1; i--) {
				const command = newAppCommandsArray[i];
				const name = command.name;
				if (!commandNames.includes(name)) {
					console.log(`delete unset ${name}`);
					getApp(guildId).commands(command.id).delete();
					newAppCommandsArray.splice(i, 1);
				}
			}
		}
		
		if (fixJSON) {
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
				var name = value.name;
				fixCommandJSON(name);
			}
		}
	}
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
 * { [x]s - seconds, [x]m - minutes, [x]h - hours, [x]d - days, [x]y - years } where [x] is any number
 * 
 * @param {string} string The formatted string to parse
 * @returns Returns millis from formatted string
 * @example
 * var oneYearTwoDaysThreeSeconds = getMillisFromString('2d1y3s'); // 
**/
async function getMillisFromString(string) {
	if (!string) { return null; }
	var millisTimespan = 0;

	let key;
	const addMillis = (timespan) => {
		millisTimespan += parseFloat(timespan[1]) * millis[key][1];
	}
	
	for (key of Object.keys(timespanRegex)) {
		[ ...string.matchAll(timespanRegex[key]) ].forEach(addMillis);
	}
	return millisTimespan;
}

/**
 * @param {number} millisTimespan The length of the punishment in milliseconds
 * @returns Returns an object containing the total milliseconds of the formatted timespan, and a readable timespan using said milliseconds
**/
async function getPunishmentDetails(millisTimespan) {
	if (!millisTimespan) { return null; }
	var now = Date.now();
	var timespan = await getMillisFromString(millisTimespan);
	if (timespan === Infinity || timespan === NaN) { return null; }

	var milliseconds = timespan;

	/** @type {string[]} **/
	var time = [];
	for (const key of Object.keys(millis).reverse()) {
		var milliValue = Math.floor(timespan / millis[key][1]);
		if (milliValue) { time = [ ... time, `${milliValue} ${milliValue === 1 ? key.substr(0, key.length - 1) : key}` ]; }
		timespan -= milliValue * millis[key][1];
	}

	return {
		now: now,
		milliseconds: milliseconds,
		readableTimespan: time.join(", "),
		endDate: (milliseconds) ? new Date(now + milliseconds) : null
	};
}

/**
 * Checks if a string is empty or not set
 * 
 * @param {string} string The string to check
**/
const isEmpty = (string) => (string === undefined || string === '');

/**
 * Cover a text with a markdown code block
 * 
 * @param {string} string The text to put in the code block
 * @param format The markdown code format for the code block (defaults to 'vb')
 * @returns The code block with `string` inside it
**/
const getCodeBlock = (string, format = 'vb') => `\`\`\`${format}\n${string}\`\`\``;

var permissionMessage;
var guildId;
var guild;
var skripter;
var skripthut;
var tickets;

var SkriptDocs;
var noResults;
console.log('hello');
client.on('ready', async () => {
	console.log(`Logged in as ${client.user.tag}!`);

	permissionMessage = `You don't have permission to do this!`;
	guildId = "854838419677904906";
	guild = client.guilds.cache.get(guildId);
	skripter = "860242610613911553";
	skripthut = "https://i.imgur.com/jumFMJ5.png";
	tickets = "854954327268786227";

	SkriptDocs = {
		SkUnityAPIKey: "58b93076b6269edd",
		SkriptHubAPIVersion: "v1",
		SkriptHubAPIKey: "019e6835c735556d3c42492ed59493e84d197a97",
	}
	SkriptDocs.SkriptHubAPIAuth = {
		headers: {
			Authorization: `Token ${SkriptDocs.SkriptHubAPIKey}` 
		}
	}
	noResults = "https://i.imgur.com/AjlWaz5.png";

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
 * @param {number} min The minimum number to get a random number between.
 * @param {number} max The maximum number to get a random number between.
 * @returns {number} The pseudorandom float between `min` and `max`.
**/
function getRandom(min, max) {
	return min + Math.random() * max;
}
/**
 * Returns a pseudorandom integer between a minimum and maximum range.
 *
 * @param {number} min The minimum number to get a random integer between.
 * @param {number} max The maximum number to get a random integer between.
 * @returns {number} The pseudorandom integer between `min` and `max`.
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

/*var access = fs.createWriteStream(`./logs/${now}**${discord.activations}.stdout`);
process.stdout.write = process.stderr.write = access.write.bind(access);

process.on('uncaughtException', function(err) {
  console.error((err && err.stack) ? err.stack : err);
});*/

client.on('guildBanRemove', async (ban) => {
	_.unset(discord.guilds, `${guild.id}.members.${user.id}.banned`);
});

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
		var bans = await client.guilds.cache.get(guildId).bans.fetch();
		for (const banInfo of bans) {
			var userId = banInfo[1].user.id;
			var banned = guildData.members?.[userId]?.banned;
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

	(/**
	 * Clears all empties in `discord` and `metadata` objects asynchronously.
	**/
	async function() {
		clearEmpties(discord);
		clearEmpties(metadata);
	})();

	fs.writeJSON('./database/discord.json', discord, { spaces: '\t' });
}

process.on('exit', (code) => {
	console.log('Exiting...');
	clearEmpties(discord);
	fs.writeJSONSync('./database/discord.json', discord, { spaces: '\t' });
	console.log('Saved discord.json!');
});

/*console.log('proceeding to log in', process.env.TOKEN);
client.on('rateLimit', (...args) => console.log('rateLimit', ...args));
client.on('debug', console.debug);*/
client.login(process.env.TOKEN);
console.log('started log in procedure');