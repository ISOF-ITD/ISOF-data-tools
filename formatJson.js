var fs = require('fs');
var path = require('path');
var _ = require('underscore');

if (process.argv.length < 5) {
	console.log('node formatJson.js --input=[input json file] --output=[output json file] --idField --idPrefix --titleField --titleFields --titleFieldsSeparator --titlePrefix --staticTitle --textField --staticText --yearField --taxonomyField --archiveIdField --archiveField --staticArchive --typeField --staticType --placeField --informantNameField --informantNameFields --informantIdField --informantGenderField --informantBirthYearField --collectorNameField --collectorNameFields --collectorIdField --collectorGenderField --collectorBirthYearField --personIdPrefix --personNameFieldsSeparator --mediaSourceField --mediaSourcePrefix --mediaSourceSuffix --mediaTypeField --staticMediaType --trace=[true|false]');

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

var idField = argv.idField;
var idPrefix = argv.idPrefix;

var titleField = argv.titleField;
var titleFields = argv.titleFields;
var titleFieldsSeparator = argv.titleFieldsSeparator;
var titlePrefix = argv.titlePrefix;
var staticTitle = argv.staticTitle;

var textField = argv.textField;
var staticText = argv.staticText;

var yearField = argv.yearField;
var taxonomyField = argv.taxonomyField;

var archiveIdField = argv.archiveIdField;
var archiveField = argv.archiveField;
var staticArchive = argv.staticArchive;

var typeField = argv.typeField;
var staticType = argv.staticType;

var placeField = argv.placeField;

var informantNameField = argv.informantNameField;
var informantNameArrayField = argv.informantNameArrayField;
var informantNameFields = argv.informantNameFields;
var informantIdField = argv.informantIdField;
var informantIdArrayField = argv.informantIdArrayField;
var informantGenderField = argv.informantGenderField;
var informantBirthYearField = argv.informantBirthYearField;

var collectorNameField = argv.collectorNameField;
var collectorNameArrayField = argv.collectorNameArrayField;
var collectorNameFields = argv.collectorNameFields;
var collectorIdField = argv.collectorIdField;
var collectorIdArrayField = argv.collectorIdArrayField;
var collectorGenderField = argv.collectorGenderField;
var collectorBirthYearField = argv.collectorBirthYearField;

var personIdPrefix = argv.personIdPrefix;
var personNameFieldsSeparator = argv.personNameFieldsSeparator;

var mediaSourceField = argv.mediaSourceField;
var mediaSourcePrefix = argv.mediaSourcePrefix;
var mediaSourceSuffix = argv.mediaSourceSuffix;
var mediaTypeField = argv.mediaTypeField;
var staticMediaType = argv.staticMediaType;
var mediaTitleField = argv.mediaTitleField;
var staticMediaTitle = argv.staticMediaTitle;

fs.readFile(argv.input, function(err, fileData) {
	var data = JSON.parse(fileData);

	var processedData = [];

	_.each(data, function(item, index) {
		var workingObject = {};

		if (idField && item[idField]) {
			workingObject.id = (idPrefix || '')+item[idField];
		}

		if (titleField || titleFields || staticTitle) {
			if (titleFields) {
				var fields = titleFields.split(';');

				var fieldValues = _.map(fields, function(field) {
					return item[field];
				});

				workingObject.title = (titlePrefix || '')+fieldValues.join(titleFieldsSeparator || ' ');
			}
			else if (titleField || staticTitle) {
				workingObject.title = (titlePrefix || '')+staticTitle || item[titleField];
			}
		}

		if (textField || staticText) {
			workingObject.text = staticText || item[textField];
		}

		if (yearField) {
			workingObject.year = validateDate(item[yearField]);
		}

		if (taxonomyField) {
			workingObject.taxonomy = [{
				category: item[taxonomyField]
			}];
		}

		if (archiveField || archiveIdField || staticArchive) {
			var archiveObject = {};

			if (archiveField || staticArchive) {
				archiveObject.archive = staticArchive ? staticArchive : item[archiveField];
			}

			if (archiveIdField) {
				archiveObject.archive = item[archiveIdField];
			}

			workingObject.archive = archiveObject;
		}

		if (typeField || staticType) {
			workingObject.materialtype = staticType || item[typeField];
		}

		if (placeField && item[placeField]) {
			workingObject.places = [item[placeField]];
		}

		workingObject.persons = [];

		if ((informantIdArrayField && informantNameArrayField) || (collectorIdArrayField && collectorNameArrayField)) {
			var createPersonObjects = function(idArrayField, nameArrayField, personRelation) {
				var ids = item[idArrayField].split(', ').join(',').split(',');
				var names = item[nameArrayField].split(', ').join(',').split(',');

				return _.map(ids, function(personId, index) {
					return {
						id: personId,
						name: names[index],
						relation: personRelation
					};
				})
			};


			if (informantIdArrayField) {
				workingObject.persons = workingObject.persons.concat(createPersonObjects(informantIdArrayField, informantNameArrayField, 'i'));
			}

			if (collectorIdArrayField) {
				workingObject.persons = workingObject.persons.concat(createPersonObjects(collectorIdArrayField, collectorNameArrayField, 'c'));
			}
		}

		if (informantIdField || collectorIdField) {
			var createPersonObject = function(personIdField, personGenderField, personNameField, personNameFields, personBirthYearField, personRelation) {
				var personObject = {
					id: (personIdPrefix || '')+item[personIdField],
					relation: personRelation
				};

				if (personNameField || personNameFields) {
					if (personNameFields) {
						var fields = personNameFields.split(';');

						var fieldValues = _.map(fields, function(field) {
							return item[field];
						});

						personObject.name = fieldValues.join(personNameFieldsSeparator || ' ');
					}
					else {
						personObject.name = item[personNameField];
					}
				}

				if (personGenderField) {
					personObject.gender = item[personGenderField];
				}

				if (personBirthYearField) {
					personObject.birth_year = item[personBirthYearField];
				}

				return personObject;
			};

			if (informantIdField) {
				workingObject.persons.push(createPersonObject(informantIdField, informantGenderField, informantNameField, informantNameFields, informantBirthYearField, 'i'));
			}

			if (collectorIdField) {
				workingObject.persons.push(createPersonObject(collectorIdField, collectorGenderField, collectorNameField, collectorNameFields, collectorBirthYearField, 'c'));
			}
		}

		if (mediaSourceField) {
			var mediaObject = {
				source: (mediaSourcePrefix || '')+item[mediaSourceField]+(mediaSourceSuffix || '')
			};

			if (mediaTypeField || staticMediaType) {
				mediaObject.type = staticMediaType || item[mediaTypeField];
			}

			if (mediaTitleField || staticMediaTitle) {
				if (mediaTitleField.substr(0, 10) == 'PROCESSED:') {
					mediaObject.title = workingObject[mediaTitleField.replace('PROCESSED:', '')];
				}
				else {
					mediaObject.title = staticMediaTitle || item[mediaTitleField]
				}
			}

			workingObject.media = [mediaObject];
		}

		if (argv.trace && argv.trace == 'true') {
			console.log(JSON.stringify(workingObject, null, 2));
		}

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
});