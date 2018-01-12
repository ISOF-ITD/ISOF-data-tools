var fs = require('fs');
var _ = require('underscore');

if (process.argv.length < 3) {
	console.log('node jsonGetLength.js [input json file] [list property name]');

	return;
}

fs.readFile(process.argv[2], function(err, fileData) {
	var data = JSON.parse(fileData);

	if (process.argv[3]) {
		console.log('Length of data["'+process.argv[3]+'"]: '+data[process.argv[3]].length);
	}
	else {
		console.log('Length of data: '+data.length);
	}
});