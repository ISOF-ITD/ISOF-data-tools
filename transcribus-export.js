var fs = require('fs');
var os = require('os');
var xml2js = require('xml2js');
var _ = require('underscore');

if (process.argv.length < 4) {
	console.log('node transcribus-export.js [input tei folder] [output json file]');

	return;
}

function path(dir, files) {
	return dir.substr(dir.length-1, 1) == '\\' ? dir+file : dir+'\\'+(files.join ? files.join('\\') : files);
}

function addslashes(str) {
	return (str+'').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}

var transcriptionData = [];

function exportText(dir) {
	var files = fs.readdirSync(path(process.argv[2], [dir]));

	var teiFile = _.find(files, function(file) {
		return file.indexOf('.tei') > -1;
	});

	var pageFolder = _.find(files, function(file) {
		return fs.lstatSync(path(process.argv[2], [dir, file])).isDirectory(); 
	});

	console.log('---------');

	console.log('teiFile: '+teiFile);
	console.log('pageFolder: '+pageFolder);

	var accNr = pageFolder.replace('_KLAR_', '').replace('_KLAR', '').replace('_HTR', '').replace('_METADATA', '');

	console.log('accNr: '+accNr);

	var teiFileContent = fs.readFileSync(path(process.argv[2], [dir, teiFile]));

	var parser = new xml2js.Parser();

	parser.parseString(teiFileContent, function(err, result) {
		_.each(result.TEI.facsimile, function(page) {
//			var zoneId = page.surface[0].zone ? page.surface[0].zone[0].$['xml:id'] : null;
			var zoneId = page.$['xml:id'];

			console.log(zoneId);

			if (!zoneId) {
				return;
			}
			var pageTextNode = _.find(result.TEI.text[0].body[0].p, function(p) {
				return p.$.facs.indexOf(zoneId+'_') > -1;
			});

			var imageFile = page.surface[0].graphic[0].$.url;

			if (pageTextNode && pageTextNode._) {
				var pageText = pageTextNode._;
				pageText = pageText.split('\t').join('').split('\n').join(' ');

				transcriptionData.push({
					accNr: accNr,
					file: imageFile,
					transcription: pageText
				});
			}
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
