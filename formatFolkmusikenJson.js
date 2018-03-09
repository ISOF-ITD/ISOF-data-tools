var fs = require('fs');
var path = require('path');
var _ = require('underscore');

if (process.argv.length < 4) {
	console.log('node formatFilemakerJson.js --input=[input json file] --output=[output json file] --action=[format|check_files');

	return;
}

var argv = require('minimist')(process.argv.slice(2));

var validateDate = function(dateStr) {
	var date = new Date(dateStr);

	if (date == 'Invalid Date') {
		return null
	}
	else {
		return date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
	}
}

var formatMediaUrl = function(url) {
	return url.replace('file://fistulator/webpub/', '').replace('file://Fistulator/webpub/', '').replace('file://Fistulator/Webpub/', '').replace('file://Fistulator/WebPub/', '').replace('file://fistulator/Webpub/', '').replace('file://fistulator/WebPub/', '');
}

fs.readFile(argv.input, function(err, fileData) {
	var data = JSON.parse(fileData);

	if (argv.action && argv.action == 'check_files') {
		_.each(data, function(item, index) {
			if (item['FileMakersökväg'] != '') {
				if (item['FileMakersökväg'].toLowerCase().indexOf('.pdf') > -1) {
					console.log(item['FileMakersökväg']);
				}

				if (item['Filnamn_beräknad'] == '') {
					console.log(item['Filnamn_beräknad']);
				}
			}
			if (item['PDF_fil_beräknad'] != '') {
				console.log(item['Titel eller låtnamn']+' : '+item['PDF_fil_beräknad']);
			}
		});
	}
	else {
		var processedData = [];

		_.each(data, function(item, index) {
			var id = 'fmd_'+item['Acc.nr']+'_'+item['DATA_ID'];

			var title = item['Titel eller låtnamn'] != '' ? item['Titel eller låtnamn'] : item['Textbörjan eller Innehåll'] != '' ? item['Textbörjan eller Innehåll'] :  item['Låttyp eller visgenre'] != '' ? item['Låttyp eller visgenre'] : item['Sångare_  Instrumentalist_ namn'] != '' ? item['Sångare_  Instrumentalist_ namn'] : '';

			workingObject = {
				id: id,
				title: title,
				materialtype: 'folkmusik',
				year: validateDate(item['Inspelat år']),
				text: item['Textbörjan eller Innehåll'],
				archive: {
					total_pages: 1,
					archive_id: item['Acc.nr'],
					country: 'sweden',
					archive: 'DAG'
				},
				metadata: []
			};

			if (item['SockenID'] != '') {
				var sockenIds = item['SockenID'].split(';');

				workingObject.places = [];

				_.each(sockenIds, function(sockenId) {
					workingObject.places.push({
						id: sockenId,
						type: 'place_collected'
					});
				})
			}

			if (item['Låt nr'] != '' && Number(item['Låt nr'])) {
				workingObject.archive.archive_page = Number(item['Låt nr']);
			}

			if (item['Medium'] != '') {
				workingObject.metadata.push({
					type: 'folkmusik_medium',
					value: item['Medium']
				});
			}

			if (item['Inspelat eller inlämnat av'] != '') {
				workingObject.metadata.push({
					type: 'folkmusik_recorded_by',
					value: item['Inspelat eller inlämnat av']
				});
			}

			if (item['Låttyp eller visgenre'] != '') {
				workingObject.metadata.push({
					type: 'folkmusik_genre',
					value: item['Låttyp eller visgenre']
				});
			}

			if (item['Sångare_  Instrumentalist_ namn'] != '') {
				workingObject.metadata.push({
					type: 'folkmusik_musician_name',
					value: item['Sångare_  Instrumentalist_ namn']
				});
			}

			if (item['Sång  instrument'] != '') {
				workingObject.metadata.push({
					type: 'folkmusik_instrument',
					value: item['Sång  instrument']
				});
			}

			if (item['Proveniens'] != '') {
				workingObject.metadata.push({
					type: 'folkmusik_proveniens',
					value: item['Proveniens']
				});
			}

			if (item['Upphovsman melodi'] != '') {
				workingObject.metadata.push({
					type: 'folkmusik_composer',
					value: item['Upphovsman melodi']
				});
			}

			if (item['Upphovsman text'] != '') {
				workingObject.metadata.push({
					type: 'folkmusik_author_text',
					value: item['Upphovsman text']
				});
			}

			if (item['Publicering'] && item['Publicering'].toLowerCase() == 'ja' && item['FileMakersökväg'] != '' && item['FileMakersökväg'].toLowerCase().indexOf('ljudfil_saknas') == -1) {
				workingObject.metadata.push({
					type: 'folkmusik_published',
					value: 'yes'
				});
			}

			if (item['Övrigt'] != '') {
				workingObject.metadata.push({
					type: 'folkmusik_comment',
					value: item['Övrigt']
				});
			}

			if (((item['FileMakersökväg'] != '' && item['FileMakersökväg'].toLowerCase().indexOf('ljudfil_saknas') == -1) || item['Sökväg_pdf'] != '') && item['Publicering'].toLowerCase() == 'ja') {
				workingObject.media = [];

				if (item['FileMakersökväg'] != '' && item['FileMakersökväg'].toLowerCase().indexOf('ljudfil_saknas') == -1) {
					workingObject.media.push({
						type: 'audio',
						source: formatMediaUrl(item['FileMakersökväg']),
						title: item['Textbörjan eller Innehåll']
					});
				}

				if (item['Sökväg_pdf'] != '') {
					workingObject.media.push({
						type: 'pdf',
						source: formatMediaUrl(item['Sökväg_pdf']),
						title: item['Textbörjan eller Innehåll']
					});
				}
			}

			console.log(workingObject.id+': '+workingObject.title);

			processedData.push(workingObject);
		});

		fs.writeFile(argv.output, JSON.stringify(processedData, null, 2), function(error) {
			if (error) {
				console.log(error);
			}
			else {
				console.log('Done!');
				console.log(argv.input+' formatted, '+processedData.length+' entries written to '+argv.output);
			}
		});
	}
});