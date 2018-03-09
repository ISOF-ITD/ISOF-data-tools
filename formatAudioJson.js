var fs = require('fs');
var _ = require('underscore');

if (process.argv.length < 5) {
	console.log('node formatAudioJson.js --idField=[id field] --mediaField=[media field] --input=[input json file] --output=[output json file]');

	return;
}

var argv = require('minimist')(process.argv.slice(2));
var idField = argv.idField;
var mediaField = argv.mediaField;

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

fs.readFile(argv.input, function(err, fileData) {
	var data = JSON.parse(fileData);

	var processedData = [];

	var lastAcc;
	var workingObject;
	var mediaTitles;

	_.each(data, function(item, index) {
		if (item[idField]) {
			mediaTitles = item.Titel_Allt.split('\n \n').join('\n\n').split('\n\n');

			item.media = [];
			item.media.push(createMediaObject(item[mediaField], mediaTitles));

			delete item[mediaField];

			workingObject = item;
		}
		else {
			if (item[mediaField] != '') {
				workingObject.media.push(createMediaObject(item[mediaField], mediaTitles));
			}
		}

		if (item[idField] && item[idField] != lastAcc) {
			lastAcc = item[idField];

			processedData.push(item);
		}
	});

	_.each(processedData, function(item, index) {
		var mediaTitles = item.Titel_Allt.split('\n \n').join('\n\n').split('\n\n');
		console.log(mediaTitles.length == item.media.length);
		if (mediaTitles.length != item.media.length) {
			console.log(item[idField]);
		}
		var sortObj = _.invert(_.object(_.pairs(mediaTitles)));

		item.media = _.sortBy(item.media, function(mediaItem) {
			return sortObj[mediaItem.title]
		});
	});

	fs.writeFile(argv.output, JSON.stringify(processedData, null, 2), function(error) {
		if (error) {
			console.log(error);
		}
		else {
			console.log('Done!');
			console.log(process.argv[2]+' formatted and written to '+process.argv[3]);
		}
	});
});