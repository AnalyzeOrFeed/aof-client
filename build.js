import webpack from "webpack";
import builder from "electron-builder";

import configMain from "./webpack.dist.main.config";
import configRenderer from "./webpack.dist.renderer.config";

const compilerMain = webpack(configMain);
const compilerRenderer = webpack(configRenderer);

compilerMain.run(function(err, stats) {
	console.log(stats.toString({ colors: true }));

	compilerRenderer.run(function(err, stats) {
		console.log(stats.toString({ colors: true }));

		builder.build().catch((error) => {
			console.log(error);
		});
	});
});
