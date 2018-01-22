var fs = require('fs');
var _ = require('underscore');

if (process.argv.length < 5) {
	console.log('node formatWebbfragolist.js --idField=[id field] --archiveIdField=[archive id field] --archive=[archive] --questionColumns=[question column number] --input=[input json file] --output=[output json file] --materialType=[materialType] --startId=[start id] --idPrefix=[id prefix] --personIdField=[person id field] --personStartId=[person start id] --personIdPrefix=[person id prefix]');

	return;
}

var argv = require('minimist')(process.argv.slice(2));

var idField = argv.idField;
var idPrefix = argv.idPrefix || '';
var startId = argv.startId;

var archiveIdField = argv.archiveIdField || '';

var personIdField = argv.personIdField;
var personIdPrefix = argv.personIdPrefix || '';
var personStartId = argv.personStartId;

var questionColumns = argv.questionColumns;

var archive = argv.archive;
var materialType = argv.materialType || '';

var getGender = function(gender) {
	gender = gender.toLowerCase();
	if (
		gender == 'kvinna' ||
		gender == 'kvinne' ||
		gender == 'tjej' ||
		gender == 'kvinns'
	) {
		return 'female';
	}
	else if (
		gender == 'man' ||
		gender == 'M' ||
		gender == 'm' ||
		gender == 'ma' ||
		gender == 'Ma'
	) {
		return 'male'
	}
	else {
		return 'unknown';
	}
}

fs.readFile(argv.input, function(err, fileData) {
	var data = JSON.parse(fileData);

	var processedData = [];

	var currentId = Number(startId);
	var currentPersonId = Number(personStartId);

	_.each(data, function(item, index) {
		var id = idPrefix+(startId ? currentId : item[idField]);

		var questionColumnsIndexes = String(questionColumns).split(',');

		var objectKeys = Object.keys(data[0]);

		var textContent = _.map(questionColumnsIndexes, function(index, mapIndex) {
			return (mapIndex+1)+': '+item[objectKeys[index]];
		}).join('<br/>');

		var questions = _.map(questionColumnsIndexes, function(index, mapIndex) {
			return (mapIndex+1)+': '+objectKeys[index];
		}).join('<br/>');

		var workingObject = {
			id: id,
			title: item['Titel'],
			text: textContent,
			materialtype: materialType,
			year: item['Datum'].split(' ')[0],
			metadata: [
				{
					type: 'questions',
					value: questions
				}
			],
			archive: {
				archive_id: item[archiveIdField || idField] || null,
				country: 'sweden',
				archive: argv.archive || null
			}
		};

		if (item['Kategori'] && item['Kategori'] != '') {
			workingObject.taxonomy = [
				{
					category: item['Kategori']
				}
			];
		}

		var personId = personIdPrefix+(personStartId ? currentPersonId : item[personIdField]);

		var personObj = {
			id: personId,
			name: item['Man/kvinna/annat']+' född '+item['Födelseår (ÅÅÅÅ)'],
			gender: getGender(item['Man/kvinna/annat']),
			birth_year: item['Födelseår (ÅÅÅÅ)'],
			relation: 'i'
		};

		workingObject.persons = [personObj];
/*
		if (item.socken) {
			workingObject.places = [item.socken];
		}
*/
		processedData.push(workingObject);

		if (startId) {
			currentId++;
		}

		if (personStartId) {
			currentPersonId++;
		}
	});

	fs.writeFile(argv.output, JSON.stringify(processedData, null, 2), function(error) {
		if (error) {
			console.log(error);
		}
		else {
			console.log('Done!');
			console.log(argv.input+' formatted and written to '+argv.output);
		}
	});

});