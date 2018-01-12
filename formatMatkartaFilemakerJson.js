var fs = require('fs');
var _ = require('underscore');

var getFileAddress = function(fileField) {
	if (fileField.indexOf('Frgl_16_Brodet_och_dess_tillredning.pdf') > -1) {
		return false;
	}
	else {
		return fileField;
	}
}

fs.readFile(process.argv[2], function(err, fileData) {
	var data = JSON.parse(fileData);

	var processedData = [];

	var lastAcc;
	var workingObject;
	var mediaTitles;

	_.each(data, function(item, index) {
		if (item.Acc_nr_ny) {
			item.persons = [{
				id: item['Pers::PersId'],
				role: item['AccPers::!Roll']
			}];

			item.media = [];
			if (getFileAddress(item['Lank::SökvägMP3'])) {
				item.media.push(getFileAddress(item['Lank::SökvägMP3']));
			}
			workingObject = item;
		}
		else {
			if (item['Lank::SökvägMP3'] != '' && getFileAddress(item['Lank::SökvägMP3'])) {
				var fileAddresses = getFileAddress(item['Lank::SökvägMP3']).split('\n');
				workingObject.media = fileAddresses;
			}

			if (item['Pers::Namn'] != '') {
				workingObject.persons.push({
					id: item['Pers::PersId'],
					role: item['AccPers::!Roll']
				});
			}
		}

		if (item.Acc_nr_ny && item.Acc_nr_ny != lastAcc) {
			lastAcc = item.Acc_nr_ny;

			processedData.push(workingObject);
		}
	});

	fs.writeFile(process.argv[3], JSON.stringify(processedData, null, 2), function(error) {
		if (error) {
			console.log(error);
		}
		else {
			console.log('Done!');
			console.log(process.argv[2]+' formatted and written to '+process.argv[3]);
		}
	});
});