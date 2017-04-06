var fs = require('fs');
var _ = require('underscore');

function createMediaObject(mp3File, mediaTitles) {
	var fileName = mp3File.split("\n")[0];

	var mediaId = fileName.split(/file:SK([0-9]+)([A-Z])/g);
//	console.log(Number(mediaId[1]));
//	console.log(mediaId[2]);

	var mediaTitle = _.find(mediaTitles, function(item) {
		var regExString = '\\('+Number(mediaId[1])+' '+mediaId[2]+'[ I]*\\)';
		var regEx = new RegExp(regExString);

		if (item.match(regEx)) {
//			console.log('RegEx: '+regExString+' = '+item);
		}

		return item.match(regEx);
	}) || '';

	return {
		src: fileName.replace('file:', ''),
		title: mediaTitle
	};
}

fs.readFile(process.argv[2], function(err, fileData) {
	var data = JSON.parse(fileData);

	var processedData = [];

	var lastAcc;
	var workingObject;
	var mediaTitles;

	_.each(data, function(item, index) {
		if (item.Acc) {
			mediaTitles = item.Titel_Allt.split('\n \n').join('\n\n').split('\n\n');

			item.media = [];
			item.media.push(createMediaObject(item.MP3, mediaTitles));

			delete item.MP3;

			item.persons = [];
			item.persons.push({
				name: item.Pers_Namn,
				id: item.Pers_PersId,
				role: item.AccPers_Roll
			});

			delete item.Pers_Namn;
			delete item.Pers_PersId;
			delete item.AccPers_Roll;

			workingObject = item;
		}
		else {
			if (item.MP3 != '') {
				workingObject.media.push(createMediaObject(item.MP3, mediaTitles));
			}

			if (item.Pers_PersId && item.Pers_PersId != '') {			
				workingObject.persons.push({
					name: item.Pers_Namn,
					id: item.Pers_PersId,
					role: item.AccPers_Roll
				});
			}
		}

		if (item.Acc && item.Acc != lastAcc) {
			lastAcc = item.Acc;

			processedData.push(item);
		}
	});

	_.each(processedData, function(item, index) {
		var mediaTitles = item.Titel_Allt.split('\n \n').join('\n\n').split('\n\n');
		console.log(mediaTitles.length == item.media.length);
		if (mediaTitles.length != item.media.length) {
			console.log(item.Acc);
		}
		var sortObj = _.invert(_.object(_.pairs(mediaTitles)));

		item.media = _.sortBy(item.media, function(mediaItem) {
			return sortObj[mediaItem.title]
		});

		if (item.persons) {
			var personNames = _.map(_.filter(item.persons, {role: 8}), function(person) {
				var nameSplitted = person.name.split(', ');
				nameSplitted.reverse();
				return nameSplitted.join(' ').split('\n').join('');
			});

			if (personNames.length == 1) {
				item.title = personNames[0];
			}
			else if (personNames.length > 1) {
				var lastPerson = personNames[personNames.length-1];
				personNames.splice(-1, 1);
				var newTitle = personNames.join(', ')+' och '+lastPerson;

				item.title = newTitle;
			}
			else {
				item.title = 'Acc. '+item.Acc;
			}
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