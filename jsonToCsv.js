var fs = require('fs');
var _ = require('underscore');

if (process.argv.length < 4) {
	console.log('node jsonToCsv.js [input json file] [output csv file]');

	return;
}

fs.readFile(process.argv[2], function(err, fileData) {
	function writeCsvRow(rowData) {
		console.log(rowData);
		var fields = [];

		for (var i = 0; i<rowData.length; i++) {
			var rowText = rowData[i] ? rowData[i].split('"').join('""') : '';
			fields.push('"'+rowText+'"');
		}

		csvString += fields.join(',')+'\n';
	}

	var data = JSON.parse(fileData);

	var csvString = '';

	var headerRow = [];

	var fieldNames = data[0];

	for (var field in fieldNames) {
		headerRow.push(field);
	}
	writeCsvRow(headerRow);

	_.each(data, function(item, index) {
		if (index > 20) {
//			return;
		}
		var row = [];
		for (var field in fieldNames) {
			row.push(item[field]);
		}
		writeCsvRow(row);
	});

	fs.writeFile(process.argv[3], csvString, function(error) {
		if (error) {
			console.log(error);
		}
		else {
			console.log('Done!');
			console.log(process.argv[2]+' converted to '+process.argv[3]);
		}
	});

});