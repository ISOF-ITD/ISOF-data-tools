var _ = require('underscore');
var elasticsearch = require('elasticsearch');

var lda = require('lda');
var stopword = require('stopword');
var snowball = require('node-snowball');

var client = new elasticsearch.Client({
	host: 'localhost:9200',
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

				console.log(hit._source.text);
				console.log(result);

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
						title_topics: titleResult ? _.map(titleResult, function(item) {
							return {
								terms: item
							};
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