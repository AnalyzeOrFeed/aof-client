import app from "app";
import BrowserWindow from "browser-window";
import { ipcMain as ipc } from "electron";

let mainWindow = null;

app.on("window-all-closed", () => {
	if (process.platform != "darwin") {
		app.quit();
	}
});

ipc.on("test", () => {
	console.log("test");
});

app.on("ready", () => {
	mainWindow = new BrowserWindow({ width: 800, height: 600 });

	mainWindow.loadURL("file://" + __dirname + "/index.html");

	mainWindow.on("closed", () => {
		mainWindow = null;
	});

	if (process.env.NODE_ENV === "development") {
		mainWindow.openDevTools();
	}
});
