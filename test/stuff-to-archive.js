/**
 * Recursively format options of an interaction.
 * 
 * @param {Discord.CommandInteractionOption[]} options The options to format.
 * @param {{}} object The object reference to mutate the formatted options into.
 * @returns A fully formatted options object using recursion.
 * @mutates
**/
function recursivelyFormatOptions(options, object) {
	for (const option of options) {
		const { name, type } = option;

		/** The proper property name for the option type */
		const value = ((type === "MENTIONABLE") ? (option.member ?? option.role) : option[{
			USER: 'member',
			CHANNEL: 'channel',
			ROLE: 'role'
		}[type] ?? 'value']);

		object[name] = value;
		console.log('debug', option[name], object[name]);
		console.log('values', name, value);
		if (name === "options") { recursivelyFormatOptions(option, object[name]); }
	}
}