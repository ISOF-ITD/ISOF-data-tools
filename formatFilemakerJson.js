var fs = require('fs');
var _ = require('underscore');

if (process.argv.length < 5) {
	console.log('node formatFilemakerJson.js --idField=[id field] --joinIdField=[id field to append to main id]--archiveIdField=[archive id field] --input=[input json file] --output=[output json file] --materialType=[materialType] --categoryIdField=[categoryIdField] --categoryNameField=[categoryNameField] --idPrefix=[id prefix] --reversePersonName=[yes|no] --personIdPrefix=[person id prefix] --personNamesAsTitle=[yes|no] --personNamesTitleFilter=[c|i] --titlePrefix=[title prefix] --formatMediaTitles=[yes|no] --mediaField=[media field]');

	return;
}

var argv = require('minimist')(process.argv.slice(2));

var idField = argv.idField;
var joinIdField = argv.joinIdField;
var archiveIdField = argv.archiveIdField;
var idPrefix = argv.idPrefix || '';
var categoryIdField = argv.categoryIdField;
var categoryNameField = argv.categoryNameField;
var materialType = argv.materialType;
var mediaField = argv.mediaField;
var personIdPrefix = argv.personIdPrefix || '';
var titlePrefix = argv.titlePrefix || '';

var getGender = function(gender) {
	if (gender == 'K' ||
		gender == 'k' ||
		gender == 'kv' ||
		gender == 'Kv') {
		return 'k';
	}
	else if (gender == 'Ma' ||
		gender == 'M' ||
		gender == 'm' ||
		gender == 'ma' ||
		gender == 'Ma') {
		return 'm'
	}
	else {
		return 'unknown';
	}
}

var getRelation = function(relation) {
	/*
	c = upptecknare
	i = informant
	recorder = intervjuare
	*/
	return relation == '1' || relation == '6' || relation == '8' ? 'c' : relation == '7' ? 'i' : '';
}

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

var createMediaObject = function(mp3File, mediaTitles, item) {
	var fileName = mp3File.split("\n")[0];
	var fullPath = mp3File.split("\n")[1];

	var mediaId = fileName.split(/file:SK([0-9]+)([A-Z])/g);
console.log(item)
	var mediaTitle = _.find(mediaTitles, function(item) {
		var regExString = '\\('+Number(mediaId[1])+' '+mediaId[2]+'[ (I|V]*\\)';
		var regEx = new RegExp(regExString);

		return item.match(regEx);
	}) || item[idField];

	return {
		source: fileName.indexOf('filewin://') > -1 ? fileName.split('/')[fileName.split('/').length-1] : fileName.replace('file:', ''),
		title: mediaTitle,
		type: fileName.toLowerCase().indexOf('.mp3') > -1 ? 'audio' : fileName.toLowerCase().indexOf('.pdf') ? 'pdf' : fileName.toLowerCase().indexOf('.jpg') || fileName.toLowerCase().indexOf('.png') ? 'image' : 'file'
	};
}

fs.readFile(argv.input, function(err, fileData) {
	var data = JSON.parse(fileData);

	var processedData = [];

	var lastAcc;
	var workingObject;
	var mediaTitles;

	_.each(data, function(item, index) {
		var itemId = item[idField] && item[idField] != '' ? item[idField]+(joinIdField ? '_'+item[joinIdField] : '') : null;

		if (itemId) {
			workingObject = {
				id: idPrefix+itemId,
				title: titlePrefix+item['Titel_Allt'],
				text: item['Titel_Allt'],
				materialtype: materialType,
				year: item['Inl_from'],
				archive: {
					total_pages: item['Form Acc_Alla::Omfång'] || null,
					archive_id: item[archiveIdField || idField],
					country: 'sweden',
					archive: 'DFU'
				}
			};

			if (categoryIdField != undefined && categoryIdField != '' && categoryNameField != undefined && categoryNameField != '') {
				workingObject.taxonomy = [
					{
						category: item[categoryIdField],
						name: item[categoryNameField]
					}
				];
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

			if (argv.formatMediaTitles == 'yes' && item[mediaField] != '') {
				mediaTitles = item.Titel_Allt.split('\n \n').join('\n\n').split('\n\n');

				if (!workingObject.metadata) {
					workingObject.metadata = [];
				}

				workingObject.metadata.push({
					type: 'dialektkarta_titlar',
					value: item.Titel_Allt
				});

				// Om vi har media titles, då sätter vi text till ''
				if (mediaTitles.length > 1) {
					workingObject.text = '';
				}

				workingObject.media = [createMediaObject(item[mediaField], mediaTitles, item)];
			}
		}
		else {
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

			if (argv.formatMediaTitles == 'yes' && item[mediaField] != '') {
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

				if (mediaTitles.length == 1 && workingObject.media.length == 1 && workingObject.media[0].title == '') {
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