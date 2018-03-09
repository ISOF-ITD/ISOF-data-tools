var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var levenshtein = require('fast-levenshtein');

if (process.argv.length < 5) {
	console.log('node jsonCollectFiles.js --input=[input json file] --file_location=[path containing the files] --file_location_prefix=[prefix the paths in input json] --copy_to[path to copy files to] --filename_field=[field containing the filenames] --split_filename_field=[yes|no]');

	return;
}

var argv = require('minimist')(process.argv.slice(2));

var fileLocation = argv.file_location;
var fileLocationPrefix = argv.file_location_prefix || '';
var outputFolder = argv.copy_to;
var filenameField = argv.filename_field;
var splitFilenameField = argv.split_filename_field;

fs.readFile(argv.input, 'utf-8', function(error, fileData) {
	var data = JSON.parse(fileData);

	_.each(data, function(item) {
		if (item[filenameField].length > 0) {
			var filePath = item[filenameField].split('/').join('\\');

			if (splitFilenameField) {
				filePath = filePath.split('\n').length == 1 ? filePath.split('\n')[0] : filePath.split('\n')[1];
			}
			var fileName = path.basename(filePath);

			fileName = fileName.replace('filewin:', '');

			var copyToPath = path.format({
				dir: outputFolder,
				base: fileName
			});

			console.log('xcopy /I /Y "'+filePath+'" "'+outputFolder+'"');
		}
	})
});