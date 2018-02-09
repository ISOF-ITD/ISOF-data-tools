var _ = require('underscore');
var elasticsearch = require('elasticsearch');

var TopicModeling = require('./lib/topic-modeling');

if (process.argv.length < 3) {
	console.log('node topicModeling-text.js [input text] [action (stopwords|stemwords|stopwords_stem|topic_modeling)] [num topics] [num terms]');

	return;
}

if (process.argv[3] && process.argv[3] == 'stopwords') {
	console.log(TopicModeling.removeStopwords(process.argv[2]))
}
else if (process.argv[3] && process.argv[3] == 'stemwords') {
	console.log(TopicModeling.stemword(process.argv[2]));
}
else if (process.argv[3] && process.argv[3] == 'stopwords_stem') {
	console.log(TopicModeling.stemword(TopicModeling.removeStopwords(process.argv[2])));
}
else {
	console.log(TopicModeling.createModel(process.argv[2], process.argv[4] || 10, process.argv[5] || 10));
}
