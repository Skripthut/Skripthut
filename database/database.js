const fs = require(`fs-extra`);

const database = fs.readJSONSync(`${__dirname}/main.json`);
/**
 * The main database object reference for this project
**/
module.exports = database;