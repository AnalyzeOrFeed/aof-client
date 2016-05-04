import app from "app";
import BrowserWindow from "browser-window";
import { ipcMain as ipc, dialog } from "electron";

import api    from "./modules/aof-api";
import server from "./modules/replay-server";
import client from "./modules/lol-client";
import parser from "aof-file-parser";

let mainWindow = null;
let replay = null;
let playingReplay = false;

app.on("window-all-closed", () => {
	if (process.platform != "darwin") {
		app.quit();
	}
});

ipc.on("open-file", (event, args) => {
	let files = [];
	if (args) files.push(args);
	else {
		files = dialog.showOpenDialog(mainWindow, {
			filters: [{ name: 'AoF Replay File', extensions: ['aof'] }],
			properties: [ "openFile" ]
		});
	}
	
	if (files && files.length) {
		parser.load(files[0], (result, replayMetadata, replayData) => {
			if (!result.success) {
				event.sender.send("open-file", result.error);
				return;
			}
			
			// Prepare local server
			server.load(replayMetadata, replayData);

			// Send to GUI
			replay = replayMetadata;
			event.sender.send("open-file", replay);
		});
	}
});

ipc.on("play-file", (event, args) => {
	server.reset();
	
	playingReplay = true;
	mainWindow.minimize();
	
	client.launch(server.host, server.port, replay.gameId, replay.key, (success) => {
		playingReplay = false;
		mainWindow.restore();
		
		if (!success) console.log("Could not start league of legends client.");
	});
});

server.start((server, port) => console.log("Local server running on %s:%s", server, port));

app.on("ready", () => {
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600
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
});
