var fs = require('fs');
var xml2js = require('xml2js');
var _ = require('underscore');

if (process.argv.length < 4) {
	console.log('node transcribus-merge.js [input legends json file] [input transcribus json file] [output json file]');

	return;
}

fs.readFile(process.argv[2], function(err, legendsFileData) {
	if (err) {
		console.log(err);

		return;
	}

	var legendsData = JSON.parse(legendsFileData);

	fs.readFile(process.argv[3], function(err, transcribusFileData) {
		if (err) {
			console.log(err);

			return;
		}

		var transcribusData = JSON.parse(transcribusFileData);

		var transcriptionsCount = 0;

		_.each(legendsData, function(legend) {
			if (!legend['Acc. nr'] || legend['Acc. nr'] == '') {
				return;
			}

			var transcriptions = _.filter(transcribusData, function(transcription) {
				return transcription.accNr == legend['Acc. nr'];
			})

			var pageNumbers = legend['Sid. nr'].split('-');

			if (pageNumbers.length == 2 && pageNumbers[1]-pageNumbers[0] > 1) {
				var pageRange = [];

				for (var i = pageNumbers[0]; i<=pageNumbers[1]; i++) {
					pageRange.push(i);
				}

				pageNumbers = pageRange;
			}
/*
			console.log('----------Legend----------');
			console.log(legend['Acc. nr']);
			console.log(pageNumbers);
			console.log('----------');
*/
			var transcriptionPages = _.filter(transcriptions, function(transcription) {
				var filenameFrags = transcription.file.replace('.jpg', '').split('_');

				var pageNumber;

				if (filenameFrags[2] == 'Sida') {
					pageNumber = Number(filenameFrags[3]);
				}

				if (pageNumber) {
					return pageNumbers.length == 1 ? 
						pageNumbers[0] == pageNumber :
						pageNumbers[0] <= pageNumber && pageNumbers[pageNumbers.length-1] >= pageNumber;
				}
			});

			if (transcriptionPages.length > 0) {
				legend.Text = _.pluck(transcriptionPages, 'transcription').join(' ');

				transcriptionsCount += transcriptionPages.length;

				if (legend['Bildnr'] == '') {
					legend['Bildnr'] = _.pluck(transcriptionPages, 'file').join(';');
				}

				console.log(legend.Text);
			}
		});

		if (process.argv[4]) {		
			fs.writeFile(process.argv[4], JSON.stringify(legendsData, null, 2), function(error) {
				if (error) {
					console.log(error);
				}
				else {
					console.log('Done!');
					console.log('Found '+transcriptionsCount+' transcription pages which were added to '+process.argv[2]+'. Output written to '+process.argv[4]);
				}
			});

		}
	});
});