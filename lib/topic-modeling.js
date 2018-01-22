var lda = require('lda');
var stopword = require('stopword');
var snowball = require('node-snowball');


class TopicModeling {
	static createModel(text) {
		var processedText = this.stemword(this.removeStopwords(this.tokenize(text)));
		var result = lda(processedText, 10, 10, ['sv']);

		return result;
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