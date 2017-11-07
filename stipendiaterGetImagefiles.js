var fs = require('fs');
var _ = require('underscore');

if (process.argv.length < 5) {
	console.log('node stipendiaterGetImagefiles.js [input stipendiater json file] [input imagelist json file] [output json file]');

	return;
}

fs.readFile(process.argv[3], function(err, imageFileData) {
	var imageFiles = JSON.parse(imageFileData);

	fs.readFile(process.argv[2], function(err, fileData) {
		var data = JSON.parse(fileData);

		var imageFilesCount = 0;

		_.each(data, function(item, index) {
			var accNr = item['Acc. nr'];
			var page = item['Sid. nr'];


			var images = _.filter(imageFiles, function(file) {
				return file.toLowerCase().indexOf(accNr.toLowerCase()) > -1 && accNr != '';
			})

			if (images.length > 0) {
				console.log('--------------------');
				console.log('accNr: '+accNr);
				console.log('page: '+page);

				var pageNumbers = page.split('-');

				if (pageNumbers.length == 2 && pageNumbers[1]-pageNumbers[0] > 1) {
					var pageRange = [];

					for (var i = pageNumbers[0]; i<=pageNumbers[1]; i++) {
						pageRange.push(i);
					}

					pageNumbers = pageRange;
				}

				var imagePages = _.filter(images, function(file) {
					var found = false;

					_.each(pageNumbers, function(number) {
						if (file.indexOf('_'+('000'+number).substr(-3)+'.') > -1) {
							found = true;
						}
					})
					return found;
				});

				imageFilesCount += imagePages.length;

				item['Bildnr'] = imagePages.join(';');
			}
		});

		if (process.argv[4]) {		
			fs.writeFile(process.argv[4], JSON.stringify(data, null, 2), function(error) {
				if (error) {
					console.log(error);
				}
				else {
					console.log('Done!');
					console.log('Found '+imageFilesCount+' image files. '+process.argv[2]+' filled with image file names and written to '+process.argv[4]);
				}
			});

		}
	});
});