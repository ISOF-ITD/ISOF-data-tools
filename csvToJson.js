var readLine = require('readline');
var fs = require('fs');
var _ = require('underscore');

var lineReader = readLine.createInterface({
	input: fs.createReadStream(process.argv[2])
});

var output = [];

var lineIndex = 0;
var fields;

lineReader.on('line', function(line) {
	if (lineIndex == 0) {
		fields = _.map(line.split(','), function(field) {
			return field.split('"').join('');
		});
	}
	else {
		var values = _.map(line.split(','), function(value) {
			return value.split('"').join('');
		});

		var row = {};

		_.each(fields, function(field, index) {
			row[field] = values[index];
		})

		output.push(row);
	}

	lineIndex++;
});

lineReader.on('close', function() {
	fs.writeFile(process.argv[3], JSON.stringify(output, null, 2), function(error) {
		if (error) {
			console.log(error);
		}
		else {
			console.log(lineIndex+' rows written to '+process.argv[3]);
		}
	});
});