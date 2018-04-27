var fs = require('fs');
var _ = require('underscore');

if (process.argv.length < 5) {
	console.log('node jsonCreateElasticsearchBulkImport.js --input=[input json file] --output[output json file] --type=[document type] --bulkAction=[index|update] --idField=[id field] --index=[index name]');

	return;
}

var argv = require('minimist')(process.argv.slice(2));

var idField = argv.idField;

fs.readFile(argv.input, function(err, fileData) {
	var outputData = '';
	var data = JSON.parse(fileData);

	var counter = 0;

	var bulkAction = argv.bulkAction || 'index';

	_.each(data, function(item, index) {
		var bulkHeader = {};
		bulkHeader[bulkAction] = {
			_index: argv.index,
			_type: argv.type,
			_id: item[idField]
		};

		outputData += JSON.stringify(bulkHeader)+'\n';

		var dataItem;

		if (argv.bulkAction && argv.bulkAction == 'update') {
			dataItem = {
				doc: item
			};
		}
		else {
			dataItem = item;
		}

		outputData += JSON.stringify(dataItem)+'\n';

		counter++;
	});

	fs.writeFile(argv.output, outputData, function(error) {
		if (error) {
			console.log(error);
		}
		else {
			console.log('Done!');
			console.log(argv.input+' formatted as Elasticsearch bulk file, '+counter+' entries written to '+process.argv[5]);
		}
	});
});
