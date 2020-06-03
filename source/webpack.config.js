const path = require('path');

module.exports = {
	entry: './rComments.js',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'rComments.js'
	}
};
