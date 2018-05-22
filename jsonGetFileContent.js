var fs = require('fs');
var _ = require('underscore');
var request = require('request');
var JSDOM = require('jsdom').JSDOM;

if (process.argv.length < 3) {
	console.log('node jsonGetFileContent.js --input=[input json] --output=[output json] --fileLocation=[file location folder] --fileNameField=[field containing file name] --destinationField=[destination field for file content]');

	return;
}

var argv = require('minimist')(process.argv.slice(2));

var fileData = JSON.parse(fs.readFileSync(argv.input));

var processedData = [];

_.each(fileData, function(item) {
	var filePath = argv.fileLocation+(argv.fileLocation.substr(argv.fileLocation.length-1) != '\\' ? '\\' : '')+item[argv.fileNameField];

	if (fs.existsSync(filePath)) {
		console.log('Opening '+filePath);

		item[argv.destinationField] = fs.readFileSync(filePath, 'utf-8');

		processedData.push(item);
	}
	else {
		notFound.push(filePath);
	}
});

if (argv.output) {
	fs.writeFile(argv.output, JSON.stringify(processedData, null, 2));
}
else {
	console.log(JSON.stringify(processedData, null, 2));
}

console.log('Done!');
console.log('Content of file names in field "'+argv.fileNameField+'" retrieved and added to field "'+argv.destinationField+'", output written to '+argv.output);

if (notFound.length > 0) {
	console.log(notFound.length+' files were not found:');
	console.log(notFound);
}
