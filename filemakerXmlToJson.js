var fs = require('fs');
var xml2js = require('xml2js');
var _ = require('underscore');

String.prototype.allReplace = function(obj) {
	var retStr = this;
	for (var x in obj) {
		retStr = retStr.replace(new RegExp(x, 'g'), obj[x]);
	}
	return retStr;
};

fs.readFile(process.argv[2], function(err, fileData) {
	if (err) {
		console.log(err);

		return;
	}
	var parser = new xml2js.Parser();

	parser.parseString(fileData, function(err, result) {
		var fields = _.map(result.FMPXMLRESULT.METADATA[0].FIELD, function(field) {
			return field.$.NAME.replace(/[:!]*/g, '').allReplace({
				' ': '_',
				'Ö': 'o',
				'ö': 'o',
				'Å': 'A',
				'å': 'a',
				'Ä': 'A',
				'ä': 'a'
			});
		});
		var output = _.map(result.FMPXMLRESULT.RESULTSET[0].ROW, function(item) {
			var dataItem = {};

			_.each(item.COL, function(col, index) {
				if (fields[index] == 'Titel_Allt') {
					console.log(col.DATA);
				}
				if (col.DATA && col.DATA.length == 1) {
					dataItem[fields[index]] = col.DATA[0];
				}
				else {
					dataItem[fields[index]] = col.DATA;
				}
			});

			return dataItem;
		});

		fs.writeFile(process.argv[3], JSON.stringify(output, null, 2), function(error) {
			if (error) {
				console.log(error);
			}
			else {
				console.log('Done!');
				console.log(process.argv[2]+' converted to '+process.argv[3]);
			}
		});
	});
});