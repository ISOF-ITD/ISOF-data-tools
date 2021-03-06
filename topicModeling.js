var _ = require('underscore');
var elasticsearch = require('elasticsearch');

var TopicModeling = require('./lib/topic-modeling');

/*

Stopwordslistan finns i node_modules/stopword/lib/stopwords_sv.js.
Eftersom den inte är versionhanterat (inga filer inom node_modules är versionhanterat) lagras filen i lib men måste flyttast till node_modules/stopword/lib  och node_modules/lda/lib för att användas både för stopword och lda modulerna.

*/

if (process.argv.length < 5) {
	console.log('node topicModeling.js --index=[es index name] --host=[es host] --login=[es login] --query=[es query] --topics_field=[es topics field (default topics)] --numtopics=[number of topics (default 10)] --numterms=[number of terms (default 10)]');

	return;
}

var argv = require('minimist')(process.argv.slice(2));

var esHost = (argv.host.indexOf('https://') > -1 ? 'https://' : 'http://')+(argv.login ? argv.login+'@' : '')+(argv.host.replace('http://', '').replace('https://', ''));

console.log('esHost: '+esHost);

var client = new elasticsearch.Client({
	host: esHost,
//	log: 'trace'
});

var pageSize = 100;

var topicsField = argv.topics_field || 'topics';

function createModels() {
	var query = {
		'query': argv.query ? {
			'query_string': {
				'query': argv.query
			}
		} : {
			'bool': {
				'must': [
					{
						'exists': {
							'field': 'text'
						}
					}
				]
			}
		}
	};

	client.search({
		index: argv.index || 'sagenkarta',

		body: query,

		size: pageSize,
		sort: 'id',
		scroll: '120s'
	}, function fetchMore(error, response) {
		if (error || !response || !response.hits) {
			if (error) {
				console.log(error);
			}
			console.log(response);
		}

		var bulkBody = [];

		_.each(response.hits.hits, function(hit) {
			if (hit._source.text || hit._source.title) {
				console.log(hit._id+': '+hit._source.title);

				if (hit._source.text && hit._source.text.length > 0) {
					try {
						var result = TopicModeling.createModel(hit._source.text, argv.numtopics || 10, argv.numterms || 10);
					} catch(e) {
						console.log(e);
						var result = [];
					}
				}

				if (hit._source.title && hit._source.title.length != '') {
					try {
						var titleResult = TopicModeling.createModel(hit._source.title, argv.numtopics || 10, argv.numterms || 10);
					} catch(e) {
						console.log(e);
						var titleResult = [];
					}
				}

				bulkBody.push({
					update: {
						_index: argv.index || 'sagenkarta',
						_type: 'legend',
						_id: hit._id
					}
				});

				var document = {
					doc: {}
				};

				document.doc[topicsField] = result ? _.map(result, function(item) {
					return {
						terms: item
					};
				}) : [];

				document.doc[topicsField+'_graph'] = result ? _.uniq(_.flatten(_.map(result, function(item) {
					var terms = _.map(item, function(term) {
						return term.term;
					});

					return terms;
				}))) : [];

				document.doc[topicsField+'_graph_all'] = result ? _.map(result, function(item) {
					var terms = _.map(item, function(term) {
						return term.term;
					});

					return terms;
				}) : [];

				document.doc['title_'+topicsField] = titleResult ? _.map(titleResult, function(item) {
					return {
						terms: item
					};
				}) : [];

				document.doc['title_'+topicsField+'_graph'] = titleResult ? _.uniq(_.flatten(_.map(titleResult, function(item) {
					var terms = _.map(item, function(term) {
						return term.term;
					});

					return terms;
				}))) : [];

				document.doc['title_'+topicsField+'_graph_all'] = titleResult ? _.map(titleResult, function(item) {
					var terms = _.map(item, function(term) {
						return term.term;
					});

					return terms;
				}) : [];

				bulkBody.push(document);
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
					client.scroll({
						scrollId: response._scroll_id,
						scroll: '120s'
					}, fetchMore);
				}
			});
		}
		else if (response.hits.hits.length == pageSize) {
			client.scroll({
				scrollId: response._scroll_id,
				scroll: '120s'
			}, fetchMore);
		}
	});
}

createModels();
