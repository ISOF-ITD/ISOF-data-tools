
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

fs.readFile(process.argv[2], 'utf-8', function(error, fileData) {
	var jsonIndex = 0;

	var json = JSON.parse(fileData);

	function processItem() {
		var item = json[jsonIndex];

		var searchCounty = item['Landsk AccOrt_Landsk_Landskap'].replace('län', '');

		var query = 'SELECT socken.id, socken.name, harad.lan FROM socken INNER JOIN harad ON socken.harad = harad.id WHERE socken.name LIKE "'+item['Socken AccOrt_Sock_Socken']+'%" AND harad.lan LIKE "%'+searchCounty+'%"';
		connection.query(query, function(error, result) {
			if (result.length == 1) {
/*
				console.log(item['Socken AccOrt_Sock_Socken']);
				console.log(item['Landsk AccOrt_Landsk_Landskap']);
				console.log(query);
				console.log('Found: ');
				console.log(result);
				console.log(result[0].name);
				console.log(result[0].lan);
				console.log('------');
*/
				item.sockenId = result[0].id;
			}

			if (jsonIndex < json.length-1) {
				jsonIndex++;

				processItem();

			}
			else {
				connection.end();

				fs.writeFile(process.argv[2], JSON.stringify(json, null, 2), function(error) {
					if (error) {
						console.log(error);
					}
					else {
						console.log('Done!');
						console.log(process.argv[2]+' populated with socken IDs');
					}
				});
			}
		});
	}

	processItem();
});