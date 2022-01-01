/** @module Discord */
const Discord = require(`discord.js`);
const client = require(`../constants/Client.js`);

/**
 * Class for more readable reply syntax
**/
module.exports = class Reply {
	/**
	* Creates a Reply instance to efficiently reply to a command interaction.
	* 
	* @param {Discord.CommandInteraction} interaction The interaction to reply to
	*/
	constructor(interaction) {
		/** @type {Discord.CommandInteraction} The interaction of the Reply */
		this.interaction = interaction;
	}

	/**
	 * Responds to a command interaction.
	 * 
	 * @param {(string | Discord.MessageEmbed | Discord.MessageAttachment)[]} contentList The content array of the response
	 * @param {("reply" | "editReply" | "followUp")} type The response type. `"reply"` replies normally, `"editReply"` edits the initial reply, and `"followUp"` sends a follow up message to the initial reply.
	 * @param isEphemeral Whether or not the response is ephemeral
	 * @param {Discord.InteractionReplyOptions} options The message data
	 * @returns The response message
	 * 
	 * @example
	 * reply("Wait 10 seconds!");
	 * setTimeout(function() {
	 *  	reply("Wait 5 more seconds...", "editReply");
	 *  	setTimeout(function() {
	 *  		reply("You waited 10 seconds!", "followUp");
	 *  	}, 5000);
	 * }, 5000);
	*/
	reply(contentList, type = "reply", isEphemeral = true, options = {}) {
		const interaction = this.interaction;

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
	 * @returns The deletion result
	 */
	deleteReply() {
		return this.interaction.deleteReply();
	}

	/**
	 * Defers a reply of a command interaction, allowing a response in a time window of 15 minutes.
	 * 
	 * @param isEphemeral Whether or not the deference is ephemeral
	 * @returns The deference result
	*/
	deferReply(isEphemeral = true) {
		return this.interaction.deferReply({ ephemeral: isEphemeral });
	}
}