import raven from "raven";
import { app, BrowserWindow, ipcMain as ipc, dialog } from "electron";

import api    from "./modules/aof-api";
import server from "./modules/replay-server";
import client from "./modules/lol-client";
import parser from "aof-file-parser";

let mainWindow = null;
let replay = null;
let playingReplay = false;

let ravenClient = new raven.Client("http://71524752dc5f48a78a5d23142c8ee5a9@sentry.aof.gg/6");
ravenClient.patchGlobal(() => process.exit(1));

app.on("window-all-closed", () => {
	if (process.platform != "darwin") {
		app.quit();
	}
});

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

ipc.on("file-watch", (event, arg) => {
	server.reset();
	
	playingReplay = true;
	mainWindow.minimize();
	
	client.launch(server.host, server.port, "EUW1", replay.gameId, replay.key, success => {
		playingReplay = false;
		mainWindow.restore();
		
		if (!success) console.log("Could not start league of legends client.");
	});
});

ipc.on("live-watch", (event, arg) => {
	playingReplay = true;
	mainWindow.minimize();

	console.log(arg);
	client.launch(arg.host, 80, arg.region, arg.gameId, arg.key, success => {
		playingReplay = false;
		mainWindow.restore();
		
		if (!success) console.log("Could not start league of legends client.");
	});
});

ipc.on("replay-watch", (event, arg) => {
	playingReplay = true;
	mainWindow.minimize();
	
	client.launch("replay.aof.gg", 80, "AOF" + arg.regionId, arg.id, arg.encryptionKey, (success) => {
		playingReplay = false;
		mainWindow.restore();
		
		if (!success) console.log("Could not start league of legends client.");
	});
});

server.start((server, port) => console.log("Local server running on %s:%s", server, port));

app.on("ready", () => {
	mainWindow = new BrowserWindow({
		width: 1600,
		height: 800,
		toolbar: false,
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
});
