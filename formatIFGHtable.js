var fs = require('fs');
var _ = require('underscore');

fs.readFile(process.argv[2], function(err, fileData) {
	var data = JSON.parse(fileData);

	var splitWord = process.argv[4] || 'IFGH';

	_.each(data, function(item, index) {
		var lines = item.Text.split('\n');
		
		var refLine = _.find(lines, function(line) {
			return line.indexOf(splitWord) > -1;
		})

//		console.log(refLine);

		if (refLine) {
			var ifghNumber = splitWord+refLine.split(splitWord)[1];

			var place = refLine.split(splitWord)[0];

			var socken = place.split(', ')[0];
			var landskap = place.split(', ')[1];

			item.ref = ifghNumber.split(' s.')[0];

			if (ifghNumber.split(' s.')[1]) {
				var pageNumber = ifghNumber.split(' s.')[1];

				item.Sidnummer = pageNumber;
			}
			else {
				item.Sidnummer = '';
			}
			item.Socken = socken;
			item.Landskap = landskap || '';
		}
	});

	fs.writeFile(process.argv[3], JSON.stringify(data, null, 2), function(error) {
		if (error) {
			console.log(error);
		}
		else {
			console.log('Done!');
			console.log(process.argv[2]+' formatted and written to '+process.argv[3]);
		}
	});

});