
var mysql = require('mysql');
var _ = require('underscore');
var fs = require('fs');

var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'svenska_sagor'
});

connection.connect();

connection.query('select id, title, text from records where (type = "arkiv" OR type = "tryckt")', function(recordQueryError, recordResult) {
	var recordIndex = 0;

	function writeFile() {
		var item = recordResult[recordIndex];

		fs.writeFile(process.argv[2]+'\\'+item.id+'.txt', item.title+' '+item.text, 'utf-8', function() {
			if (recordIndex < recordResult.length-1) {
				recordIndex++;

				writeFile();
			}
			else {
				console.log((recordIndex+1)+' files written to '+process.argv[2]);

				connection.end();
			}
		});
	}

	writeFile();
});