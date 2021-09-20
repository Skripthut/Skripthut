const fs = require(`fs-extra`);

/**
 * The main database object reference for this project
**/
module.exports = fs.readJSONSync('./main.json');