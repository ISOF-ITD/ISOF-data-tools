var fs = require('fs');
var _ = require('underscore');

if (process.argv.length < 4) {
	console.log('node jsonSearch.js [input json file] [search query (fieldname1:value1;fieldname2:value2;[...])]');

	return;
}

fs.readFile(process.argv[2], function(err, fileData) {
	var data = JSON.parse(fileData);

	var properties = {};

	_.each(process.argv[3].split(';'), function(field) {
		var fieldQuery = field.split(':');

		properties[fieldQuery[0]] = fieldQuery[1];
	});

	console.log('Search in: '+process.argv[2]);
	console.log('\nQuery:');
	console.log(properties);
	console.log('\nResult:');

	console.log(_.findWhere(data, properties));
});