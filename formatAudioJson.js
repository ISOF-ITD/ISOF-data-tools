var fs = require('fs');
var _ = require('underscore');

function createMediaArray(item) {
	console.log(item.Titel_Allt.match(/\([0-9]*(\) \(| )[A-Z|a-z]*\)/g));
}

fs.readFile(process.argv[2], function(err, fileData) {
	var data = JSON.parse(fileData);

	_.each(data, function(item, index) {
		if (index > 5) return;
		item.persons = _.map(item.PersPersId, function(personId, index) {
			var personObj = {
				id: personId
			};

			personObj['name'] = item.PersNamn[index];
			personObj['role'] = item.AccPersRoll[index];

			return personObj;
		});

		delete item.PersPersId;
		delete item.PersNamn;
		delete item.AccPersRoll;

		item.media = createMediaArray(item);
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