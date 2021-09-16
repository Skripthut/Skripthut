/** @module Discord **/
const Discord = require(`discord.js`);
const htmlEntities = require(`html-entities`);
const returnCatch = require(`../methods/returnCatch.js`);

const SkriptDocs = require(`../constants/SkriptDocs.js`);

/**
 * Class for easy access to examples and embed using skUnity syntax
**/
module.exports = class SkriptSyntax {
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
	static async getAddonInfo(addon, api = 'skripttools') {
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
	static async getAddon(name, api = 'skripttools') {
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
	static async searchForSyntax(query, api = 'skunity') {
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
}