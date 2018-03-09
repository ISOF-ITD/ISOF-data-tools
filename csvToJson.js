var csvParse = require('csv-parse');
var fs = require('fs');
var _ = require('underscore');

if (process.argv.length < 4) {
	console.log('node csvToJson.js [csv file] [json file]');

	return;
}

var parser = csvParse({
	columns: true,
	auto_parse: false
}, function(err, data){
	fs.writeFile(process.argv[3], JSON.stringify(data, null, 2), function(error) {
		if (error) {
			console.log(error);
		}
		else {
			console.log(data.length+' rows written to '+process.argv[3]);
		}
	});
});

fs.createReadStream(process.argv[2]).pipe(parser);