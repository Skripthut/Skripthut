/** @module Discord */
const Discord = require(`discord.js`);

let intentsField = 0;
const intentLength = Object.keys(Discord.Intents.FLAGS).length;
for (let i = 0; i <= intentLength; i++) { intentsField += 1 << i; } // Get bitfield for all intents

/** The Skripthut bot client */
module.exports = new Discord.Client({ intents: new Discord.Intents(intentsField)});