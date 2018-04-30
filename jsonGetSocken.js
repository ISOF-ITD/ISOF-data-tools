var mysql = require('mysql');
var _ = require('underscore');
var fs = require('fs');
var levenshtein = require('fast-levenshtein');
var fetch = require('node-fetch');

var config = require('./config')

if (process.argv.length < 4) {
	console.log('node jsonInsertSockenID.js --input=[input json file] --output=[output json file] --landskap_field=[landskap field] --socken_field[socken field] --socken_id_field=[socken_id field] --report=[write not-found report (yes|no)] --useMySql=[yes|no');

	return;
}

var argv = require('minimist')(process.argv.slice(2));

var landskapField = argv.landskap_field;
var sockenField = argv.socken_field;

if (argv.useMySql) {
	var connection = mysql.createConnection({
		host: config.host,
		user: config.user,
		password: config.password,
		database: config.database
	});

	connection.connect();
}
else {
	var apiUrl = 'http://frigg-test.sprakochfolkminnen.se/sagendatabas/api/locations';
}

fs.readFile(argv.input, 'utf-8', function(error, fileData) {
	var jsonIndex = 0;

	var fileJson = JSON.parse(fileData);

	var notFound = [];

	function finish() {
		fs.writeFile(argv.output, JSON.stringify(fileJson, null, 2), function(error) {
			if (error) {
				console.log(error);
			}
			else {
				console.log('Done!');
				console.log(argv.output+' populated with socken IDs');

				notFound = _.uniq(notFound);

				if (argv.report && argv.report == 'yes') {
					fs.writeFile(argv.input+'-not-found.csv', notFound.join("\n"));
				}
			}
		});
	}

	function processItem() {
		var item = fileJson[jsonIndex];

		if (argv.useMySql) {
			/*
			Använd mysql databas, sök i socken och harad tabeller
			*/

			var query;
			if (argv.socken_id_field && argv.socken_id_field != '') {
				var searchSockenId = item[argv.socken_id_field];
				query = 'SELECT socken.id, socken.name, socken.lmId, socken.harad harad_id, harad.lan, harad.landskap, harad.name harad_name, socken.lat, socken.lng FROM socken INNER JOIN harad ON socken.harad = harad.id WHERE socken.socken_id = "'+searchSockenId+'"';
			}
			else {
				var searchSocken = item[sockenField].replace(' sn', '').replace(' Sn', '')
					.replace(' socken', '')
					.replace(' St.', ' stad')
					.replace('\n', '');

				if (
					searchSocken.toLowerCase().indexOf(', södra') > -1 || 
					searchSocken.toLowerCase().indexOf(', norra') > -1 ||
					searchSocken.toLowerCase().indexOf(', östra') > -1 ||
					searchSocken.toLowerCase().indexOf(', västra') > -1 || 
					searchSocken.toLowerCase().indexOf(', stora') > -1 ||
					searchSocken.toLowerCase().indexOf(', lilla') > -1
				) {
					searchSocken = searchSocken.split(', ').reverse().join(' ')
				}

				searchSocken = searchSocken.toLowerCase();

				var searchLandskap = item[landskapField].replace(' län', '').replace('län', '').toLowerCase();

				query = 'SELECT socken.id, socken.name, socken.lmId, socken.harad harad_id, harad.lan, harad.landskap, harad.name harad_name, socken.lat, socken.lng FROM socken INNER JOIN harad ON socken.harad = harad.id WHERE socken.name COLLATE UTF8_GENERAL_CI LIKE "%'+searchSocken+'%" AND (harad.lan COLLATE UTF8_GENERAL_CI LIKE "%'+searchLandskap+'%" OR harad.landskap COLLATE UTF8_GENERAL_CI LIKE "%'+searchLandskap+'%")';
			}

			console.log((jsonIndex+1)+': '+searchSocken+', '+searchLandskap);

			connection.query(query, function(error, results) {
				if (error) {
					console.log(error);
				}

				var foundSocken;
				if (results.length == 1) {
					foundSocken = results[0];
				}
				else {
					_.each(results, function(result) {
						if (levenshtein.get(item[sockenField], result.name.replace(' sn', '').replace(' stad', ''), { useCollator: true}) < 5) {
							foundSocken = result;
						}
					});
				}

				if (foundSocken) {
					console.log('Found: '+foundSocken.name+', '+foundSocken.lan);

					item.socken = {
						id: foundSocken.id,
						name: foundSocken.name,
						location: {
							lat: foundSocken.lat,
							lon: foundSocken.lng
						},
						harad: foundSocken.harad_name,
						harad_id: foundSocken.harad_id,
						landskap: foundSocken.landskap,
						county: foundSocken.lan,
						lm_id: foundSocken.lmId
					};
				}

				if (results.length == 0 || !foundSocken) {
					console.log('Not found: '+item[sockenField]+', '+item[landskapField]);

					notFound.push('"'+item[sockenField]+'","'+item[landskapField]+'","'+results.length+'"');
				}

				if (jsonIndex < fileJson.length-1) {
					jsonIndex++;

					processItem();

				}
				else {
					connection.end();

					finish();
				}
			});
		}
		else {
			/*
			Använd /locations api
			http://frigg-test.sprakochfolkminnen.se/sagendatabas/api/locations/?socken_name=asar&landskap_name=blekinge
			*/

			var params;
			if (argv.socken_id_field && argv.socken_id_field != '') {
				var searchSockenId = item[argv.socken_id_field];
				query = 'SELECT socken.id, socken.name, socken.lmId, socken.harad harad_id, harad.lan, harad.landskap, harad.name harad_name, socken.lat, socken.lng FROM socken INNER JOIN harad ON socken.harad = harad.id WHERE socken.socken_id = "'+searchSockenId+'"';
			}
			else {
				var searchSocken = item[sockenField].replace(' sn', '').replace(' Sn', '')
					.replace(' socken', '')
					.replace(' St.', ' stad')
					.replace('\n', '');

				if (
					searchSocken.toLowerCase().indexOf(', södra') > -1 || 
					searchSocken.toLowerCase().indexOf(', norra') > -1 ||
					searchSocken.toLowerCase().indexOf(', östra') > -1 ||
					searchSocken.toLowerCase().indexOf(', västra') > -1 || 
					searchSocken.toLowerCase().indexOf(', stora') > -1 ||
					searchSocken.toLowerCase().indexOf(', lilla') > -1
				) {
					searchSocken = searchSocken.split(', ').reverse().join(' ')
				}

				searchSocken = searchSocken.toLowerCase();

				var searchLandskap = item[landskapField].replace(' län', '').replace('län', '').toLowerCase();

				params = '?socken_name='+searchSocken+'&landskap_name='+searchLandskap;
			}

			console.log((jsonIndex+1)+': '+searchSocken+', '+searchLandskap);

			fetch(apiUrl+params)
				.then(function(response) {
					return response.json();
				})
				.then(function(json) {
					var foundSocken;

					if (json.results.length == 1) {
						foundSocken = json.results[0];
					}
					else {
						_.each(json.results, function(result) {
							if (levenshtein.get(item[sockenField], result.name.replace(' sn', '').replace(' stad', ''), { useCollator: true}) < 5) {
								foundSocken = json.result;
							}
						});
					}

					if (foundSocken) {
						console.log('Found: '+foundSocken.name+', '+foundSocken.landskap);

						item.socken = foundSocken;
					}

					if (json.results.length == 0 || !foundSocken) {
						console.log('Not found: '+item[sockenField]+', '+item[landskapField]);

						notFound.push('"'+item[sockenField]+'","'+item[landskapField]+'","'+json.results.length+'"');
					}

					if (jsonIndex < fileJson.length-1) {
						jsonIndex++;

						processItem();

					}
					else {
						finish();
					}
				})
				.catch(function(error) {
					console.log(error);
				});

			return;

			connection.query(query, function(error, results) {
				if (error) {
					console.log(error);
				}

				var foundSocken;
				if (results.length == 1) {
					foundSocken = results[0];
				}
				else {
					_.each(results, function(result) {
						if (levenshtein.get(item[sockenField], result.name.replace(' sn', '').replace(' stad', ''), { useCollator: true}) < 5) {
							foundSocken = result;
						}
					});
				}

				if (foundSocken) {
					console.log('Found: '+foundSocken.name+', '+foundSocken.lan);

					item.socken = {
						id: foundSocken.id,
						name: foundSocken.name,
						location: {
							lat: foundSocken.lat,
							lon: foundSocken.lng
						},
						harad: foundSocken.harad_name,
						harad_id: foundSocken.harad_id,
						landskap: foundSocken.landskap,
						county: foundSocken.lan,
						lm_id: foundSocken.lmId
					};
				}

				if (results.length == 0 || !foundSocken) {
					console.log('Not found: '+item[sockenField]+', '+item[landskapField]);

					notFound.push('"'+item[sockenField]+'","'+item[landskapField]+'","'+results.length+'"');
				}

				if (jsonIndex < fileJson.length-1) {
					jsonIndex++;

					processItem();

				}
				else {
					connection.end();

					finish();
				}
			});
		}
	}

	processItem();
});