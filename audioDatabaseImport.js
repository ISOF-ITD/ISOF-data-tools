var mysql = require('mysql');
var _ = require('underscore');
var fs = require('fs');

function mysql_real_escape_string (str) {
	if (typeof str == 'undefined') {
		return '';
	}
	return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
		switch (char) {
			case "\0":
				return "\\0";
			case "\x08":
				return "\\b";
			case "\x09":
				return "\\t";
			case "\x1a":
				return "\\z";
			case "\n":
				return "\\n";
			case "\r":
				return "\\r";
			case "\"":
			case "'":
			case "\\":
			case "%":
				return "\\"+char; // prepends a backslash to backslash, percent,
								  // and double/single quotes
		}
	});
}

var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'svenska_sagor'
});

connection.connect();

fs.readFile(process.argv[2], function(error, fileData) {
	var json = JSON.parse(fileData);

	_.each(json, function(item) {
		var recordQuery = 'INSERT INTO records (title, year, type, archive_id) VALUES ("'+item.title+'", "'+item.Inl_from+'", "inspelning", "'+item.Acc+'")';

		connection.query(recordQuery, function(recordQueryError, recordResult) {
			if (recordQueryError) {
				console.log(recordQueryError);
				console.log(recordQuery);
			}
			else {
				console.log('Insert record: '+recordResult.insertId);
			}

			if (item.sockenId) {
				var placeQuery = 'INSERT INTO records_places (record, place) VALUES ('+recordResult.insertId+', '+item.sockenId+')';
				connection.query(placeQuery, function(placeQueryError) {
					if (placeQueryError) {
						console.log(placeQueryError);
					}
				});
			}
			_.each(item.persons, function(personItem) {
				var personQuery = 'INSERT INTO records_persons (record, person, relation) VALUES ('+recordResult.insertId+', '+personItem.id+', '+(personItem.role == 7 ? '"c"' : personItem.role == 8 ? '"i"' : '')+')';

				connection.query(personQuery, function(personQueryError) {
					if (personQueryError) {
						console.log(personQueryError);
					}
				});
			});

			_.each(item.media, function(mediaItem) {
				var mediaQuery = 'INSERT INTO media (title, source, type) VALUES ("'+mysql_real_escape_string(mediaItem.title)+'", "'+mediaItem.src+'", "audio")';

				connection.query(mediaQuery, function(mediaQueryError, mediaResult) {
					if (mediaQueryError) {
						console.log(mediaQueryError);
						console.log(mediaQuery);
					}
					var recordsMediaQuery = 'INSERT INTO records_media (record, media) VALUES ('+recordResult.insertId+', '+mediaResult.insertId+')';
					console.log(recordsMediaQuery);
					connection.query(recordsMediaQuery, function(recordsMediaQueryError, result) {
						console.log(result);
						if (recordsMediaQueryError) {
							console.log(recordsMediaQueryError);
							console.log(recordsMediaQuery);
						}
					});
				});
			})
		})
	});
});