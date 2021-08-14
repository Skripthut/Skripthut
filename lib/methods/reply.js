/** @module Discord **/
const Discord = require(`discord.js`);

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
module.exports.reply = function reply(interaction, contentList, type = "reply", isEphemeral = true, options = {}) {
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
module.exports.deleteReply = function deleteReply(interaction) {
	return interaction.deleteReply();
}

/**
 * Defers a reply of a command interaction, allowing a response in a time window of 15 minutes.
 * 
 * @param {Discord.CommandInteraction} interaction The interaction to defer the respond of
 * @param isEphemeral Whether or not the deference is ephemeral
 * @returns The deference result
**/
module.exports.deferReply = function deferReply(interaction, isEphemeral = true) {
	return interaction.deferReply({ ephemeral: isEphemeral });
}