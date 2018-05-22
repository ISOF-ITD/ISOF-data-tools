var fs = require('fs');
var _ = require('underscore');
var request = require('request');
var JSDOM = require('jsdom').JSDOM;

if (process.argv.length < 3) {
	console.log('node jsonFindReplace.js --input=[input json] --output=[output json] --lookupField=[field to search and replace in] --searchString=[string to search for] --replaceWith=[replace searchString with]');

	return;
}

var argv = require('minimist')(process.argv.slice(2));

var fileData = JSON.parse(fs.readFileSync(argv.input));

var processedData = [];

_.each(fileData, function(item) {
	if (item[argv.lookupField]) {
		item[argv.lookupField] = item[argv.lookupField].split(argv.searchString).join(argv.replaceWith);
		console.log('replace '+argv.searchString+' with '+argv.replaceWith+' in '+argv.lookupField)
		console.log(item[argv.lookupField].split(argv.searchString).length);
		processedData.push(item);
	}
	else {
		console.log('lookupField not found');
	}
});

if (argv.output) {
	fs.writeFile(argv.output, JSON.stringify(processedData, null, 2));
}
else {
	console.log(JSON.stringify(processedData, null, 2));
}

console.log('Done!');
console.log('"'+argv.searchString+'" replaced with "'+argv.replaceWith+'" in column "'+argv.lookupField+'", in '+argv.input+' output written to '+argv.output);
