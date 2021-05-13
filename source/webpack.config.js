const path = require('path');

module.exports = {
	mode: 'production',
	entry: './rComments.js',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'rComments.js',
	},
};
