var fs = require('fs');
var _ = require('underscore');
var request = require('request');
var JSDOM = require('jsdom').JSDOM;

if (process.argv.length < 3) {
	console.log('node jsonGetPageText.js --input=[input json] --output=[output json] --urlField=[url field] --destinationField=[destination field for page text] --titleField=[title (for console output only)]');

	return;
}

var argv = require('minimist')(process.argv.slice(2));

var fileData = JSON.parse(fs.readFileSync(argv.input));

var currentItem = 0;

var saveAndQuit = function() {
	if (argv.output) {
		fs.writeFile(argv.output, JSON.stringify(fileData, null, 2));
	}
}

var processItem = function() {
	var item = fileData[currentItem];

	var sitevisionUrl = item[argv.urlField];

//	if (sitevisionUrl.indexOf('kokboken') == -1) {

	request(sitevisionUrl, function(error, response, html) {
		if (argv.titleField) {
			console.log((currentItem+1)+': '+item[argv.titleField]);
		}
		try {
			var dom = new JSDOM(html.split('<p').join('\r\n<p').split('<div').join('\r\n<div').split('<br').join('\r\n<br'))

			var document = dom.window.document;

			var rubrik = document.getElementById('Rubrik');

			if (rubrik) {
				mainElement = rubrik.parentElement.parentElement;

				var short_text = rubrik.parentElement.parentElement.getElementsByTagName('p')[0].textContent;
				var full_text = document.getElementsByClassName('pagecontent')[0].textContent;

				item[argv.destinationField+'_short'] = short_text;
				item[argv.destinationField+'_full'] = full_text;
			}
		}
		catch (e) {
			console.log(e);
		}

		if (fileData.length-1 > currentItem) {
			currentItem++;

			processItem();
		}
		else {
			saveAndQuit();
		}
	});

		/*
	}
	else {
		if (fileData.length-1 > currentItem) {
			currentItem++;

			processItem();
		}
		else {
			saveAndQuit();
		}
	}
	*/
}

processItem();
