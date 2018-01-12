var fs = require('fs');
var _ = require('underscore');

if (process.argv.length < 5) {
	console.log('node jsonCreateElasticsearchBulkImport.js [id field] [index name] [input json file] [output json file]');

	return;
}

var idField = process.argv[2];

fs.readFile(process.argv[4], function(err, fileData) {
	var outputData = '';
	var data = JSON.parse(fileData);

	var counter = 0;

	_.each(data, function(item, index) {
		var bulkHeader = {
			index: {
				_index: process.argv[3],
				_id: item[idField]
			}
		};
		outputData += JSON.stringify(bulkHeader)+'\n';

		delete item[idField];

		outputData += JSON.stringify(item)+'\n';

		counter++;
	});

	fs.writeFile(process.argv[5], outputData, function(error) {
		if (error) {
			console.log(error);
		}
		else {
			console.log('Done!');
			console.log(process.argv[4]+' formatted as Elasticsearch bulk file, '+counter+' entries written to '+process.argv[5]);
		}
	});
});
