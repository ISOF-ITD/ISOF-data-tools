var _ = require('underscore');
var elasticsearch = require('elasticsearch');

var TopicModeling = require('./lib/topic-modeling');

if (process.argv.length < 5) {
	console.log('node topicModeling.js [index name] [host] [login] [es query]');

	return;
}

var esHost = 'https://'+(process.argv[4] ? process.argv[4]+'@' : '')+(process.argv[3] || 'localhost:9200');

console.log('esHost: '+esHost);

var client = new elasticsearch.Client({
	host: esHost,
//	log: 'trace'
});

var pageSize = 100;

function createModels() {
	var query = {
		'query': process.argv[5] ? {
			'query_string': {
				'query': process.argv[5]
			}
		} : {
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
	};

	client.search({
		index: process.argv[2] || 'sagenkarta',

		body: query,

		size: pageSize
	}, function(error, response) {
		var bulkBody = [];

		_.each(response.hits.hits, function(hit) {
			if (hit._source.text || hit._source.title) {
				console.log(hit._source.title);

				if (hit._source.text && hit._source.text.length > 0) {
					try {
						var result = TopicModeling.createModel(hit._source.text);
					} catch(e) {
						var result = [];
					}
				}

				if (hit._source.title && hit._source.title.length != '') {
					try {
						var titleResult = TopicModeling.createModel(hit._source.title);
					} catch(e) {
						var titleResult = [];
					}
				}

				bulkBody.push({
					update: {
						_index: process.argv[2] || 'sagenkarta',
						_type: 'legend',
						_id: hit._id
					}
				});

				bulkBody.push({
					doc: {
						topics: result ? _.map(result, function(item) {
							return {
								terms: item
							};
						}) : [],
						topics_graph: result ? _.uniq(_.flatten(_.map(result, function(item) {
							var terms = _.map(item, function(term) {
								return term.term;
							});

							return terms;
						}))) : [],
						topics_graph_all: result ? _.map(result, function(item) {
							var terms = _.map(item, function(term) {
								return term.term;
							});

							return terms;
						}) : [],
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
				});

			}
		});

		console.log('bulkBody.length: '+bulkBody.length);
		if (bulkBody.length > 0) {
			console.log('client.bulk');
			client.bulk({
				body: bulkBody
			}, function(error, bulkResponse) {
				console.log(bulkResponse);
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
