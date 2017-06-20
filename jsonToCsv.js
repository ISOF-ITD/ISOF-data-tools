var fs = require('fs');
var _ = require('underscore');

fs.readFile(process.argv[2], function(err, fileData) {
	function writeCsvRow(rowData) {
		var fields = [];

		for (var i = 0; i<rowData.length; i++) {
			fields.push('"'+rowData[i]+'"');
		}

		csvString += fields.join(',')+'\n';
	}

	var data = JSON.parse(fileData);

	var csvString = '';

	var headerRow = [];

	var fieldNames = data[0];

	for (var field in fieldNames) {
		console.log(field);
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