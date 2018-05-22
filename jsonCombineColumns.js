var fs = require('fs');
var _ = require('underscore');
var request = require('request');
var JSDOM = require('jsdom').JSDOM;

if (process.argv.length < 3) {
	console.log('node jsonGetFileContent.js --input=[input json] --output=[output json] --sourceFields=[source fields, comma seperated] --destinationField=[new destination field] --destinationDelimiter=[string to join sourceFields on]');

	return;
}

var argv = require('minimist')(process.argv.slice(2));

var fileData = JSON.parse(fs.readFileSync(argv.input));
var processedData = [];

var sourceFields = argv.sourceFields.split(',');

_.each(fileData, function(item) {
	var newFieldValue = _.map(sourceFields, function(field) {
		return item[field];
	}).join(argv.destinationDelimiter || '');

	item[argv.destinationField] = newFieldValue;

	processedData.push(item);
});

if (argv.output) {
	fs.writeFile(argv.output, JSON.stringify(processedData, null, 2));
	console.log('Done!');
	console.log('Fields "'+argv.sourceField.split(',').join('", "')+'" in '+argv.input+' combined to field "'+argv.destinationField+'" and written to '+argv.output);
}
else {
	console.log(JSON.stringify(processedData, null, 2));
}
