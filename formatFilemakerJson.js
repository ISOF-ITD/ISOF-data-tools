var fs = require('fs');
var _ = require('underscore');

/*

Script som formaterar export ur Filemaker till import json fil för Sagenkarta-importer/mysq-import-json.js

*/

if (process.argv.length < 5) {
	console.log('node formatFilemakerJson.js --idField=[id field] --joinIdField=[id field to append to main id] --archiveIdField=[archive id field (accessionnummer)] --uniqueArchiveIdField=[unique number (!Acc)] --archiveField=[archive field] --staticArchive=[static archive] --input=[input json file] --output=[output json file] --materialType=[materialType] --staticCategories=[category id comma seperated] --categoryField=[categoryField] --idPrefix=[id prefix] --reversePersonName=[yes|no] --personIdPrefix=[person id prefix] --personNamesAsTitle=[yes|no] --personNamesTitleFilter=[c|i] --titlePrefix=[title prefix] --formatMediaTitles=[yes|no] --mediaField=[media field] --informantCodes=[number used to identify informants, seperated by comma] --collectorCodes=[numbers used t identify collector, seperated by comma]');

	return;
}

// Hämtar alla arguments i formet "--arg=value"
var argv = require('minimist')(process.argv.slice(2));

var idField = argv.idField;
var joinIdField = argv.joinIdField;

var archiveIdField = argv.archiveIdField;
var archiveField = argv.archiveField;
var staticArchive = argv.staticArchive;
var uniqueArchiveIdField = argv.uniqueArchiveIdField;

var idPrefix = argv.idPrefix || '';

var categoryField = argv.categoryField;
var staticCategories = argv.staticCategories;

var materialType = argv.materialType;

var mediaField = argv.mediaField;

var personIdPrefix = argv.personIdPrefix || '';

var titlePrefix = argv.titlePrefix || '';

// Standardiserar kön
var getGender = function(gender) {
	if (gender == 'K' ||
		gender == 'k' ||
		gender == 'kv' ||
		gender == 'Kv') {
		return 'female';
	}
	else if (gender == 'Ma' ||
		gender == 'M' ||
		gender == 'm' ||
		gender == 'ma' ||
		gender == 'Ma') {
		return 'male'
	}
	else {
		return 'unknown';
	}
}

var informantCodes = argv.informantCodes.toString().split(',');
var collectorCodes = argv.collectorCodes.toString().split(',');

var getRelation = function(relation) {
	/*
	c = upptecknare
	i = informant
	recorder = intervjuare
	*/
//	return relation == '1' || relation == '6' ? 'c' : relation == '7' ? 'i' : '';
//	return relation == '7' ? 'c' : relation == '8' ? 'i' : '';
//	return relation == '1' ? 'c' : relation == '7' ? 'i' : '';

	if (informantCodes.indexOf(relation) > -1) {
		return 'i';
	}
	else if (collectorCodes.indexOf(relation) > -1) {
		return 'c';
	}
	else {
		return '';
	}
}

// Skapar person objekt med namn, id, kön och relation
var createPersonObject = function(item) {
	var personName = item['Pers::Namn'] ? (argv.reversePersonName && argv.reversePersonName == 'yes' ? item['Pers::Namn'].split(', ').reverse().join(' ') : item['Pers::Namn']) : 'Okänt';
	personName = personName.split('\n').join('');

	var personObj = {
		id: personIdPrefix+item['Pers::PersId'],
		name: personName,
		gender: getGender(item['Pers::Kön']),
		relation: getRelation(item['AccPers::!Roll'])
	};

	if (item['Pers::Född'] != '') {
		personObj.birth_year = item['Pers::Född'];
	}

	return personObj;
}

// Skapar media obect
var createMediaObject = function(mp3File, mediaTitles, item) {
	var fileName = mp3File.split("\n")[0];
	var fullPath = mp3File.split("\n")[1];

	var mediaId = fileName.split(/file:SK([0-9]+)([A-Z])/g);

	var mediaTitle = _.find(mediaTitles, function(item) {
		var regExString = '\\('+Number(mediaId[1])+' '+mediaId[2]+'[ (I|V]*\\)';
		var regEx = new RegExp(regExString);

		return item.match(regEx);
	}) || item[idField];

	if (item['Titel_Allt'] && item['Titel_Allt'] != '') {
		mediaTitle = item['Titel_Allt'];
	}

	return {
		source: fileName.indexOf('filewin://') > -1 ? fileName.split('/')[fileName.split('/').length-1] : fileName.replace('file:', ''),
		title: mediaTitle,
		type: fileName.toLowerCase().indexOf('.mp3') > -1 ? 'audio' : fileName.toLowerCase().indexOf('.pdf') ? 'pdf' : fileName.toLowerCase().indexOf('.jpg') || fileName.toLowerCase().indexOf('.png') ? 'image' : 'file'
	};
}

// Läser input filen
fs.readFile(argv.input, function(err, fileData) {
	var data = JSON.parse(fileData);

	var processedData = [];

	var lastAcc;
	var workingObject;
	var mediaTitles;

	_.each(data, function(item, index) {
		// Kör igenom varje rad

		// Skapar id om id finns i raden
		var itemId = item[idField] && item[idField] != '' ? item[idField]+(joinIdField ? '_'+item[joinIdField] : '') : null;

		if (itemId) {
			// Om itemId är inte null, då lägger vi nytt objekt till workingObject med grundmetadata
			workingObject = {
				id: idPrefix+itemId,
				title: titlePrefix+item['Titel_Allt'],
				text: item['Titel_Allt'],
				materialtype: materialType,
				year: item['Inl_from'],
				archive: {
					total_pages: item['Form Acc_Alla::Omfång'] || null,
					archive_id: item[archiveIdField || idField]+(uniqueArchiveIdField ? ' ('+item[uniqueArchiveIdField]+')' : ''),
					country: 'sweden',
					archive: staticArchive ? staticArchive : archiveField ? item[archiveField] : null
				}
			};

			if (staticCategories) {
				var categories = staticCategories.split(',');

				workingObject.taxonomy = _.map(categories, function(category) {
					return {
						category: category
					};
				})
			}
			else if (categoryField != undefined && categoryField != '') {
				workingObject.taxonomy = _.map(item[categoryField].split(','), function(category) {
					return {
						category: category
					};
				});
			}

			if (item['Pers::PersId'].length > 0) {
				var personObj = createPersonObject(item);

				if (item['Pers::Född'] != '') {
					personObj.birth_year = item['Pers::Född'];
				}				

				workingObject.persons = [personObj];
			}

			if (item.socken) {
				workingObject.places = [item.socken];
			}

			if (argv.formatMediaTitles == 'yes' || item[mediaField] != '') {
				if (argv.formatMediaTitles == 'yes') {
					mediaTitles = item.Titel_Allt.split('\n \n').join('\n\n').split('\n\n');
				}
				else {
					mediaTitles = [];
				}

				if (!workingObject.metadata) {
					workingObject.metadata = [];
				}

				if (argv.formatMediaTitles == 'yes') {
					workingObject.metadata.push({
						type: 'dialektkarta_titlar',
						value: item.Titel_Allt
					});
				}

				// Om vi har media titles, då sätter vi text till ''
				if (mediaTitles.length > 1) {
					workingObject.text = '';
				}

				workingObject.media = [createMediaObject(item[mediaField], mediaTitles, item)];
			}
		}
		else {
			// Om itemId är null fortsätter vi arbeta med workingObject och lägger till fler socknar, personer eller media till det
			if (item['Pers::PersId'].length > 0) {
				var personObj = createPersonObject(item);

				workingObject.persons.push(personObj);
			}
			if (item.socken) {
				if (!workingObject.places) {
					workingObject.places = [];
				}

				workingObject.places.push(item.socken);
			}

			if (argv.formatMediaTitles == 'yes' || item[mediaField] != '') {
				workingObject.media.push(createMediaObject(item[mediaField], mediaTitles, item));
			}
		}

		if (itemId && itemId != lastAcc) {
			lastAcc = itemId;

			processedData.push(workingObject);
		}
		else {
			if (argv.personNamesAsTitle && argv.personNamesAsTitle == 'yes') {
				var personNames = _.map(argv.personNamesTitleFilter ? _.filter(workingObject.persons, function(person) {
					return person.relation == argv.personNamesTitleFilter;
				}) : workingObject.persons, function(person) {
					return person.name;
				});

				var title = workingObject.title;

				if (personNames.length == 1) {
					title = personNames[0];
				}
				else if (personNames.length == 2) {
					title = personNames[0]+' och '+personNames[1];
				}
				else if (personNames.length > 2) {
					var firstPersons = personNames.slice(0, -1);

					title = firstPersons.join(', ')+' och '+personNames[personNames.length-1];
				}

				workingObject.title = titlePrefix+title;

				if (mediaTitles.length == 1 && workingObject.media &&  workingObject.media.length == 1 && workingObject.media[0].title == '') {
					workingObject.text = mediaTitles[0];
				}
			}
		}
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
});