var _ = require('underscore');
var elasticsearch = require('elasticsearch');

var lda = require('lda');
var stopword = require('stopword');
var snowball = require('node-snowball');

if (process.argv.length < 5) {
	console.log('node topicModeling.js [index name] [host] [login]');

	return;
}

var esHost = 'https://'+(process.argv[4] ? process.argv[4]+'@' : '')+(process.argv[3] || 'localhost:9200');

console.log(esHost);

var client = new elasticsearch.Client({
	host: esHost,
//	log: 'trace'
});

var pageSize = 100;

function createModels() {
	client.search({
		index: process.argv[2] || 'sagenkarta',
		body: {
			'query': {
				'bool': {
					'must': [
						{
							'exists': {
								'field': 'text'
							}
						}
					],
					'must_not': [
						{
							'nested': {
								'path': 'topics',
								'query': {
									'query_string': {
										'query': '*'
									}
								}
							}
						}
					]
				}
			}
		},
		size: pageSize
	}, function(error, response) {
		var bulkBody = [];

		_.each(response.hits.hits, function(hit) {
			console.log(hit._id);
			if (hit._source.text || hit._source.title) {			
				var docText = snowball.stemword(stopword.removeStopwords(hit._source.text.split('<br />').join(' ').split('/n').join(' ').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,'').split(' '), stopword.sv), 'swedish');
				var result = lda(docText, 10, 10, ['sv']);

				if (hit._source.title) {				
					var docTtitle = snowball.stemword(stopword.removeStopwords(hit._source.title.split('<br />').join(' ').split('/n').join(' ').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,'').split(' '), stopword.sv), 'swedish');
					var titleResult = lda(docTtitle, 10, 10, ['sv']);
				}

				console.log(hit._source.title);

				bulkBody.push({
					update: {
						_index: process.argv[2] || 'sagenkarta',
						_type: 'legend',
						_id: hit._id
					}
				});

				bulkBody.push({
					doc: {
						topics: _.map(result, function(item) {
							return {
								terms: item
							};
						}),
						topics_graph: _.uniq(_.flatten(_.map(result, function(item) {
							var terms = _.map(item, function(term) {
								return term.term;
							});

							return terms;
						}))),
						topics_graph_all: _.map(result, function(item) {
							var terms = _.map(item, function(term) {
								return term.term;
							});

							return terms;
						}),
						title_topics: titleResult ? _.map(titleResult, function(item) {
							return {
								terms: item
							};
						}) : [],
						title_topics_graph: titleResult ? _.uniq(_.flatten(_.map(titleResult, function(item) {
							var terms = _.map(item, function(term) {
								return term.term;
							});

							return terms;
						}))) : [],
						title_topics_graph_all: titleResult ? _.map(titleResult, function(item) {
							var terms = _.map(item, function(term) {
								return term.term;
							});

							return terms;
						}) : []
					}
				})
			}
		});

		if (bulkBody.length > 0) {
			client.bulk({
				body: bulkBody
			}, function(error, bulkResponse) {
				if (response.hits.hits.length == pageSize) {
					createModels();
				}
			});
		}
		else if (response.hits.hits.length == pageSize) {
			createModels();
		}
	});
}

createModels();