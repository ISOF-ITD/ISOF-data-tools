var mysql = require('mysql');
var _ = require('underscore');

var Matilda = require('./lib/Matilda');
var stopword = require('stopword');
var snowball = require('node-snowball');

out = function(obj) {
	console.log(JSON.stringify(obj, null, 2));
}

var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'svenska_sagor'
});

connection.connect();

//var query = 'SELECT id, text FROM records WHERE type = "arkiv" OR type = "tryckt" LIMIT 0, 1';
var query = 'SELECT id, text FROM records WHERE id < 6';

connection.query(query, function(error, results) {
	var m = new Matilda.Model();

	_.each(results, function(item) {
		m.addDocument(snowball.stemword(stopword.removeStopwords(item.text.split(' '), stopword.sv), 'swedish'));
	});

	m.setNumberOfTopics(5);
	m.train(5, function(modelData){ 
//		out(modelData.vocab);
//		out(modelData.topics);
//		out(modelData.documents);
	});

	connection.end();

	out(m.getWordsByTopics()[0]);
});
