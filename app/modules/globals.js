"use strict";

// Imports
// =============================================================================
import { app, ipcMain as ipc } from "electron";
import fs from "fs";
import _ from "lodash";
import request from "request";


// Globals
// =============================================================================
global.paths = {
	data: app.getPath("userData"),
	cache: app.getPath("userData") + "/cache/",
	replays: app.getPath("documents") + "/Analyze or Feed/Replays/",
};
global.api = {
	baseUrl: "https://api.aof.gg/v2/",
	ddragonBase: "https://ddragon.leagueoflegends.com/cdn/6.12.1/img/",
	token: null,
	data: require("../assets/data/meta_6-12-1.json"),
};
global.app = {
	playingReplay: false,
};
global.replays = {
	add: replay => {
		files.unshift(replay);
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
global.settings = {};

// Allow loading and saving settings
let saveSettings = () => {
	console.log("Saving user settings");

	delete global.settings.save;
	delete global.settings.load;

	global.settings.lolClientPath = client.leaguePath;

	fs.writeFileSync(global.paths.data + "/settings", JSON.stringify(settings, null, 2));

	global.settings.save = saveSettings;
	global.settings.load = loadSettings;
};
let loadSettings = () => {
	console.log("Loading user settings");
	fs.readFile(global.paths.data + "/settings", (err, data) => {
		if (err) {
			console.log(err);
			return;
		}

		settings = JSON.parse(data);
		settings.save = saveSettings;
		settings.load = loadSettings;
	});
};
global.settings.save = saveSettings;
global.settings.load = loadSettings;


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
