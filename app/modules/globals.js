"use strict";

// Imports
// =============================================================================
import { app, ipcMain as ipc } from "electron";
import fs from "fs";
import _ from "lodash";
import request from "request";


// Globals
// =============================================================================
global.dev = process.env.NODE_ENV === "development";
global.paths = {
	data: app.getPath("userData"),
	cache: app.getPath("userData") + "/cache/",
	replays: app.getPath("documents") + "/Analyze or Feed/Replays/",
};
global.api = {
	baseUrl: "https://api.aof.gg/v3/",
	ddragonBase: "https://ddragon.leagueoflegends.com/cdn/6.16.2/img/",
	token: null,
	data: require("../assets/data/meta_6-16-2.json"),
};
global.app = {
	playingReplay: false,
};
global.replays = {
	add: replay => {
		global.replays.files.unshift(replay);
		global.replays.save();
		ipc.emit("global-replays");
	},
	save: () => {
		fs.writeFileSync(global.paths.data + "/replays", JSON.stringify(global.replays.files, null, 2));
	},
	load: () => {
		fs.readFile(global.paths.data + "/replays", (err, data) => {
			if (err) {
				console.log(err);
				return;
			}

			global.replays.files = JSON.parse(data);
			ipc.emit("global-replays");
		});
	},
	files: [],
};
global.settings = {
	save: () => {
		console.log("Saving user settings");

		let data = _.omitBy(global.settings, _.isFunction);
		fs.writeFileSync(global.paths.data + "/settings", JSON.stringify(data, null, 2));
	},
	load: () => {
		console.log("Loading user settings");
		
		fs.readFile(global.paths.data + "/settings", (err, data) => {
			if (err) {
				console.log(err);
				return;
			}

			global.settings = _.merge(global.settings, JSON.parse(data));
		});
	},
};
global.set = (name, value) => {
	_.set(global, name, value);
};


// Load data
// =============================================================================
// Get newest static data from AOF server
request.get(global.api.baseUrl + "data/static", { json: true }, (err, res, body) => {
    if (err || res.statusCode != 200) {
        console.log("Could not get static data: " + err + " " + (res ? res.statusCode : ""));
        return;
    }

    _.each(body.leagues, league => league.image = "assets/img/" + league.name.toLowerCase() + ".png");
    global.api.data = body;
});

// Load user settings
global.settings.load();

// Load local replays
global.replays.load();
