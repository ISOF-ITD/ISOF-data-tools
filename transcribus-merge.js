var fs = require('fs');
var xml2js = require('xml2js');
var _ = require('underscore');

return;
fs.readFile(process.argv[2], function(err, fileData) {
	if (err) {
		console.log(err);

		return;
	}
	var parser = new xml2js.Parser();

	parser.parseString(fileData, function(err, result) {
	});
});