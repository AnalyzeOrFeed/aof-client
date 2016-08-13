import webpack from "webpack";
import path from "path";

export default {
	target: "electron-main",
	entry: path.join(__dirname, "app/main"),
	module: {
		loaders: [{
			test: /\.jsx?$/,
			loader: "babel",
			exclude: /node_modules/,
			query: {
				"presets": ["electron", "react"],
			}
		}, {
			test: /\.json$/,
			loader: "json-loader"
		}]
	},
	output: {
		path: path.join(__dirname, "temp"),
		filename: "main.js",
		libraryTarget: "commonjs2"
	},
	resolve: {
		extensions: ["", ".js", ".jsx"],
		alias: {
	        "modules": path.resolve(__dirname, "app/modules"),
	    }
	},
	node: {
		__dirname: false,
		__filename: false
	},
	plugins: [
	]
};
