import webpack from "webpack";
import path from "path";
import CopyWebpackPlugin from "copy-webpack-plugin";

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
			test: /\.(png|svg|jpg|gif)$/,
			loader: "url-loader?limit=8192"
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
		extensions: ["", ".js", ".jsx"],
		alias: {
	        "components": path.resolve(__dirname, "app/components"),
	        "modules": path.resolve(__dirname, "app/modules"),
	        "assets": path.resolve(__dirname, "app/assets"),
	        "stores": path.resolve(__dirname, "app/stores"),
	    }
	},
	plugins: [
		new webpack.optimize.OccurenceOrderPlugin(),
	    new webpack.HotModuleReplacementPlugin(),
	    new webpack.NoErrorsPlugin(),
	    new CopyWebpackPlugin([
			{ from: "app/assets/" }
		])
	]
};
