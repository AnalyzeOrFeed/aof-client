"use strict";

// Imports
// =============================================================================
import { app, BrowserWindow, ipcMain as ipc, dialog } from "electron";
import fs from "fs";
import _ from "lodash";
import raven from "raven";
import request from "request";
import mkdirp from "mkdirp";
import parser from "aof-file-parser";

import "./modules/globals";
import server from "./modules/replay-server";
import client from "./modules/lol-client";
import record from "./modules/recording";


// Variables and functions
// =============================================================================
let mainWindow = null;
let replay = null;

// Create required paths
mkdirp.sync(global.paths.cache);
mkdirp.sync(global.paths.replays);


// Raven
// =============================================================================
let ravenClient = new raven.Client("http://71524752dc5f48a78a5d23142c8ee5a9@sentry.aof.gg/6");
//ravenClient.patchGlobal(() => process.exit(1));


// System information
// =============================================================================
console.log("--- SYSTEM INFORMATION ---");
console.log(process.platform + "-" + process.arch);
console.log(JSON.stringify(global.paths, null, 2));
console.log(JSON.stringify(process.versions, null, 2));
console.log("--- END SYSTEM INFORMATION ---")


// Local recording
// =============================================================================
record.on("recordingStatus", message => {
	mainWindow.webContents.send("recordingStatus", message);
});
record.on("recordingDone", replay => {
	mainWindow.webContents.send("recordingStatus", "Replay complete!");
});


// Local replay server
// =============================================================================
server.start((server, port) => console.log("Local server running on %s:%s", server, port));


// IPC
// =============================================================================
ipc.on("file-open", (event, arg) => {
	let files = [];
	if (arg) files.push(arg);
	else {
		files = dialog.showOpenDialog(mainWindow, {
			filters: [{ name: 'AoF Replay File', extensions: ['aof'] }],
			properties: [ "openFile" ]
		});
	}

	if (!files || !files.length) {
		event.sender.send("file-open", { replay: null });
		return;
	}
	
	parser.load(files[0], (result, replayMetadata, replayData) => {
		if (!result.success) {
			event.sender.send("open-file", { error: result.error });
			return;
		}

		// Prepare local server
		server.load(replayMetadata, replayData);

		// Save metadata
		replay = replayMetadata;

		// Send to GUI
		event.sender.send("file-open", { replay: JSON.parse(JSON.stringify(replayMetadata)) });
	});
});

ipc.on("watch", (event, arg) => {
	let host = arg ? arg.host : server.host;
	let port = arg ? arg.port : server.port;
	let region = arg ? arg.region : "AOF";
	let gameId = arg ? arg.gameId : replay.gameId;
	let key = arg ? arg.key : replay.key;

	global.app.playingReplay = true;
	mainWindow.minimize();
	
	client.launch(host, port, region, gameId, key, success => {
		global.app.playingReplay = false;
		mainWindow.restore();
		
		if (!success) console.log("Could not run league of legends client.");
	});
});


// Application window
// =============================================================================
app.on("ready", () => {
	mainWindow = new BrowserWindow({
		width: 1600,
		height: 800,
		toolbar: false,
		"min-width": 800,
		autoHideMenuBar: true,
	});

	mainWindow.loadURL("file://" + __dirname + "/index.html");

	mainWindow.on("closed", () => {
		mainWindow = null;
	});

	if (process.env.NODE_ENV === "development") {
		mainWindow.openDevTools();
	}

	client.find((found, path, version) => {
		console.log("%s %s %s", found, path, version);
	});

	// Check for running games
	setInterval(() => record.checkForLeague(), 5000);
});
app.on("window-all-closed", () => {
	if (process.platform != "darwin") app.quit();
});
