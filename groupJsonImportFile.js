var fs = require('fs');
var _ = require('underscore');

if (process.argv.length < 4) {
	console.log('node groupJsonImportFile.js --input=[input json file] --output=[output json file] --groupByDate=[yes|no] --groupByPlaces=[yes|no] --groupByPersons=[(role(c|i|...))|yes]');

	return;
}

var argv = require('minimist')(process.argv.slice(2));

fs.readFile(argv.input, function(err, fileData) {
	var data = JSON.parse(fileData);

	var processedData = [];

	if (!argv.groupByDate && !argv.groupByPersons && !argv.groupByPlaces) {
		console.log('Nothing to group by.');

		return;
	}

	_.each(data, function(item) {
		if (!item.found) {
			var matchingItems = _.filter(data, function(filterItem) {
				var doesMatch = argv.groupByDate == 'yes' ? filterItem.year == item.year : false && !filterItem.found;

				if (argv.groupByPersons == 'yes') {
					var itemPersons = _.uniq(item.persons.map(function(person){
						return person.id+' '+person.relation;
					})).sort();

					var filterItemPersons = _.uniq(filterItem.persons.map(function(person){
						return person.id+' '+person.relation;
					})).sort();

					doesMatch = doesMatch && itemPersons.join(',') == filterItemPersons.join(',');
				}

				if (argv.groupByPlaces == 'yes') {
					var itemPlaces = _.uniq(item.persons.map(function(place){
						return place.id;
					})).sort();

					var filterItemPlaces = _.uniq(filterItem.persons.map(function(place){
						return place.id;
					})).sort();

					doesMatch = doesMatch && itemPlaces.join(',') == filterItemPlaces.join(',');
				}

				if (doesMatch) {
					filterItem.found = true;
				}

				return doesMatch;
			});

			var clone = JSON.parse(JSON.stringify(item));

			var itemText = [];

			if (item.text && item.text != '') {
				itemText.push(item.text);
			}

			var archive_ids = [];
			if (item.archive && item.archive.archive_id && item.archive.archive_id != '') {
				archive_ids.push(item.archive.archive_id);
			}

			var persons = item.persons || [];

			_.each(matchingItems, function(matchItem) {
				if (matchItem.text && matchItem.text != '' && matchItem.text != item.text) {
					itemText.push(matchItem.text);
				}
				if (matchItem.archive && matchItem.archive.archive_id && matchItem.archive.archive_id != '') {
					archive_ids.push(matchItem.archive.archive_id);
				}
				if (matchItem.persons && matchItem.persons.length > 0) {
					persons = persons.concat(matchItem.persons);
				}
				if (matchItem.media && matchItem.media.length > 0) {
					if (!clone.media) {
						clone.media = [];
					}

					clone.media = clone.media.concat(matchItem.media);
				}
				if (matchItem.metadata && matchItem.metadata.length > 0) {
					if (!clone.metadata) {
						clone.metadata = [];
					}

					clone.metadata = clone.metadata.concat(matchItem.metadata);
				}
			});

			clone.media = _.uniq(clone.media, function(media) {
				return media.source;
			});

			clone.metadata = _.uniq(clone.metadata, function(metadata) {
				return metadata.type+', '+metadata.value;
			});

			if (itemText.length > 0) {
				clone.text = itemText.join('\n\n');
			}
			if (archive_ids.length > 0) {
				clone.archive.archive_id = _.uniq(archive_ids).join(', ');
			}

			persons = _.uniq(persons, function(person) {
				return person.relation+' '+person.id;
			});

			clone.persons = persons;

			if (clone.found) {
				delete clone.found;
			}

			processedData.push(clone);
		}
	});

	fs.writeFile(argv.output, JSON.stringify(processedData, null, 2), function(error) {
		if (error) {
			console.log(error);
		}
		else {
			console.log('Done!');
			console.log(argv.input+' grouped, '+processedData.length+' entries written to '+argv.output);
		}
	});
});