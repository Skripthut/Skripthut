// 'use strict';

Object.defineProperty(Object.prototype, '_object', { get: function() { return this; } });

/**
 * Returns the logarithm of a number with a specified base, defaulting to E.
 * 
 * @param {number} argument The argument of the logarithm
 * @param base The base of the logarithm
**/
const log = (argument, base = Math.E) => (base === Math.E) ? Math.log(argument) : Math.log(argument) / Math.log(base)

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

/**
 * Catches the specified Promise and runs a callback if rejected+, and returns the specified Promise if resolved.
 * 
 * @template {Promise<any>} T
 * @param {T} promise The promise to catch.
 * @param {Function} onCatch The callback to run on catch.
 * @returns {T} Returns `promise` if resolved, else `null`.
**/
async function returnCatch(promise, onCatch) {
	var caught;
	await promise.catch(() => { onCatch(); caught = true; });
	if (caught) { return; }
	return (caught) ? null : promise;
}

/**
 * Reads a file and parses it using JSON.
 *
 * @param {string} path The directory of the file you want to load
 * @returns Returns the stringified JSON as JavaScript object
**/
const loadJSON = (path) => JSON.parse(fs.readFileSync(path, `utf8`));

/**
 * Stringifies an object using JSON and writes it into a file.
 *
 * @param {string} path The directory of the file you want to write
 * @param data The object to be stringified
 * @returns Returns the writeFile Promise
**/
const writeJSON = (path, data) => fs.writeFile(path, JSON.stringify(data, null, 4), `utf8`);

try {
	require(`dotenv`).config({ path: './secrets/client.env/' });
} catch(error) {}
const htmlEntities = require(`html-entities`);
const axios = require(`axios`);
/**
 * @module Discord
**/
const Discord = require(`discord.js`);
const fs = require(`fs-extra`);
const _ = require(`lodash`);

var intentsField = 0;
const intentLength = Object.keys(Discord.Intents.FLAGS).length;
for (let i = 0; i <= intentLength; i++) { intentsField += 1 << i; }

const client = new Discord.Client({ intents: new Discord.Intents(intentsField) /* All Intents */ });

/** The main Skripthut database **/
var discord;
try {
	discord = loadJSON('./database/discord.json');
} catch(error) {
	writeJSON('./database/discord.json', {});
}

const metadata = {};
/**
 * Sets metadata tag of an object
 * 
 * @param object The object which metadata to set (works as long as an id property is set)
 * @param {string} tag The metadata tag to set (works recursively)
 * @param value The value to set to
 * @param {number} [lifespan] The optional lifespan of the metadata (deletes after specified lifespan in milliseconds)
 * @returns Returns the new metadata object
**/
function setMetadata(object, tag, value, lifespan) {
	if (typeof tag !== 'string' || !object.id) { return; }
	tag = `${object.constructor.name}.${object.id}.${tag}`;
	if (lifespan) {
		var now = Date.now();
		var timeSetTag = `${tag}::timeSet`;
		metadata[timeSet] = now;
		setTimeout(function() {
			if (metadata[timeSet] === now) { _.unset(metadata, tag); delete metadata[timeSetTag]; }
		}, lifespan);
	}
	return _.set(metadata, tag, value);
}

/**
 * Gets metadata tag of an object
 * 
 * @param object The object which metadata to get (works as long as an id property is set)
 * @param {string} [tag] The metadata tag to get (works recursively; returns all metadata if omitted)
 * @returns Returns the metadata tag of the object
**/
function getMetadata(object, tag) {
	if (!object.id) { return; }
	tag = `${object.constructor.name}.${object.id}${tag ? `.${tag}` : ``}`;
	delete metadata[tag];
	return _.get(metadata, tag);
}

/**
 * Deletes metadata tag of an object
 * 
 * @param object The object which metadata to delete (works as long as an id property is set)
 * @param {string} tag The metadata tag to delete (works recursively)
 * @returns Returns true if the metadata tag is deleted, else false
**/
function deleteMetadata(object, tag) {
	if (!object.id) { return; }
	return _.unset(metadata, `${object.constructor.name}.${object.id}.${tag}`);
}

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

/**
 * The ReactionRoleEmote class for reaction roles.
**/
class ReactionRoleEmote {
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
		else if (role.constructor?.name === 'Role') { roleId = role.id; }
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
	 * @param {Discord.RoleResolvable} role The desired Role or Role ID Snowflake to change the role property of this to.
	**/
	set setRole(role) {
		var roleId = this.role;

		if (client.guilds.cache.get(this.guild)?.roles.cache.get(role)) { roleId = role; }
		else if (role instanceof Discord.Role) { roleId = role.id; }
		else { throw new Error('Given role parameter is not a valid role ID or Role'); }

		/**
		 * The ID of the reaction role
		 * @type {Discord.Snowflake}
		**/
		this.id = roleId;
	}
}

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
			const commandData = loadJSON(`./commands/${command}`);
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
 * Gets addon info from a specified addon identifier
 * 
 * @param {string} addon The identifier of the addon (JAR file for SkriptTools, URL for SkriptHub)
 * @param api The desired API for the addon
 * @returns 
 * {{
 * author: string[],
 * description: string,
 * plugin: string,
 * version: string,
 * bytes: string,
 * plugin: string,
 * version: string,
 * bytes: string,
 * download: string,
 * website?: string,
 * sourcecode?: string,
 * depend: {}
 * }} The info of the addon
**/

async function getAddonInfo(addon, api = 'skripttools') {
	if (api === 'skripttools') {
		const response = await returnCatch(axios.get(`https://api.skripttools.net/v4/addons/${addon}/`), console.error);
		if (!response) { return; }
		return response.data.data;
	}

	else if (api === 'skripthub') {
		var url = addon.url;
		var match = url.match(/https:\/\/github\.com\/([\w-]+)\/([\w-]+)(?:\/releases)?/i);
		if (!match) { 
			return {
				author: [ addon.author ],
				plugin: addon.name,
				website: url,
				depend: {}
			};
		}

		var response = await returnCatch(axios.get(`https://api.github.com/repos/${match[1]}/${match[2]}/releases`, {
			headers: {
				accept: 'application/vnd.github.v3+json'
			},
			params: {
				per_page: 1,
				page: 1
			}
		}));
		if (!response) { return; }

		var data = response.data[0];
		var asset = data.assets[0];
		var result = {
			author: [ addon.author ],
			plugin: addon.name,
			version: data.tag_name,
			bytes: asset.size,
			download: asset.browser_download_url,
			website: url,
			sourcecode: data.zipball_url,
			depend: {}
		}

		console.log('result', result);
		return result;
	}
}

/**
 * Get addon info from a partial name
 * 
 * @param {string} name The partial name to search for
 * @param api The desired API to use for searching (skripttools or skripthub)
 * @returns A few details of the first matched addon
**/
async function getAddon(name, api = 'skripttools') {
	name = name.toLowerCase();
	if (api === 'skripttools') {
		var response = await returnCatch(axios.get(`https://api.skripttools.net/v4/addons`), console.error);
		if (!response) { return null; }

		var data = response.data.data;
		for (const addon in data) {
			if (addon.toLowerCase().includes(name)) { return { name: addon, files: data[addon]}; }
		}
	}

	else if (api === 'skripthub') {
		var response = await returnCatch(axios.get(`http://skripthub.net/api/${SkriptDocs.SkriptHubAPIVersion}/addon/`, SkriptDocs.SkriptHubAPIAuth));
		if (!response) { return null; }
		
		var data = response.data;
		for (const addon of data) {
			var addonName = addon.name;
			if (addonName.toLowerCase().includes(name)) { return { name: addonName, author: addon.author, url: addon.url }; }
		}
	}
	return;
}

/**
 * Get all syntax matching a search query
 * 
 * @param {string} query The search query (i.e. `kill from:skript type:effect`)
**/
async function searchForSyntax(query, api = 'skunity') {
	if (api === 'skunity') {
		var response = await returnCatch(axios.get(`https://docs.skunity.com/api/?key=${SkriptDocs.SkUnityAPIKey}&function=doSearch&query=${query}`));
		if (!response) { return { api: api, result: [] }; }

		/** @type {{response: string, result: {info: {returned: number, functionsRan: number, totalRecords: number}, records: {id: string, name: string, doc: ('events' | 'expressions' | 'effects' | 'conditions' | 'types'), desc: string, addon: string, version: string, pattern: string, plugin: string, eventvalues: string, changers: string, returntype: string, is_array: ('0' | '1'), tags: string, reviewed: ('true' | 'false'), versions: string, examples: {id: string, example: string, forid: string, votes: string, userId: string, xfId: string, date: string}[], info: {status: string}, perc: number}[]}}} **/
		var data = response.data;

		return { api: api, result: data.result.records };
	}

	else if (api === 'skripthub') {
		var response = await returnCatch(axios.get(`https://docs.skunity.com/api/?key=${SkriptDocs.SkUnityAPIKey}&function=doSearch&query=${query}`));
		if (!response) { return { api: api, result: [] }; }

		/** @type {{response: string, result: {info: {returned: number, functionsRan: number, totalRecords: number}, records: {id: string, name: string, doc: ('events' | 'expressions' | 'effects' | 'conditions' | 'types'), desc: string, addon: string, version: string, pattern: string, plugin: string, eventvalues: string, changers: string, returntype: string, is_array: ('0' | '1'), tags: string, reviewed: ('true' | 'false'), versions: string, examples: {id: string, example: string, forid: string, votes: string, userId: string, xfId: string, date: string}[], info: {status: string}, perc: number}[]}}} **/
		var data = response.data;

		return { api: api, result: null };
	}
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

/**
 * Class for easy access to examples and embed using skUnity syntax
**/
class SkriptSyntax {
	// {{response: string, result: {info: {returned: number, functionsRan: number, totalRecords: number}, records: {stuff}[]}}}

	/**
	 * Get access to SkriptSyntax methods using a skUnity syntax object
	 * 
	 * @param syntax The syntax object to convert to a SkriptSyntax object
	 * @param {('skunity' | 'skripthub')} api The api the syntax originates from (skunity or skripthub)
	 * @returns The new SkriptSyntax object
	**/
	constructor(syntax, api = 'skunity') {
		/** @type {(string | number)} The doc id of this syntax **/
		this.id = syntax.id;
		/** @type {string} The name of this syntax **/
		this.name = syntax.name || syntax.title;
		/** @type {('events' | 'expressions' | 'effects' | 'conditions' | 'types' | 'functions')} The doc type of this syntax **/
		this.doc = syntax.doc;
		/** @type {string} The description of this syntax **/
		this.desc = syntax.desc;
		/** @type {string} The addon of this syntax **/
		this.addon = syntax.addon;
		/** @type {string} The version this syntax originates from **/
		this.version = syntax.version;
		/** @type {string} The pattern(s) of this syntax, with a new line delimiter **/
		this.pattern = syntax.pattern;
		/** @type {string} The required plugin(s) for this syntax **/
		this.plugin = syntax.plugin;
		/** @type {string} The event values of this syntax **/
		this.eventvalues = syntax.eventvalues;
		/** @type {string} The changers of this syntax (add, remove, set, etc.) **/
		this.changers = syntax.changers;
		/** @type {string} The type this syntax returns **/
		this.returntype = syntax.returntype;
		/** @type {('0' | '1')} Whether or not this syntax is plural **/
		this.is_array = syntax.is_array;
		/** @type {string} The examples of this syntax **/
		this.examples = syntax.examples;
		/** @type {string} The API this syntax is from **/
		this.api = api;
	}

	/**
	 * Get the example of this SkriptSyntax
	 * 
	 * @returns The example of this SkriptSyntax
	**/
	async getExample() {
		if (this.api === 'skunity') {
			var response = await returnCatch(axios.get(`https://docs.skunity.com/api/?key=${SkriptDocs.SkUnityAPIKey}&function=getExamplesByID&syntax=${this.id}`), console.error);
			if (!response) { return; }
			if (!response.data.result[0]) { return; }

			return htmlEntities.decode(response.data.result[0].example);
		}
		if (this.api === 'skripthub') {

		}
	}
	
	/**
	 * Get a formatted embed using this SkriptSyntax's properties
	 * 
	 * @param {string} [example] The desired visible example of this syntax
	 * @returns A formatted embed using this SkriptSyntax
	**/
	getEmbed(example) {
		var fields = [
			{ name: 'Pattern', value: getCodeBlock(this.pattern) }
		];
		if (!isEmpty(example)) { fields.push({ name: 'Example', value: getCodeBlock(example) }); }
		fields.push({ name: 'Addon', value: this.addon, inline: true }, { name: 'Requires', value: 'Skript', inline: true });

		var embed = new Discord.MessageEmbed()
			.setColor(Color.SKRIPTHUB[this.doc.toUpperCase()])
			.setTitle(this.name)
			.setURL(`https://docs.skunity.com/syntax/search/id:${this.id}`)
			.addFields(fields);

		if (!isEmpty(this.desc)) { embed.description = this.desc; }

		return embed;
	}
}

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
			const channel = client.channels.cache.get(packet.d.channelId);
			if (channel.messages.cache.get(packet.d.messageId)) { return };
			channel.messages.fetch(packet.d.messageId).then((message) => {
				const emoji = packet.d.emoji.id || packet.d.emoji.name;
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

	setInterval(reloadDiscordJSON, 1000);
});

client.on('interactionCreate', async (interaction) => {
	if (interaction.isCommand()) {
		const { commandName, options } = interaction;
		const command = commandName.toLowerCase();

		/**
		 * Format options received by an interaction into a more readable object.
		 * 
		 * @param {Discord.CommandInteractionOption[]} options The options to format.
		 * @returns The formatted options object.
		**/
		 function formatOptions(options) {
			const args = {};
			if (options) {
				for (const option of options) {
					const { name, type } = option;
					const value = ((type === "MENTIONABLE") ? (option.member ?? option.role) : option[{
						USER: 'member',
						CHANNEL: 'channel',
						ROLE: 'role'
					}[type] ?? 'value']);

					args[name] = value;
				}
			}
			return args;
		}

		/** The optional subcommand group used **/
		const group = options._group;
		/** The optional subcommand used **/
		const subcommand = options._subcommand;

		const args = formatOptions(options._hoistedOptions);

		console.log('formatted args', args, 'from', options);

		/** 
		 * The member who created the interaction
		 * 
		 * @type {Discord.GuildMember}
		**/
		const member = interaction.member;

		/** The user who created the interaction **/
		const user = member.user;
		/** The ID of the user who created the interaction **/
		const userId = user.id;

		/** The ID of the guild of the interactionb**/
		const guildId = interaction.guildId;
		/** The guild of the interaction **/
		const guild = member.guild;

		/** The ID of the channel of the interaction **/
		const channelId = interaction.channelId;
		/** The channel of the interaction **/
		const channel = interaction.channel;

		var logs = guild.channels.cache.get(discord.guilds?.[guild.id]?.message_logs);
		if (logs) { logs.send(`${user.tag} (${user.id}) executed /${command}`); }

		switch(command) {
			/*
			 * Skript Commands
			 */

			// ADDON COMMAND
			case 'addon':
				var addonName = args.name;
				console.log('name', addonName);
				if (!addonName) {
					reply(interaction, `Hi`);
					break;
				}

				var apiName = (args.api || 'SkriptTools');
				var api = apiName.toLowerCase();
				console.log('api', args.api);
			
				await deferReply(interaction);

				console.log('started thinking');

				var addon = await getAddon(addonName, api);
				console.log('addon', addon, addonName, api);
				if (!addon) {
					reply(interaction, 
						new Discord.MessageEmbed()
							.setColor(Color.RED)
							.setTitle('No Addon Found')
							.setDescription('No addons were found with that search')
							.setThumbnail(noResults)
							.setFooter(`Error | ${interaction.id}`)
						, "editReply", false);
					return;
				}

				if (api === 'skripttools') {
					var files = addon.files;
					var file = files[files.length - 1];
					var addonInfo = getAddonInfo(file, api);
				}
				else if (api === 'skripthub') {
					var addonInfo = getAddonInfo(addon, api);
				}
				console.log('addonInfo', addonInfo);
				if (!addonInfo) {
					reply(interaction, `Error: Unable to get addon info`, "editReply", false);
					return;
				}

				var download = addonInfo.download;
				var depends = addonInfo.depend;
				var plugin = `${addonInfo.plugin} ${addonInfo.version}`;
				var fields = [{ name: 'Addon', value: `**${plugin}.jar** by **${addonInfo.author.join(", ")}**`, inline: true }];
				if (depends.softdepend) { fields.push({ name: 'Soft Depends', value: depends.softdepend.join(", "), inline: true }); }
				if (addonInfo.sourcecode) { fields.push({ name: 'Source Code', value: addonInfo.sourcecode, inline: true }); }
				fields.push({ name: `Download (${formatBytes(parseInt(addonInfo.bytes))})`, value: download });

				var embed = new Discord.MessageEmbed()
					.setColor(Color.GREEN)
					.setTitle(plugin)
					.setURL(download)
					.addFields(fields)
					.setFooter(`Powered by ${apiName}`);

				if (addonInfo.description) { embed.description = addonInfo.description; }

				reply(interaction, embed, "editReply");
				return;
				// END ADDON COMMAND

			// DOCS COMMAND
			case 'docs':
				await deferReply(interaction);

				var query = args.query;
				var api = args.api.toLowerCase();

				var syntaxResult = await searchForSyntax(query, api);
				var syntaxList = syntaxResult.result;
				if (!syntaxList.length) { 
					reply(interaction, 
						new Discord.MessageEmbed()
							.setColor(Color.RED)
							.setTitle('No Results')
							.setDescription('No results were found for that query')
							.setThumbnail(noResults)
							.setFooter(`Error | ${interaction.id}`),
					"editReply", false);
					return;
				}

				var syntax = new SkriptSyntax(syntaxList[0]);
				var example = await syntax.getExample();
				var embed = syntax.getEmbed(example);
				embed.footer = `Powered by ${(api === 'skunity') ? 'skUnity Docs 2' : 'SkriptHub Docs 1'} | ${interaction.id}`;
				reply(interaction, embed, "editReply", false);
				break;
				// END DOCS COMMAND

			/*
			 * Reaction Commands
			 */

			// CREATETICKET COMMAND
			case 'createticket':
				console.log('member', member, 'guild', member.guild, 'roles', member.guild.roles, 'everyone', member.guild.roles.everyone);
				if (!member.permissions.has("MANAGE_MESSAGES")) {
					reply(interaction, permissionMessage);
					break;
				}

				await deferReply(interaction);

				var ticketChannel = guild.channels.cache.get(args.channel);
				var message = args.message.replace(/%(n(?:ew)?l(?:ine)?|line ?break)%/g, "\n");

				/** @type {Discord.Message} **/
				var sentMessage = await ticketChannel.send(message);
				discord.ticketMessages[sentMessage.id] = {
					id: sentMessage.id,
					description: args.description,
					channel: args.channel
				};

				await sentMessage.react(`📰`);
				reply(interaction, 'Sent!', "editReply");
				break;
				// END CREATETICKET COMMAND

			// CLOSE COMMAND
			case 'close':
				var ticket = discord.tickets?.[channelId];
				if (ticket) {
					var creator = guild.member(client.users.cache.get(ticket.member));

					if (ticket.closed) {
						reply(interaction, 'Closing permanently...');
						await channel.delete("Ticket closed permanently");
						delete discord.tickets[channelId];
						break;
					}
					reply(interaction, 'Closed...');
					const id = creator.id;
					const type = "member";

					const permissionOverwrite = await channel.permissionOverwrites.find((overwrites) => overwrites.type === type && overwrites.id === id);
					if (permissionOverwrite) { await permissionOverwrite.delete("Ticket closed"); }

					deleteStat(creator, "hasTicket");
					discord.tickets[channelId].closed = true;

					reply(interaction, '__Do `/close` again to permanently close the ticket.__', "followUp");
					break;
				}
				reply(interaction, 'You can only use this in a ticket channel!');
				break;
				// END CLOSE COMMAND

			/*
			 * Role Commands
			*/

			// ROLE COMMAND
			case 'role':
				if (!member.permissions.has("MANAGE_ROLES")) {
					reply(interaction, permissionMessage);
					break;
				}

				const role = args?.role;

				if (subcommand === 'grant') {
					const highestRole = member.roles.highest;
					if (highestRole.position <= role.position) {
						reply(interaction, `You don't have enough permission to grant ${role}!`);
						break;
					}
					let target = args.member;
					var reason = args.reason ?? `Granted by ${user.tag}`;

					reply(interaction, `Adding...`);
					await target.roles.add(role, reason);

					reply(interaction, `Added ${role} to ${target}'s roles!`, "followUp", true);
					break;
				}
				if (subcommand === 'revoke') {
					const highestRole = member.roles.highest;
					if (highestRole.position <= role.position) {
						reply(interaction, `You don't have enough permission to revoke ${role}!`);
						break;
					}

					await deferReply(interaction, true);
					let target = guild.member(args.member);
					var reason = (option.options[2] || { value: `Removed by ${user.tag}`}).value;

					reply(interaction, `Removed ${role} from ${target}'s roles...`, "editReply", true);
					target.roles.remove(role, reason);
					break;
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
						reply(interaction, embed);
						break;
					}
					var roles = Array.from(guild.roles.cache);
					var roleInfo = [];
					for (let i = 0; i < roles.length; i++) { roleInfo[i] = roles[i][1]; }
					reply(interaction, `${roleInfo}`);
					break;
				}
				break;
			// END ROLE COMMAND

			// REACTIONROLE COMMAND
			case 'reactionrole':
				if (!member.permissions.has("MANAGE_ROLES")) {
					reply(interaction, permissionMessage);
					break;
				}

				/** @type {Discord.MessageReaction} **/
				var reactionRoleEmote;
				/** @type {Discord.Snowflake} **/
				var reactionRoleEmoteId;

				/** @type {Discord.TextChannel} **/
				var reactionRoleChannel;

				/** @type {Discord.Message} **/
				var reactionRoleMessage;
				/** @type {Discord.Snowflake} **/
				var reactionRoleMessageId;

				/** @type {Discord.Role} **/
				var reactionRole;
				/** @type {Discord.Snowflake} **/
				var reactionRoleId;

				/** @type {[string, ReactionRoleEmote][]} **/
				var emotes;
				/** @type {{id: string, emotes: Map<string, ReactionRoleEmote>}} **/
				var _reactionRoleMessage;
				/** @type {string} **/
				var chosenEmote;

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
						reply(interaction, `That's not a valid emote!`);
						break;
					}

					reactionRoleChannel = args.channel;
					reactionRoleMessageContent = args.message.replace(/%(n(?:ew)?l(?:ine)?|line ?break)%/g, "\n");
					reactionRole = args.role;

					let reactionRoleMessage = reactionRoleChannel.send(reactionRoleMessageContent);
					await reply(interaction, 'Sending...');

					reactionRoleMessage.then(async (message) => {
						await message.react(reactionRoleEmote);
						discord.reactionRoleMessages[message.id] = {
							id: message.id,
							emotes: {}
						}
						discord.reactionRoleMessages[message.id].emotes[reactionRoleEmoteId] = new ReactionRoleEmote(message, reactionRole);
					});
					break;
				}

				// "add" and "remove" subcommands
				var ids = Array.from(args.message.matchAll(/https:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/))[0]; // Get ID's from URL

				if (ids[1] !== guildId) {
					reply(interaction, `That's not a valid message URL (guild ID invalid)!`);
					break;
				}
				reactionRoleChannel = guild.channels.cache.get(ids[2]);

				if (!reactionRoleChannel) {
					reply(interaction, `That's not a valid message URL (channel ID invalid)!`);
					break;
				}
				reactionRoleMessageId = ids[3];
				reactionRoleMessage = await reactionRoleChannel.messages.fetch(reactionRoleMessageId);
				if (!reactionRoleMessage) {
					reply(interaction, `That's not a valid message URL (message ID invalid)!`);
					break;
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
						reply(interaction, `That's not a valid emote!`);
						break;
					}

					reactionRole = args.role;

					_reactionRoleMessage = discord.reactionRoleMessages?.[reactionRoleMessageId];
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
						_.set(discord, `reactionRoleMessages.${reactionRoleMessageId}`, 
						{
							id: reactionRoleMessageId,
							emotes: {}
						});
					}
					discord.reactionRoleMessages[reactionRoleMessageId].emotes[reactionRoleEmoteId] = new ReactionRoleEmote(reactionRoleMessage, reactionRole);
					break;
				}

				if (type === 'remove') {
					_reactionRoleMessage = discord.reactionRoleMessages?.[reactionRoleMessageId];

					if (!_reactionRoleMessage) {
						reply(interaction, `This message doesn't have any reaction roles!`);
						break;
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
						for (var [key, value] of entries) {
							if (value.role === reactionRoleId) {
								delete discord.reactionRoleMessages[reactionRoleMessageId].emotes[key];
								return { id: key, length: entries.length - 1 };
							}
						}
					}					

					var removeEmotesResult = removeEmotes(emotes);

					if (!removeEmotesResult) {
						reply(interaction, `This message doesn't have that role!`);
						break;
					}

					if (!removeEmotesResult.length) {
						delete discord.reactionRoleMessages[reactionRoleMessageId];
					}

					var reactionRoleEmoteId = removeEmotesResult.id;

					var reactionRole = guild.roles.cache.get(reactionRoleId);

					reply(interaction, `Removing ${reactionRole} from the specified message...`);
					reactionRoleMessage.reactions.resolve(reactionRoleEmoteId).remove();
					break;
				}
				reply(interaction, 'bruh moment');
				break;

			// COLOURROLE COMMAND
			case 'colourrole':
				if (!member.permissions.has("ADMINISTRATOR")) {
					reply(interaction, 'nuu');
					break;
				}
				
				var roles = member.roles.cache;
				var hasRoles =
				(
					roles.get('854843596553715814') ||
					roles.get('244542234895187979') ||
					roles.get('422479365255987202') ||
					roles.get('854843824818618379') ||
					roles.get('854841465087852574')
				);
				if (!hasRoles && !member.permissions.has("MANAGE_ROLES")) {
					reply(interaction, permissionMessage);
					break;
				}

				if (type === 'create') {
					var color = args.colour
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

								var colourRole = getStat(member, "colourRole");
								if(colourRole) {
									var role = guild.roles.cache.get(colourRole);
									if (!role) { role.delete(); }
								}
								setStat(member, "colourRole", result.id);
								reply(interaction, `Added ${result} to your roles!`, "followUp", true);
							});
						break;
					}
					reply(interaction, `Please input a valid HEX code as a colour.`);
					break;
				}
				if (type === 'remove') {
					if(getStat(member, "colourRole")) {
						var role = guild.roles.cache.get(getStat(member, "colourRole"));
						if (!role) {
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
				if (!member.permissions.has("BAN_MEMBERS")) {
					reply(interaction, permissionMessage);
					break;
				}

				var targetMember = await returnCatch(guild.members.fetch(args.member), () => {
					reply(interaction, `That's not a valid member!`);
				});
				if (!targetMember) {
					break;
				}
				
				var target = targetMember.user;

				var details = await getPunishmentDetails(args.timespan);
				if (details) {
					if (!details) {
						reply(interaction, `That's not a valid timespan (where [x] is any number: [x]s, [x]m, [x]h, [x]d, [x]y)!`);
						break;
					}
					_.set(discord.guilds, `${guildId}.members.${target.id}.banned`, {
						banDate: details.now,
						banTime: details.milliseconds,
						moderator: userId
					});
				}

				var reason = args.reason || "Not kool enough to stay in Skripthut";
				
				target.send('u ban lmao')
					.then((message) => {
						console.log(message);
					})
					.catch(() => {});
				targetMember.ban({ reason: reason });
				reply(interaction,
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
				break;
			case 'mute':
				var hasRoles =
				(
					roles.get('854842705363992586')
				);
				if (!hasRoles && !member.permissions.has("MANAGE_ROLES")) {
					reply(interaction, permissionMessage);
					break;
				}

				var target = client.users.cache.get(args.member);
				var targetMember = guild.member(target);

				if (args.timespan) {
					var details = await getPunishmentDetails(args.timespan);
					if (!details) {
						reply(interaction, `That's not a valid timespan (let [x] be any number: [x]s, [x]m, [x]h, [x]d, [x]y)!`);
						break;
					}
					setStat(targetMember, "banDate", now);
					setStat(targetMember, "banTime", details.milliseconds);
				}

				var reason = args.reason || "Not kool enough to stay in Skripthut";
				
				targetMember.ban({ reason: `${reason} (${user.tag})` });
				reply(interaction,
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
				var time = args.date;

				if (subcommand === 'at') {
					if (time) {
						var examples = [
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
							
						reply(interaction, embed);
						break;
					}
					
					const date = Date.parse(time);
					if (!date) {
						reply(interaction, `That's not a valid date!`);
						break;
					}
				}

				reply(interaction, 'yolo');
				break;

			case 'test':
				deferReply(interaction);
				setTimeout(function() {
					reply(interaction, ':O', "editReply");
				}, 5000);
				break;

			default:
				reply(interaction, 'nani');
		}
	}
});

client.on('messageCreate', (message) => {
	var user = message.author;
	if (user.bot) { return; }
	var content = message.content;
	var guild = message.guild;
	var channel = message.channel;
	var member = guild.member(user);
	var lower = content.toLowerCase();
	
	if (member.permissions.has("ADMINISTRATOR")) {
		if (lower.includes('!eval')) {
			try {
				const result = eval(`(async () => { ${content.substr(6, lower.length)} })();`)
					.then((result) => {
						if (result) {
							const resultString = result.toString();
							const resultStringLength = resultString.length;
							if (resultStringLength && resultStringLength <= 5000) { channel.send(resultString); }
						}
					});
				console.log(result);
			}
			catch (error) {
				if (error instanceof SyntaxError || error instanceof ReferenceError) { console.error(error); } 
				else { throw error; }
			}
		}
	}
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
	/** @type {Discord.User} **/
	var user = newMessage.author;
	if (user.bot) { return; }
	var oldContent = oldMessage.content;
	var newContent = newMessage.content;
	if (oldContent === newContent) { return; }
	var guild = newMessage.guild;
	var channel = newMessage.channel;
	/** @type {Discord.TextChannel} **/
	var logs = guild.channels.cache.get(discord.guilds?.[guild.id].message_logs);
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

	/** @type {Discord.Guild} **/
	var guild = message.guild;
	/** @type {Discord.TextChannel} **/
	var channel = message.channel;
	/** @type {string} **/
	var content = message.content;
	/** @type {Discord.TextChannel} **/
	var logs = guild.channels.cache.get(discord.guilds?.[guild.id].message_logs);
	if (logs) {
		var description = `📎 **A message sent by ${user} was deleted in ${channel} (ID: ${message.id}).**`;
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

client.on('messageDeleteBulk', async (messages) => {
	console.log('hello', messages);
});

client.on('guildMemberAdd', async (member) => {
	const guild = member.guild;
	const user = member.user;
	client.channels.cache.get('854842141498277908')?.send(
		shuffle(discord.guilds?.[guild.id]?.joinMessages || [
			"\\:O It's ${user}, thanks for joining!",
			"Welp, here's ${user}...",
			"Well then, ${user}'s here...",
			"Whoa, whoa, whoa, when did ${user} get here?",
			"Ah shoot, here comes ${user}...",
			"And then came ${user}!"
		])[0]
			.replace('${user}', user.toString()) // Replace ${user} with the user's tag (username#discriminator)
			.replace('${user.tag}', user.tag) // Replace ${user.mention} with the user's mention
			.replace('${guild}', guild.name) // Replace ${guild} with the guild name
	); // Gets join messages, shuffles, and replaces format strings with values
});

client.on('guildMemberRemove', (member) => {
	var guild = member.guild;
	var logs = guild.channels.cache.get(discord.guilds?.[guild.id]?.message_logs);
	if (logs) { logs.send(`${member} left ${guild}!`); }
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

client.on('messageReactionAdd', async (reaction, user) => {
	if (user.bot) { return; }
	var message = reaction.message;
	var channel = message.channel;
	const guild = message.guild;
	var member = guild.member(user);

	if (getMetadata(message, 'user') === user.id) {
		message.delete();
	}

	const ticket = discord.ticketMessages?.[message.id];
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

				_.set(discord, `tickets.${channel.id}`, {
					id: channel.id,
					name: ticketName,
					member: user.id,
					message: message.id
				});

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

	const reactionRole = discord.reactionRoleMessages?.[message.id];
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

	const reactionRole = discord.reactionRoleMessages?.[message.id];
	if (reactionRole) {
		var emoji = reaction._emoji;
		var reactionRoleEmote = reactionRole.emotes[emoji.name] || reactionRole.emotes[emoji.id];
		if (reactionRoleEmote) { member.roles.remove(reactionRoleEmote.role, 'Unreacted to reaction role message'); }
	}
});

client.on('guildBanRemove', async (guild, user) => {
	_.unset(discord.guilds, `${guild.id}.members.${user.id}.banned`);
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
	_.set(discord.guilds, `${guild.id}.members.${member.id}.${key}`, value);
}

/**
 * Delete a stat of a member in a guild.
 *
 * @param {Discord.GuildMember} member The desired member of the stat.
 * @param {String} key The key of the desired stat to delete.
**/
function deleteStat(member, key) {
	const guild = member.guild;
	_.unset(discord.guilds, `${guild.id}.members.${member.id}.${key}`);
}

/**
 * Get a stat of a member in a guild.
 *
 * @param {Discord.GuildMember} member The desired member of the stat.
 * @param {string} key The key of the desired stat.
 * @returns The value of the stat specified.
**/
function getStat(member, key) {
	const guild = member.guild;
	return _.get(discord.guilds, `${guild.id}.members.${member.id}.${key}`);
}

/**
 * Converts bits to bit field
 * 
 * @param {number[]} bits The bits of the bit field.
 * @returns {number} The bit field of the bits.
 * 
 * @example
 * var ephemeralAndLoading = convertBitsToBitField(6, 7); // 192
**/
function convertBitsToBitField(...bits) {
	var bitField = 0;
	for (let bit of bits) { bitField += 1 << bit; }
	return bitField;
}

/**
 * Converts bit field to bits
 * 
 * @param {number} bitField The bit field.
 * @returns {number[]} The bits of the bit field.
 * 
 * @example
 * var ephemeralAndLoading = convertBitFieldToBits(192); // [ 6, 7 ]
**/
function convertBitFieldToBits(bitField) {
	const bits = [];
	for (let bit = 0; bit < 8; bit++) {
		if (bitField & (1 << bit)) { bits = [ ...bits, bit ]; }
	}
	return bits;
}

console.log('instanceof', 'string'._object instanceof String);

/**
 * Responds to a command interaction.
 * 
 * @param {Discord.CommandInteraction} interaction The interaction to respond to
 * @param {(string | Discord.MessageEmbed | Discord.MessageAttachment)[]} contentList The content array of the response
 * @param {("reply" | "editReply" | "followUp")} type The response type. `"reply"` replies normally, `"editReply"` edits the initial reply, and `"followUp"` sends a follow up message to the initial reply.
 * @param isEphemeral Whether or not the response is ephemeral
 * @param {Discord.InteractionReplyOptions} options The message data
 * @returns The response message
 * 
 * @example
 * reply(interaction, "Wait 10 seconds!");
 * await sleep(5000);
 * reply(interaction, "Wait 5 more seconds...", "editReply");
 * await sleep(5000);
 * reply(interaction, "You waited 10 seconds!", "followUp");
**/
function reply(interaction, contentList, type = "reply", isEphemeral = true, options = {}) {
	if (!["reply", "editReply", "followUp"].includes(type)) { throw new Error("The supplied type parameter is not `reply`, `editReply`, or `followUp`."); }

	if (!contentList instanceof Array) { contentList = [ contentList ]; }
	const contentTypeMap = Object.entries({
		content: String,
		embed: Discord.MessageEmbed,
		files: Discord.MessageAttachment
	});
	/**
	 * Gets the content type (valid `options` property name) of content.
	 * 
	 * @param {(string | Discord.MessageEmbed | Discord.MessageAttachment)} content 
	 * @returns Returns the content type, `null` if not valid.
	 */
	function getContentType(content) {
		const _object = content._object;
		for (const [ contentType, instance ] of contentTypeMap) { if (_object instanceof instance) { return contentType; } }
		return null;
	}

	for (const content of contentList) { options[getContentType(content)] = content; }
	options.ephemeral = isEphemeral;
	console.log('options', options);
	return interaction[type](options);
}

/**
 * Deletes the initial reply of a command interaction.
 * 
 * @param {Discord.CommandInteraction} interaction The interaction of which reply to delete
 * @returns The deletion result
 */
function deleteReply(interaction) {
	return interaction.deleteReply();
}

/**
 * Defers a reply of a command interaction, allowing a response in a time window of 15 minutes.
 * 
 * @param {Discord.CommandInteraction} interaction The interaction to defer the respond of
 * @param isEphemeral Whether or not the deference is ephemeral
 * @returns The deference result
**/
function deferReply(interaction, isEphemeral = true) {
	return interaction.deferReply({ ephemeral: isEphemeral });
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

	writeJSON('./database/discord.json', discord);
}

/*console.log('proceeding to log in', process.env.TOKEN);
client.on('rateLimit', (...args) => console.log('rateLimit', ...args));
client.on('debug', console.debug);*/
client.login(process.env.TOKEN);
console.log('started log in procedure');