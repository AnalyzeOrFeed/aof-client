import webpack from "webpack";
import path from "path";
import CopyWebpackPlugin from "copy-webpack-plugin";

export default {
	target: "electron-renderer",
	entry: path.join(__dirname, "app/index"),
	module: {
		loaders: [{
			test: /\.jsx?$/,
			loader: "babel",
			exclude: /node_modules/,
			query: {
				"presets": ["electron", "react"],
			}
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
		path: path.join(__dirname, "temp"),
		filename: "app.js",
		libraryTarget: "commonjs2"
	},
	resolve: {
		extensions: ["", ".js", ".jsx"],
		alias: {
	        "components": path.resolve(__dirname, "app/components"),
	        "assets": path.resolve(__dirname, "app/assets"),
	        "stores": path.resolve(__dirname, "app/stores"),
	    }
	},
	plugins: [
	    new CopyWebpackPlugin([
			{ from: "app/assets/", to: "assets" },
			{ from: "app/lib/", to: "lib" },
			{ from: "app/index.html" },
		])
	]
};
