'use strict';

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
 * @param {number} decimals The decimal precision of the formatted string (2 = 0.01, 3 = 0.001)
**/
function formatBytes(bytes, decimals = 2) {
    if (bytes <= 0) { return '0 Bytes'; }

    const k = 1024;
    const dm = Math.max(0, decimals);
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Sleeps for a certain amount of time (specified in milliseconds)
 * 
 * @param ms The amount of milliseconds to wait before continuing
**/
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Returns a shuffled copy of this array using Fisher-Yates Shuffle. Please advise from using this with massive arrays, since this can produce lag.
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

console.log([ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 ].shuffle());

/**
 * Catches this Promise and runs a callback, and returns this Promise if there are no errors.
 * 
 * @param {Promise} promise The promise to catch
 * @param {Function} catchCallback The callback to run on catch.
 * @returns This Promise
**/
async function catchAwait(promise, catchCallback) {
	var caught;
	await promise.catch(() => { catchCallback(); caught = true; });
	if (caught) { return; }
	return promise;
}

require(`dotenv`).config({ path: './secrets/client.env/' });
const htmlEntities = require(`html-entities`);
const axios = require(`axios`);
/**
 * @module Discord
**/
const Discord = require(`discord.js`);
const fs = require(`fs-extra`);
const _ = require(`lodash`);

const client = new Discord.Client(/*{ ws: { intents: Discord.Intents.PRIVILEGED } }*/);
const discord = loadJSON('./database/discord.json');

var metadata = {};
/**
 * Sets metadata tag of an object
 * 
 * @param object The object whose metadata to set (works as long as an id property is set)
 * @param {string} tag The metadata tag to set (works recursively)
 * @param value The value to set to
 * @param {number} lifespan The optional lifespan of the metadata (deletes after specified lifespan)
 * @returns Returns the new metadata object
**/
function setMetadata(object, tag, value, lifespan) {
	if (!object.id) { return; }
	tag = `${object.constructor.name}.${object.id}.${tag}`;
	if (lifespan) {
		var now = Date.now();
		metadata[tag] = now;
		setTimeout(function() {
			if (metadata[tag] === now) { _.unset(metadata, tag); delete metadata[tag]; }
		}, lifespan);
	}
	return _.set(metadata, tag, value);
}

/**
 * Gets metadata tag of an object
 * 
 * @param object The object whose metadata to get (works as long as an id property is set)
 * @param {string} tag The metadata tag to get (works recursively)
 * @returns Returns the metadata tag of the object
**/
function getMetadata(object, tag) {
	if (!object.id) { return; }
	tag = `${object.constructor.name}.${object.id}.${tag}`;
	delete metadata[tag];
	return _.get(metadata, tag);
}

/**
 * Deletes metadata tag of an object
 * 
 * @param object The object whose metadata to delete (works as long as an id property is set)
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
 * @param object The object whose persistent value to set (works as long as an id property is set)
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
 * @param object The object whose persistent value to get (works as long as an id property is set)
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
 * @param object The object whose persistent value to delete (works as long as an id property is set)
 * @param {string} tag The persistent value to delete (works recursively)
 * @returns Returns true if the persistent value is deleted, else false
**/
function deletePersistent(object, tag) {
	if (!object.id) { return; }
	return _.unset(discord, `persistentValues.${object.constructor.name}.${object.id}.${tag}`);
}

/**
 * Color base for simple colours
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
	var now = Date.now();
	if (!millisTimespan) { return {}; }
	var timespan = await getMillisFromString(millisTimespan);
	if (timespan === Infinity || timespan === NaN) { return null; }

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

/**
 * Gets addon info from a specified JAR file
 * 
 * @param {string} addon The JAR file of the addon
 * @returns 
 * {{
 * author: [],
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
async function getAddonInfo(addon) {
	const response = await catchAwait(axios.get(`https://api.skripttools.net/v4/addons/${addon}/`), (error) => {
		console.error(error);
		reply(interaction, `Error: Unable to get addon info (<https://api.skripttools.net/v4/addons/${addon}/>)`);
	});
	if (!response) { return; }
	return response.data.data;
}

/**
 * Get addon info from a partial name
 * 
 * @param {string} name The partial name to search for
 * @returns 
**/
async function getAddon(name) {
	var response = await catchAwait(axios.get(`https://api.skripttools.net/v4/addons`), (error) => {
		console.error(error);
		reply(interaction, `Error: Unable to get addon list (https://api.skripttools.net/v4/addons/)`);
	});
	if (!response) { return; }

	var data = response.data.data;
	for (const addon in data) {
		if (addon.toLowerCase().includes(name)) { return { name: addon, files: data[addon]}; }
	}
	return;
}

/**
 * Get syntax using a key word, plus an optional type and plugin
 * 
 * @param {string} keyword The key word to search
 * @param {string} [type] The doc type to search (event, expression, effect, condition, or type)
 * @param {string} [plugin] The plugin to search (i.e. Skript, SkBee, TuSKe)
 * @returns {Promise<any[]>} All syntaxes that match `keyword` (ID or partial name)
**/
async function getSyntaxList(keyword, type, plugin) {
	if (!type && !plugin) {
		var response = await catchAwait(axios.get(`https://docs.skunity.com/api/?key=${skUnityKey}&function=getAllSyntax`), (error) => {
			console.error(error);
			reply(interaction, `Error: Unable to get all syntax (https://docs.skunity.com/api/?key=${skUnityKey}&function=getAllSyntax/)`);
		});
		if (!response) { return; }

		return response.data.result.filter(syntax => syntax.id === keyword || syntax.name.toLowerCase().includes(keyword));
	}

	var syntaxList = [];
	var total = 0;
	if (type) {
		total++;
		console.log('type', type, total);
		var response = await catchAwait(axios.get(`https://docs.skunity.com/api/?key=${skUnityKey}&function=getDocTypeSyntax&doctype=${type}`), (error) => {
			console.error(error);
			reply(interaction, `Error: Unable to get doc type syntax (https://docs.skunity.com/api/?key=${skUnityKey}&function=getDocTypeSyntax&doctype=${type}/)`);
		});
		if (!response) { return syntaxList; }

		syntaxList = response.data.result.filter(syntax => syntax.id === keyword || syntax.name.toLowerCase().includes(keyword));
	}
	if (plugin) {
		total++;
		console.log('plugin', plugin, total);
		var addon = plugin !== 'skript' ? (await getAddon(plugin)).name : plugin;
		console.log('addon', addon, total);
		var response = await catchAwait(axios.get(`https://docs.skunity.com/api/?key=${skUnityKey}&function=getAddonSyntax&addon=${addon}`), (error) => {
			console.error(error);
			reply(interaction, `Error: Unable to get doc type syntax (https://docs.skunity.com/api/?key=${skUnityKey}&function=getAddonSyntax&addon=${addon}/)`);
		});
		if (!response) { return syntaxList; }

		syntaxList.push(...response.data.result.filter(syntax => syntax.id === keyword || syntax.name.toLowerCase().includes(keyword)));
	}

	if (total > 1) {
		var amount = {};
		return syntaxList.filter(syntax => {
			if (!amount[syntax.id]) { amount[syntax.id] = 0; }
			amount[syntax.id]++;
			return (amount[syntax.id] === total);
		});
	}
	return syntaxList;
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
 * Class for easy access to examples and embed
**/
class SkriptSyntax {
	/**
	 * Get access to SkriptSyntax methods using a syntax object
	 * 
	 * @param
	 * {{
	 * id: string,
	 * name: string,
	 * doc: ('events' | 'expressions' | 'effects' | 'conditions' | 'types'),
	 * desc: string,
	 * addon: string,
	 * version: string,
	 * pattern: string,
	 * plugin: string,
	 * eventvalues: string,
	 * changers: string,
	 * returntype: string,
	 * is_array: ('0' | '1'),
	 * tags: string,
	 * reviewed: ('true' | 'false'),
	 * versions: string
	 * }} syntax The syntax object to convert to a SkriptSyntax object
	 * @returns The new SkriptSyntax object
	**/
	constructor(syntax) {
		for (var key in syntax) {
			this[key] = syntax[key];
		}
	}

	/**
	 * Get the example of this SkriptSyntax
	 * 
	 * @returns The example of this SkriptSyntax
	**/
	async getExample() {
		var response = await catchAwait(axios.get(`https://docs.skunity.com/api/?key=${skUnityKey}&function=getExamplesByID&syntax=${this.id}`), console.error);
		if (!response) { return; }
		if (!response.data.result[0]) { return; }

		return htmlEntities.decode(response.data.result[0].example);
	}

	/**
	 * Get a formatted embed using this SkriptSyntax properties
	 * 
	 * @param {string} [example] The example of this syntax (use this.getExample() method)
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

var skUnityKey;
var noResults;
client.on('ready', async () => {
	console.log(`Logged in as ${client.user.tag}!`);

	permissionMessage = `You don't have permission to do this!`;
	guildId = "854838419677904906";
	guild = client.guilds.cache.get(guildId);
	skripter = "860242610613911553";
	skripthut = "https://i.imgur.com/jumFMJ5.png";
	tickets = "854954327268786227";

	skUnityKey = "58b93076b6269edd";
	noResults = "https://i.imgur.com/AjlWaz5.png";

	await registerCommands(guildId);

	client.ws.on('INTERACTION_CREATE', async (interaction) => { // WebSocket Interaction Create Event (for slash commands)
		/** @type {{name: string, options: any}} */
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

		var logs = guild.channels.cache.get(_.get(discord.guilds, `${guild.id}.message_logs`));
		if (logs) { logs.send(`${user.tag} (${user.id}) executed /${command}`); }

		switch(command) {
			/*
			 * Skript Commands
			 */

			// ADDON COMMAND
			case 'addon':
				if (!args.name) {
					reply(interaction, `Hi`, convertBitsToBitField(6));
					break;
				}
			
				reply(interaction, `Sending...`, convertBitsToBitField(7));

				var addon = await getAddon(args.name.toLowerCase());
				if (!addon) {
					reply(interaction, 
						new Discord.MessageEmbed()
							.setColor(Color.RED)
							.setTitle('No Addon Found')
							.setDescription('No addons were found with that search')
							.setThumbnail(noResults)
							.setFooter(`Error | ${interaction.id}`)
						, 0, "EDIT_INITIAL");
					return;
				}

				var files = addon.files;
				var file = files[files.length - 1];

				var addonInfo = await getAddonInfo(file);
				if (!addonInfo) { return; }

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
					.setFooter(`Powered by SkriptTools`);

				if (addonInfo.description) { embed.description = addonInfo.description; }

				reply(interaction, embed, 0, "EDIT_INITIAL");
				return;
				// END ADDON COMMAND

			// DOCS COMMAND
			case 'docs':
				reply(interaction, "Getting syntax...", convertBitsToBitField(7));
				var keyword = args.keyword.toLowerCase();
				if (args.type) { var type = args.type.toLowerCase(); };
				if (args.from) { var plugin = args.from.toLowerCase(); }

				var syntaxList = await getSyntaxList(keyword, type, plugin);
				if (!syntaxList.length) { 
					reply(interaction, 
						new Discord.MessageEmbed()
							.setColor(Color.RED)
							.setTitle('No Results')
							.setDescription('No results were found for that query')
							.setThumbnail(noResults)
							.setFooter(`Error | ${interaction.id}`),
					0, "EDIT_INITIAL");
					return;
				}

				var syntax = new SkriptSyntax(syntaxList[0]);
				var embed = syntax.getEmbed(await syntax.getExample())
					.setFooter(`Powered by skUnity Docs 2 | ${interaction.id}`);
				reply(interaction, embed, 0, "EDIT_INITIAL");
				break;
				// END DOCS COMMAND

			/*
			 * Reaction Commands
			 */

			// CREATETICKET COMMAND
			case 'createticket':
				if (!member.hasPermission("MANAGE_MESSAGES")) {
					reply(interaction, permissionMessage, convertBitsToBitField(6));
					break;
				}
				await reply(interaction, 'Sending ticket messsage...', convertBitsToBitField(6, 7));
				var ticketChannel = guild.channels.cache.get(args.channel);
				var message = args.message.replace(/%(n(?:ew)?l(?:ine)?|line ?break)%/g, "\n");
				/** @type {Discord.Message} **/
				var sentMessage = await ticketChannel.send(message)
				discord.ticketMessages[sentMessage.id] = {
					id: sentMessage.id,
					description: args.description,
					channel: args.channel
				};
				await sentMessage.react(`📰`);
				reply(interaction, 'Sent!', convertBitsToBitField(6), "EDIT_INITIAL");
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

					reply(interaction, '__Do `/close` again to permanently close the ticket.__', convertBitsToBitField(7), "FOLLOW_UP");
					break;
				}
				reply(interaction, 'You can only use this in a ticket channel!', convertBitsToBitField(6));
				break;
				// END CLOSE COMMAND

			/*
			 * Role Commands
			*/

			// ROLE COMMAND
			case 'role':
				if (!member.hasPermission("MANAGE_ROLES")) {
					reply(interaction, permissionMessage, convertBitsToBitField(6));
					break;
				}
				var option = options[0];
				var type = option.name;

				if (type === 'grant') {
					var highestRole = member.roles.highest;
					var role = guild.roles.cache.get(option.options[1].value);
					if (highestRole.position <= role.position) {
						reply(interaction, `You don't have enough permission to grant ${role}!`, convertBitsToBitField(6));
						break;
					}
					var target = guild.member(option.options[0].value);
					var reason = (option.options[2] || { value: `Granted by ${user.tag}`}).value;

					reply(interaction, `Adding...`, convertBitsToBitField(6));
					await target.roles.add(role, reason);
					reply(interaction, `Added ${role} to ${target}'s roles!`, convertBitsToBitField(6, 7), "FOLLOW_UP");
					break;
				}
				if (type === 'revoke') {
					var highestRole = member.roles.highest;
					var role = guild.roles.cache.get(option.options[1].value);
					if (highestRole.position <= role.position) {
						reply(interaction, `You don't have enough permission to revoke ${role}!`, convertBitsToBitField(6));
						break;
					}
					var target = guild.member(option.options[0].value);
					var reason = (option.options[2] || { value: `Removed by ${user.tag}`}).value;

					reply(interaction, `Removed ${role} from ${target}'s roles...`, convertBitsToBitField(6));
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
						reply(interaction, embed, convertBitsToBitField(6));
						break;
					}
					var roles = Array.from(guild.roles.cache);
					var roleInfo = [];
					for (var i = 0; i < roles.length; i++) {
						var role = roles[i][1];
						roleInfo[i] = role;
					}
					reply(interaction, `${roleInfo}`, convertBitsToBitField(6));
					break;
				}
				reply(interaction, `noob`, convertBitsToBitField(6));
				break;
			// END ROLE COMMAND

			// REACTIONROLE COMMAND
			case 'reactionrole':
				if (!member.hasPermission("MANAGE_ROLES")) {
					reply(interaction, permissionMessage, convertBitsToBitField(6));
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
						reply(interaction, `That's not a valid emote!`, convertBitsToBitField(6));
						break;
					}

					var reactionRoleChannel = guild.channels.cache.get(option.options[0].value);
					var reactionRoleMessage = option.options[1].value.replace(/%(n(?:ew)?l(?:ine)?|line ?break)%/g, "\n");
					var reactionRole = option.options[3].value;

					var sentMessage = reactionRoleChannel.send(reactionRoleMessage);
					await reply(interaction, 'Sending...', convertBitsToBitField(6));

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
						reply(interaction, `That's not a valid message URL (guild ID invalid)!`, convertBitsToBitField(6));
						break;
					}
					var reactionRoleChannel = guild.channels.cache.get(ids[2]);
					if (!reactionRoleChannel) {
						reply(interaction, `That's not a valid message URL (channel ID invalid)!`, convertBitsToBitField(6));
						break;
					}
					var reactionRoleMessageId = ids[3];
					var reactionRoleMessage = await reactionRoleChannel.messages.fetch(reactionRoleMessageId);
					if (!reactionRoleMessage) {
						reply(interaction, `That's not a valid message URL (message ID invalid)!`, convertBitsToBitField(6));
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
						reply(interaction, `That's not a valid emote!`, convertBitsToBitField(6));
						break;
					}

					var reactionRole = option.options[2].value;

					const _reactionRoleMessage = _.get(discord, `reactionRoleMessages.${reactionRoleMessageId}`);
					if (_reactionRoleMessage) {
						const emotes = _reactionRoleMessage.emotes;
						if (emotes[reactionRoleEmoteId]) {
							reply(interaction, `This reaction role message already has this emote set!`, convertBitsToBitField(6));
							break;
						}
						if (JSON.stringify(emotes).includes(reactionRole)) {
							reply(interaction, `This reaction role message already has this role set!`, convertBitsToBitField(6));
							break;
						}
					}

					await reply(interaction, 'Adding...', convertBitsToBitField(6));
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
					var ids = Array.from(option.options[0].value.matchAll(/https:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/))[0]; // Get ID's from URL

					if (ids[1] !== guild_id) {
						reply(interaction, `That's not a valid message URL (guild ID invalid)!`, convertBitsToBitField(6));
						break;
					}
					var reactionRoleChannel = guild.channels.cache.get(ids[2]);
					if (!reactionRoleChannel) {
						reply(interaction, `That's not a valid message URL (channel ID invalid)!`, convertBitsToBitField(6));
						break;
					}
					var reactionRoleMessageId = ids[3];
					var reactionRoleMessage = await reactionRoleChannel.messages.fetch(reactionRoleMessageId);
					if (!reactionRoleMessage) {
						reply(interaction, `That's not a valid message URL (message ID invalid)!`, convertBitsToBitField(6));
						break;
					}

					var _reactionRoleMessage = _.get(discord, `reactionRoleMessages.${reactionRoleMessageId}`);

					if (!_reactionRoleMessage) {
						reply(interaction, `This message doesn't have any reaction roles!`, convertBitsToBitField(6));
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
						reply(interaction, `This message doesn't have that role!`, convertBitsToBitField(6));
						break;
					}

					var reactionRole = guild.roles.cache.get(reactionRoleId);

					reply(interaction, `Removing ${reactionRole} from the specified message...`, convertBitsToBitField(6));
					reactionRoleMessage.reactions.resolve(reactionRoleEmote).remove();
					break;
				}
				reply(interaction, 'bruh moment', convertBitsToBitField(6));
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
					reply(interaction, permissionMessage, convertBitsToBitField(6));
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
								reply(interaction, embed, convertBitsToBitField(6));
								await member.roles.add(result.id);

								var colourRole = getStat(member, "colourRole");
								if(colourRole) {
									var role = guild.roles.cache.get(colourRole);
									if (role !== null && role !== undefined) {
										role.delete();
									}
								}
								setStat(member, "colourRole", result.id);
								reply(interaction, `Added ${result} to your roles!`, convertBitsToBitField(6, 7), "FOLLOW_UP");
							});
						break;
					}
					reply(interaction, `Please input a valid HEX code as a colour.`, convertBitsToBitField(6));
					break;
				}
				if (type === 'remove') {
					if(getStat(member, "colourRole")) {
						var role = guild.roles.cache.get(getStat(member, "colourRole"));
						if (role !== null && role !== undefined) {
							await role.delete();
							deleteStat(member, "colourRole");
							reply(interaction, 'Deleted your colour role...', convertBitsToBitField(6));
							break;
						}
						reply(interaction, `You have a colour role... but it's invalid`, convertBitsToBitField(6));
						break;
					}
					reply(interaction, `You currently don't have a colour role...`, convertBitsToBitField(6));
				}
				break;
			// END COLOURROLE COMMAND

			/*
			 * Moderator Commands 
			 */
			case 'ban':
				if (!member.hasPermission("BAN_MEMBERS")) {
					reply(interaction, permissionMessage, convertBitsToBitField(6));
					break;
				}

				var targetMember = await catchAwait(guild.members.fetch(args.member), () => {
					reply(interaction, `That's not a valid member!`, convertBitsToBitField(6));
				});
				if (!targetMember) {
					break;
				}
				
				var target = targetMember.user;

				var details = await getPunishmentDetails(args.timespan);
				if (details) {
					if (!details) {
						reply(interaction, `That's not a valid timespan (where [x] is any number: [x]s, [x]m, [x]h, [x]d, [x]y)!`, convertBitsToBitField(6));
						break;
					}
					_.set(discord.guilds, `${guild_id}.members.${target.id}.banned`, {
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
				, convertBitsToBitField(6))
				break;
			case 'mute':
				var hasRoles =
				(
					roles.get('854842705363992586')
				);
				if (!hasRoles && !member.hasPermission("MANAGE_ROLES")) {
					reply(interaction, permissionMessage, convertBitsToBitField(6));
					break;
				}

				var target = client.users.cache.get(args.member);
				var targetMember = guild.member(target);

				if (args.timespan) {
					var details = await getPunishmentDetails(args.timespan);
					if (!details) {
						reply(interaction, `That's not a valid timespan (let [x] be any number: [x]s, [x]m, [x]h, [x]d, [x]y)!`, convertBitsToBitField(6));
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
				, convertBitsToBitField(6))
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
							
						reply(interaction, embed, convertBitsToBitField(6));
						break;
					}
					if (!date) {
						reply(interaction, `That's not a valid date!`, convertBitsToBitField(6));
						break;
					}
				}

				reply(interaction, 'yolo', convertBitsToBitField(6));
				break;

			case 'test':
				reply(interaction, 'hello', convertBitsToBitField(4, 7));
				setTimeout(function() {
					reply(interaction, ':O', convertBitsToBitField(4), "EDIT_INITIAL");
				}, 10000);
				break;

			default:
				reply(interaction, 'nani', convertBitsToBitField(6));
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
	var oldContent = oldMessage.content;
	var newContent = newMessage.content;
	if (oldContent === newContent) { return; }
	var guild = newMessage.guild;
	var channel = newMessage.channel;
	/** @type {Discord.TextChannel} **/
	var logs = guild.channels.cache.get(_.get(discord.guilds, `${guild.id}.message_logs`));
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
	var logs = guild.channels.cache.get(_.get(discord.guilds, `${guild.id}.message_logs`));
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
	client.channels.cache.get('854842141498277908').send(
		(_.get(discord, `guilds.${guild.id}.joinMessages`) || [
			"\\:O It's ${user}, thanks for joining!",
			"Welp, here's ${user}...",
			"Well then, ${user}'s here...",
			"Whoa, whoa, whoa, when did ${user} get here?",
			"Ah shoot, here comes ${user}...",
			"And then came ${user}!"
    	])
			.shuffle(1)[0]
			.replace('${user}', user.toString()) // Replace ${user} with the user's tag (username#discriminator)
			.replace('${user.tag}', user.tag) // Replace ${user.mention} with the user's mention
			.replace('${guild}', guild.name) // Replace ${guild} with the guild name
	); // Gets join messages, shuffles, and replaces format strings with values
});

client.on('guildMemberRemove', (member) => {
	var guild = member.guild;
	var logs = guild.channels.cache.get(_.get(discord.guilds, `${guild.id}.message_logs`));
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

	if (getMetadata(message, 'user') === user.id) {
		message.delete();
	}

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

	const reactionRole = _.get(discord, `reactionRoleMessages.${message.id}`);
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

	const reactionRole = _.get(discord, `reactionRoleMessages.${message.id}`);;
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
 * @param {String} key The key of the desired stat.
 * @returns The value of the stat specified.
**/
function getStat(member, key) {
	const guild = member.guild;
	return _.get(discord.guilds, `${guild.id}.members.${member.id}.${key}`);
}

/**
 * Converts bits to bit field
 * 
 * @param {number[]} bits The bits of the bit field
 * @returns {number} The bit field of the bits
 * 
 * @example
 * var ephemeralAndLoading = convertBitsToBitField(6, 7);
**/
function convertBitsToBitField(...bits) {
	var bitField = 0;
	for (var bit of bits) {
		bitField += Math.pow(2, bit);
	}
	return bitField;
}

/**
 * Converts bit field to bits
 * 
 * @param {number} bitField The bit field
 * @returns {number[]} The bits of the bit field
 * 
 * @example
 * var ephemeralAndLoading = convertBitFieldToBits(192); // [ 6, 7 ]
**/
function convertBitFieldToBits(bitField) {
	const bits = [];
	for (var bit = 0; bit < 8; bit++) {
		if (bitField & Math.pow(2, bit)) { bits.push(bit); }
	}
	return bits;
}

/**
 * Reply to a Discord interaction.
 *
 * @param {Discord.Interaction} interaction The interaction you want to reply to.
 * @param {(string | Discord.MessageEmbed)} response The message you want to respond with.
 * @param flags The flags of the message (https://discord.com/developers/docs/resources/channel#message-object-message-flags)
 * 
 * CROSSPOSTED	1 << 0	this message has been published to subscribed channels (via Channel Following)
 * 
 * IS_CROSSPOST	1 << 1	this message originated from a message in another channel (via Channel Following)
 * 
 * SUPPRESS_EMBEDS	1 << 2	do not include any embeds when serializing this message
 * 
 * SOURCE_MESSAGE_DELETED	1 << 3	the source message for this crosspost has been deleted (via Channel Following)
 * 
 * URGENT	1 << 4	this message came from the urgent message system
 * 
 * HAS_THREAD	1 << 5	this message has an associated thread, with the same id as the message
 * 
 * EPHEMERAL	1 << 6	this message is only visible to the user who invoked the Interaction
 * 
 * LOADING	1 << 7	this message is an Interaction Response and the bot is "thinking"
 * 
 * @param {("EDIT_INITIAL" | "DELETE_INTIAL" | "FOLLOW_UP" | "EDIT_SENT" | "SEND")} type The type of Interaction Response.
 * @param deletable Whether or not the reply should be deletable by the user
**/
async function reply(interaction, response, flags = 0, type = "SEND", deletable = true) {	
	if (!["EDIT_INITIAL", "DELETE_INTIAL", "FOLLOW_UP", "EDIT_SENT", "SEND"].includes(type)) { throw new Error(`${type} is not a valid response type`); }

	var data = (typeof response === 'object') ? await createAPIMessage(interaction, response) : { content: response }
	data.flags = flags;
	const followUpData = { data: data };

	const flagsField = convertBitFieldToBits(flags);

	switch(type) { // "EDIT_INITIAL", "DELETE_INTIAL", "FOLLOW_UP", "EDIT_SENT", "SEND"
		case "EDIT_INITIAL":
			var responseMessage = await client.api.webhooks(client.user.id, interaction.token).messages("@original").patch(followUpData);
			break;

		case "DELETE_INTIAL":
			var responseMessage = await client.api.webhooks(client.user.id, interaction.token).messages("@original").delete();
			break;

		case "FOLLOW_UP":
			var responseMessage = await client.api.webhooks(client.user.id, interaction.token).post(followUpData);
			break;

		case "EDIT_SENT":
			var responseMessage = await client.api.webhooks(client.user.id, interaction.token).messages(interaction.id).patch(followUpData);
			break;

		case "SEND":
			if (flagsField.includes(7)) {
				data = { flags: flags };
				deletable = false;
				var responseType = 5;
			}
			else {
				var responseType = 4;
			}
			var responseMessage = await client.api.interactions(interaction.id, interaction.token).callback.post(
			{
				data: {
					type: responseType || 4,
					data
				}
			});
			break;

		default:
			throw new Error(`${type} is not a valid Interaction Response type`);
	}
	if (flagsField.includes(6)) { deletable = false; }
	if (deletable) {
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

		/**
		 * The ID of the response message sent for the
		**/
		const message_id = responseMessage.id;
		/**
		 * The response message sent for the interaction
		 * @type {Discord.Message}
		**/
		const message = await channel.messages.fetch(message_id);

		await message.react('❌');
		setMetadata(message, 'user', user.id, 60000);
	}
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
			var banned = _.get(guildData, `members.${userId}.banned`);
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

	/**
	 * Clears all empties in `discord` and `metadata` objects asynchronously.
	**/
	async function clearAllEmpties() {
		clearEmpties(discord);
		clearEmpties(metadata);
	}
	clearAllEmpties();

	writeJSON('./database/discord.json', discord);
}

client.login(process.env.TOKEN);