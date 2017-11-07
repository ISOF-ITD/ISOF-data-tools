var fs = require('fs');
var _ = require('underscore');
var request = require('request');

if (process.argv.length < 4) {
	console.log('node stipendiaterGetSockenId.js [input stipendiater json file] [output json file]');

	return;
}

request({
	url: 'http://www4.sprakochfolkminnen.se/sagner/api/socken',
	json: true
}, function (error, response, body) {
	var sockenData = body;

	fs.readFile(process.argv[2], function(err, fileData) {
		var data = JSON.parse(fileData);

		_.each(data, function(item, index) {
			var sockenName = item['Socken'];
			var landskapName = item['Landskap'];

			if (sockenName != '') {
				var foundSocken = _.find(sockenData, function(socken) {
					return socken.name.indexOf(sockenName) > -1 && socken.landskap.indexOf(landskapName) > -1;
				});

				console.log('--------');
				console.log('Looked for '+sockenName+', '+landskapName);
				console.log(foundSocken);

				if (foundSocken) {
					item['Socken-Id'] = foundSocken.id;
					console.log('---- FOUND: '+foundSocken.id);
				}
			}
		});

		if (process.argv[3]) {		
			fs.writeFile(process.argv[3], JSON.stringify(data, null, 2), function(error) {
				if (error) {
					console.log(error);
				}
				else {
					console.log('Done!');
					console.log(process.argv[2]+' processed and written to '+process.argv[3]);
				}
			});

		}
	});
});