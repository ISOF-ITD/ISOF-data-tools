var fs = require('fs');
var _ = require('underscore');
var levenshtein = require('fast-levenshtein');

var linksData = JSON.parse(fs.readFileSync('input\\matkarta-kokbok-links.json'));
var kokbokData = JSON.parse(fs.readFileSync('input\\kokboken.json'));

var processedData = [];

_.each(kokbokData, function(item) {
	var foundLink = _.filter(linksData, function(link) {
		return levenshtein.get(link.title, item.Titel) < 3;
//		return cleanTitle(link.title) == cleanTitle(item.Titel);
	});

	if (foundLink.length == 0) {
		console.log(item);
	}
	else if (foundLink.length > 1) {
		console.log(foundLink);
	}
	else {
		console.log(item['Länk i Sitevision']+' = '+'http://www.sprakochfolkminnen.se/'+foundLink[0].url);

		item['Länk i Sitevision'] = 'http://www.sprakochfolkminnen.se/'+foundLink[0].url;
	}

	processedData.push(item);
});

fs.writeFile('output\\kokboken-fixed.json', JSON.stringify(processedData, null, 2));