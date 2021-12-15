const fs = require(`fs-extra`);
const Path = require(`path`);

var string = `module.exports = {`;

fs.readdirSync(`./lib/events`, { withFileTypes: true }).forEach((file) => {
	const name = file.name;
	string += `\n\t${name.substring(0, (name.length - 3))}: require(\`./events/${name}\`),`
});

console.log(`${string}\n}`);