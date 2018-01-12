var fs = require('fs');
var _ = require('underscore');

if (process.argv.length < 5) {
	console.log('node formatFilemakerJson.js --idField=[id field] --archiveIdField=[archive id field] --input=[input json file] --output=[output json file] --materialType=[materialType] --categoryIdField=[categoryIdField] --categoryNameField=[categoryNameField] --idPrefix=[id prefix] --reversePersonName=[true|false]');

	return;
}

var argv = require('minimist')(process.argv.slice(2));

var idField = argv.idField;
var archiveIdField = argv.archiveIdField;
var idPrefix = argv.idPrefix || '';
var categoryIdField = argv.categoryIdField;
var categoryNameField = argv.categoryNameField;
var materialType = argv.materialType;

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

var getRelation = function(relation) {
	return relation == '1' ? 'c' : relation == '7' ? 'i' : '';
}

fs.readFile(argv.input, function(err, fileData) {
	var data = JSON.parse(fileData);

	var processedData = [];

	var lastAcc;
	var workingObject;
	var mediaTitles;

	_.each(data, function(item, index) {
		if (item[idField] && item[idField] != '') {
/*
			item.media = [];
			if (getFileAddress(item['Lank::SökvägMP3'])) {
				item.media.push(getFileAddress(item['Lank::SökvägMP3']));
			}
*/
			workingObject = {
				id: idPrefix+item[idField],
				title: item['Titel_Allt'],
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
				var personObj = {
					id: item['Pers::PersId'],
					name: item['Pers::Namn'] ? (argv.reversePersonName ? item['Pers::Namn'].split(', ').reverse().join(' ') : item['Pers::Namn']) : 'Okänt',
					gender: getGender(item['Pers::Kön']),
					relation: getRelation(item['AccPers::!Roll'])
				};

				if (item['Pers::Född'] != '') {
					personObj.birth_year = item['Pers::Född'];
				}				

				workingObject.persons = [personObj];
			}

			if (item.socken) {
				workingObject.places = [item.socken];
			}
		}
		else {
/*
			if (item['Lank::SökvägMP3'] != '' && getFileAddress(item['Lank::SökvägMP3'])) {
				var fileAddresses = getFileAddress(item['Lank::SökvägMP3']).split('\n');
				workingObject.media = fileAddresses;
			}
*/
			if (item['Pers::PersId'].length > 0) {
				var personObj = {
					id: item['Pers::PersId'],
					name: item['Pers::Namn'] || 'Okänt',
					gender: getGender(item['Pers::Kön']),
					relation: getRelation(item['AccPers::!Roll'])
				};

				if (item['Pers::Född'] != '') {
					personObj.birth_year = item['Pers::Född'];
				}				

				workingObject.persons.push(personObj);
			}
			if (item.socken) {
				if (!workingObject.places) {
					workingObject.places = [];
				}

				workingObject.places.push(item.socken);
			}
		}

		if (item[idField] && item[idField] != lastAcc) {
			lastAcc = item[idField];

			processedData.push(workingObject);
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