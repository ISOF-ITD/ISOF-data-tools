var fs = require('fs');
var _ = require('underscore');

var turf = require('@turf/turf');
var Levenshtein = require('levenshtein');

var isofSocken;
var lmSocken;

function pointInSocken(lat, lng) {
	var feature = turf.point([Number(lng), Number(lat)]);

	var found;

	_.each(lmSocken.features, function(socken) {
		if (turf.inside(feature, socken.geometry.coordinates)) {
			found = socken;
		}
	});

	return found || false;
}

fs.readFile(process.argv[2], function(err, isofFileData) { // Socken tabell ISOF
	isofSocken = JSON.parse(isofFileData);

	fs.readFile(process.argv[3], function(err, lmFileData) { // Socken data Lantmäteriet
		lmSocken = JSON.parse(lmFileData);

		_.each(isofSocken, function(socken, index) {
			console.log(socken.name);
			var inSocken = pointInSocken(socken.lat, socken.lng);

			if (inSocken) {
				console.log('found: '+inSocken.properties.SnSt_Namn);

				socken.lmName = inSocken.properties.SnSt_Namn;
				socken.lmId = inSocken.properties.SnSt_Id;
				socken.diff = new Levenshtein(socken.name, inSocken.properties.SnSt_Namn).distance
			}

			console.log('----');
		});

		fs.writeFile(process.argv[4], JSON.stringify(isofSocken, null, 2), function(error) {
			if (error) {
				console.log(error);
			}
			else {
				console.log('Done!');
				console.log(process.argv[2]+' and '+process.argv[3]+' joined and written to '+process.argv[4]);
			}
		});
	});
});