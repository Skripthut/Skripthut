const __dir = process.cwd();
const fs = require('fs-extra');

fs.copy(`${__dir}/node_modules/`, `${__dir}/test/modules`);