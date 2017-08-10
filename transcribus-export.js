var fs = require('fs');
var os = require('os');
var xml2js = require('xml2js');
var _ = require('underscore');

function path(dir, file) {
	return dir.substr(dir.length-1, 1) == '\\' ? dir+file : dir+'\\'+file;
}

function addslashes(str) {
	return (str+'').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}

var transcriptionData = [];

function exportText(dir) {
	var accNr = dir.replace('_KLAR_', '').replace('_KLAR', '');

	var files = fs.readdirSync(path(process.argv[2], dir+'\\'+dir+'\\page'));
	_.each(files, function(file) {
		console.log(file);

		var fileData = fs.readFileSync(path(process.argv[2], dir+'\\'+dir+'\\page\\'+file));

		var parser = new xml2js.Parser();

		parser.parseString(fileData, function(err, result) {
			var transcriptions = [];

			_.each(result.PcGts.Page[0].TextRegion, function(textRegion) {
				if (textRegion.TextEquiv) {
					transcriptions.push(textRegion.TextEquiv[0].Unicode[0]);
				}
			});

			transcriptionData.push({
				accNr: accNr,
				file: file,
				transcription: transcriptions.join(os.EOL)
			});
		});
	});
}

fs.readdir(process.argv[2], function(err, files) {
	_.each(files, function(file) {
		if (fs.lstatSync(path(process.argv[2], file)).isDirectory()) {
			exportText(file);
		}
	});

	fs.writeFile(process.argv[3], JSON.stringify(transcriptionData, null, 2), function(error) {
		if (error) {
			console.log(error);
		}
		else {
			console.log('Done!');
			console.log(process.argv[2]+' processed and written to '+process.argv[3]);
		}
	});
});
