





var fs = require('fs-extra');
var archiver = require('archiver');

var output = fs.createWriteStream('./target.zip');
var archive = archiver('zip');

output.on('close', function () {
    console.log(archive.pointer() + ' total bytes');
    console.log('archiver has been finalized and the output file descriptor has closed.');
});

archive.on('error', function(err){
    throw err;
});

archive.pipe(output);

// append files from a sub-directory, putting its contents at the root of archive
archive.directory(`${process.cwd()}/commands`, false);

archive.finalize();