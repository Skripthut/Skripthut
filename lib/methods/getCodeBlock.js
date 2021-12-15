/**
 * Cover a text with a Discord-markdown code block.
 * 
 * @param {string} string The text to put in the code block
 * @param format The markdown code format for the code block (defaults to 'vb')
 * @returns The code block with `string` inside it
**/
module.exports = (string, format = 'vb') => `\`\`\`${format}\n${string}\`\`\``;