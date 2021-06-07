const path = require('path');

module.exports = {
	mode: 'development',
	entry: './rComments.js',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'rComments.js',
	},
};
