var fs = require('fs');
var _ = require('underscore');

if (process.argv.length < 5) {
	console.log('node jsonCreateID.js [input json file] [ID fields (divided with "!")] [new ID field] [ID prefix]');

	return;
}

fs.readFile(process.argv[2], function(err, fileData) {
	var data = JSON.parse(fileData);

	var idFields = process.argv[3].split(';');
	var idPrefix = process.argv[5] || '';
	var newIdField = process.argv[4];

	_.each(data, function(item) {
		var ids = _.map(idFields, function(idField) {
			return item[idField];
		});

		var newId = ids.length > 0 && ids.join('') != '' ? idPrefix+ids.join('_') : '';

		item[newIdField] = newId;
	});

	fs.writeFile(process.argv[2], JSON.stringify(data, null, 2), function(error) {
		if (error) {
			console.log(error);
		}
		else {
			console.log('Done!');
			console.log(process.argv[2]+' populated with new IDs');
		}
	});
});