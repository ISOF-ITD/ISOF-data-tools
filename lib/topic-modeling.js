var lda = require('lda');
var stopword = require('stopword');
var snowball = require('node-snowball');
var _ = require('underscore');

class TopicModeling {
	static createModel(text, topics, terms, language) {
		var processedText = this.prepareSentences(text);
		console.log(processedText)
		var result = lda(processedText, topics || 10, terms || 10, [language || 'sv']);

		return result;
	}

	static prepareSentences(text) {
		var sentences = this.extractSentences(text);

		var prepared = _.map(sentences, function(sentence) {
			return this.stemword(this.removeStopwords(this.tokenize(sentence))).join(' ')+'.';
		}.bind(this));

		return prepared;
	}

	static extractSentences(text) {
		return text.split('<br />').join(' ').split('/n').join(' ').match( /[^\.!\?]+[\.!\?]+/g ) || [text.split('<br />').join('').split('/n').join('')];
	}

	static tokenize(text) {
		return text.split('<br />').join(' ').split('/n').join(' ').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,'').split(' ');
	}

	static removeStopwords(tokens) {
		return stopword.removeStopwords((typeof tokens == 'string' ? this.tokenize(tokens) : tokens), stopword.sv);
	}

	static stemword(words) {
		return snowball.stemword((typeof words == 'string' ? this.tokenize(words) : words), 'swedish');
	}
}

module.exports = TopicModeling;
