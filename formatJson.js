var fs = require('fs');
var path = require('path');
var _ = require('underscore');

if (process.argv.length < 5) {
	console.log('node formatJson.js --input=[input json file] --output=[output json file] --idField --idPrefix --startId --titleField --titleFields --titleFieldsSeparator --titlePrefix --staticTitle --textField --staticText --countryField --staticCountry --yearField --taxonomyField --staticTaxonomy --archiveIdField --archiveField --staticArchive --typeField --staticType --placeField --placeIdField --informantNameField --informantNameFields --informantIdField --informantGenderField --informantBirthYearField --collectorNameField --collectorNameFields --collectorIdField --collectorGenderField --collectorBirthYearField --personIdPrefix --personNameFieldsSeparator --mediaSourceField --mediaSourcePrefix --mediaSourceSuffix --mediaTypeField --staticMediaType --trace=[true|false] --metadataFields=[metadata_type:value_field,metadata_type:value_field,...]');

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
var startId = argv.startId;
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
var staticTaxonomy = argv.staticTaxonomy;

var archiveIdField = argv.archiveIdField;
var archiveField = argv.archiveField;
var staticArchive = argv.staticArchive;

var countryField = argv.countryField;
var staticCountry = argv.staticCountry;

var typeField = argv.typeField;
var staticType = argv.staticType;

var metadataFields = argv.metadataFields;

var placeField = argv.placeField;
var placeIdField = argv.placeIdField;

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

var formatGender = function(gender) {
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

fs.readFile(argv.input, function(err, fileData) {
	console.log('Formating '+argv.input);

	var data = JSON.parse(fileData);

	var processedData = [];

	var currentId = startId ? Number(startId) : null;

	_.each(data, function(item, index) {
		var workingObject = {};

		if (idField && item[idField]) {
			workingObject.id = (idPrefix || '')+item[idField];
		}
		else if (startId) {
			workingObject.id = (idPrefix || '')+currentId;

			currentId++;
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
				workingObject.title = (titlePrefix ? titlePrefix : '')+(staticTitle || item[titleField]);
			}
		}

		if (textField || staticText) {
			workingObject.text = staticText || item[textField];
		}

		if (yearField) {
			workingObject.year = validateDate(item[yearField]);
		}

		if (staticTaxonomy) {
			var taxonomyItems = staticTaxonomy.split(',');

			workingObject.taxonomy = _.map(taxonomyItems, function(taxonomy) {
				return {
					category: taxonomy
				}
			});
		}
		if (taxonomyField) {
			if (!workingObject.taxonomy) {
				workingObject.taxonomy = [];
			}

			workingObject.taxonomy = workingObject.taxonomy.concat([{
				category: item[taxonomyField]
			}]);
		}

		var archiveObject = {
			country: 'sweden'
		};

		if (archiveField || archiveIdField || staticArchive || countryField || staticCountry) {

			if (archiveField || staticArchive) {
				archiveObject.archive = staticArchive ? staticArchive : item[archiveField];
			}

			if (countryField || staticCountry) {
				archiveObject.country = staticCountry ? staticCountry : item[countryField];
			}
			else {
				archiveObject.country = 'sweden';
			}

			if (archiveIdField) {
				archiveObject.archive_id = item[archiveIdField];
			}
		}

		workingObject.archive = archiveObject;

		if (typeField || staticType) {
			workingObject.materialtype = staticType || item[typeField];
		}

		if (placeIdField) {
			var placeIds = item[placeIdField].split(',');

			workingObject.places = _.map(placeIds, function(placeId) {
				return {
					id: placeId
				};
			});
		}
		else if (placeField && item[placeField]) {
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
					personObject.gender = formatGender(item[personGenderField]);
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

		if (metadataFields) {
			workingObject.metadata = [];
			var metadataFieldStrs = metadataFields.split(',');

			_.each(metadataFieldStrs, function(metadataFieldStr) {
				var metadataFieldObj = metadataFieldStr.split(':');

				workingObject.metadata.push({
					type: metadataFieldObj[0],
					value: item[metadataFieldObj[1]]
				});
			});
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