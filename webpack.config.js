import webpack from "webpack";
import path from "path";

export default {
	target: "electron-renderer",
	debug: true,
	devtool: "cheap-module-source-map",
	entry: [
		path.join(__dirname, "app/index"),
		"webpack-hot-middleware/client?path=http://localhost:3000/__webpack_hmr"
	],
	module: {
		loaders: [{
			test: /\.jsx?$/,
			loader: "babel",
			exclude: /node_modules/
		}, {
			test: /\.scss$/,
			loader: "style!css!sass"
		}, {
			test: /\.json$/,
			loader: "json-loader"
		}]
	},
	output: {
		path: path.join(__dirname, "dist"),
		publicPath: "http://localhost:3000/dist/",
		filename: "bundle.js",
		libraryTarget: "commonjs2"
	},
	resolve: {
		extensions: ["", ".js", ".jsx"]
	},
	plugins: [
		new webpack.optimize.OccurenceOrderPlugin(),
	    new webpack.HotModuleReplacementPlugin(),
	    new webpack.NoErrorsPlugin()
	]
};
