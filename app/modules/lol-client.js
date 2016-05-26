"use strict";

const fs = require("fs");
const winreg = require("winreg");
const spawn = require("child_process").spawn;
const _ = require("lodash");
const domain = require("domain");

const INTERNAL_PATH = "/solutions/lol_game_client_sln/releases/";
const regexLocations = [
	"HKCU\\Software\\Riot Games\\RADS",
	"HKCU\\Software\\Wow6432Node\\Riot Games\\RADS",
	"HKCU\\Software\\Classes\\VirtualStore\\MACHINE\\SOFTWARE\\Wow6432Node\\RIOT GAMES\\RADS",
	"HKCU\\Software\\Classes\\VirtualStore\\MACHINE\\SOFTWARE\\RIOT GAMES\\RADS",
	"HKLM\\Software\\Wow6432Node\\Riot Games\\RADS",
	"HKLM\\Software\\RIOT GAMES\\RADS"
];

let running = false;
let basePath = null;
let leaguePath = null;
let leagueVersion = null;

// Try and find the specified registry key
let findRegKey = (hive, key, callback) => {
	let regKey = new winreg({
		hive: hive,
		key:  key
	});
	
	let d = domain.create();
	d.on("error", () => callback());
	d.run(() => regKey.get("LocalRootFolder", (err, item) => {
		if (err) callback();
		else callback(item.value);
	}));
};

// Sort filenames at the specified basePath newest first by date
let fileSort = (basePath) => (a, b) => fs.statSync(basePath + b).mtime.getTime() - fs.statSync(basePath + a).mtime.getTime();

// Try and extract the league of legends client version
let checkVersion = (basePath, callback) => {
	let logPath = basePath + "/../Logs/Game - R3d Logs/";

	fs.readdir(logPath, (err, files) => {
		if (err) {
			callback(false, err);
			return;
		}

		files.sort(fileSort(logPath));

		fs.readFile(logPath + files[0], "utf8", (err, content) => {
			if (err) {
				callback(false, err);
				return;
			}

			let leagueVersion = content.substring(content.indexOf("Build Version:") + 15, content.indexOf("[PUBLIC]") - 1);
			callback(true, leagueVersion);
		});
	});
};

// Try and find the league of legends client at the specified path
let checkPath = (basePath, callback) => {
	fs.readdir(basePath + INTERNAL_PATH, (err, files) => {
		if (err) {
			callback(false, err);
			return;
		}

		files.sort(fileSort(basePath + INTERNAL_PATH));
		let fullPath = basePath + INTERNAL_PATH + files[0] + "/deploy/";

		fs.readdir(fullPath, (err, files) => {
			if (err) {
				callback(false, err);
				return;
			}

			checkVersion(basePath, (success, version) => callback(success, fullPath, version));
		});
	});
};

class LolClient {
	get leaguePath() {
		return leaguePath;
	}
	get isFound() {
		return leaguePath !== null;
	}
	get version() {
		return leagueVersion;
	}

	constructor() {}

	// Try and find the league client
	find(callback) {
		basePath = null;
		leaguePath = null;
		leagueVersion = null;

		if (process.platform == "win32") {
			let promises = [];

			// Create a promise for each registry key to check
			regexLocations.forEach((fullKey) => {
				let hive = fullKey.substring(0, 4);
				let key = fullKey.substring(4);

				promises.push(new Promise((resolve, reject) => {
					findRegKey(hive, key, (path) => {
						checkPath(path, (found, fullPath, version) => {
							if (!found) resolve(null);
							else resolve({ basePath: path, leaguePath: fullPath, leagueVersion: version });
						});
					});
				}));
			});

			// Check all promises
			Promise.all(promises).then((data) => {
				// Get the first non-null value of the list
				data = _.compact(data);

				// Check if we actually have a value
				if (!data.length) callback(false);
				else {
					let obj = _.head(data);

					// Save the location of the client
					basePath = obj.basePath;
					leaguePath = obj.leaguePath;
					leagueVersion = obj.leagueVersion;

					callback(true, basePath, leaguePath, leagueVersion);
				}
			});
		} else if (process.platform == "darwin") {
			let path = "/Applications/League of Legends.app/Contents/LoL/RADS";

			// Check if the app is at the default path
			fs.access("/Applications/League of Legends.app", function(err) {
				if (err) {
					callback(false);
					return;
				}

				checkPath(path, (found, fullPath, version) => {
					if (!found) callback(false);
					else {
						// Save the location of the client
						basePath = path;
						leaguePath = fullPath;
						leagueVersion = version;
						callback(true, basePath, leaguePath, leagueVersion);
					}
				});
			});
		}
	}

	// Extract the league of legends path from the user selected path
	setPath(file, callback) {
		file = file.replace(/\\/g, "/");
		let path = null;

		if (process.platform == "win32") {
			// Check if the user selected the launcher instead of the client
			let i = file.indexOf("RADS/solutions/") + 5;
			if (i > 4) path = file.substring(0, i);
			else if ((i = file.indexOf("League of Legends/") + 18) > 17) path = file.substring(0, i) + "RADS";
		} else if (process.platform == "darwin") {
			path = file + "/Contents/LoL/RADS";
		}

		if (!path)
			callback(false);
		else {
			checkPath(path, (found, fullPath, version) => {
				if (!found) callback(false);
				else {
					basePath = path;
					leaguePath = fullPath;
					leagueVersion = version;
					callback(true, basePath, leaguePath, leagueVersion);
				}
			});
		}
	}

	// Run the League of Legends client and tell it to spectate the specified endpoint
	launch(host, port, replayRegion, replayGameId, replayKey, callback) {
		// Check if the client is already running
		if (running) {
			callback(false);
			return;
		}

		// Check if we have a client path
		if (!leaguePath) {
			callback(false);
			return;
		}

		// Set LoL client executable/app name
		let exe = "";
		if (process.platform == "win32") exe = "League of Legends.exe";
		else if (process.platform == "darwin") exe = "LeagueOfLegends.app";
		
		// Set arguments
		let args = [
			"8394", 
			"LoLLauncher.exe", 
			"", 
			"replay " + host + ":" + port + " " + replayKey + " " + replayGameId + " " + replayRegion
		];
		console.log(args);
		
		// Set options
		let opts = { stdio: "ignore" };
		if (process.platform == "win32") opts.cwd = leaguePath;
		else if (process.platform == "darwin") {
			opts.cwd = leaguePath + exe + "/Contents/MacOS";
			process.env["riot_launched"] = true;
		}
		
		// Set command
		let cmd = "";
		if (process.platform == "win32") cmd = leaguePath + exe;
		else if (process.platform == "darwin") cmd = opts.cwd + "/LeagueofLegends";
		
		// Check if client is executable
		fs.access(cmd, fs.X_OK, (err) => {
			if (err) callback(false);
			else {
				// Run LoL client
				let client = spawn(cmd, args, opts);
				let cb = () => {
					running = false;
					callback(true);
				};
				client.on("error", cb);
				client.on("close", cb);
			}
		});
	}
}

export default new LolClient();
