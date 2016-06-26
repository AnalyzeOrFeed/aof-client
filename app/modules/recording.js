"use strict";

import { app } from "electron";
import { EventEmitter } from "events";
import { exec } from "child_process";
import fs from "fs";
import _ from "lodash";
import request from "request";

const dir = global.paths.cache;
const replayPath = global.paths.replays;
const options = { timeout: 10000, json: true };
const constUrl = "observer-mode/rest/consumer/";

let emitter = new EventEmitter();
let leagueChecking = false;
let leagueRecording = false;

let self = {
	on: function(eventName, listener) {
		emitter.on(eventName, listener);
	},

	checkForLeague: function(callback) {
		if (leagueChecking) return;
		leagueChecking = true;

		if (!global.api.token) {
			emitter.emit("recordingStatus", "Not logged in");
			leagueChecking = false;
			return;
		}

		if (global.app.playingReplay) {
			emitter.emit("recordingStatus", "Watching a replay");
			leagueChecking = false;
			return;
		}

		
		if (leagueRecording) {
			leagueChecking = false
			return;
		}

		let cb = proc => {
			if (!proc) {
				emitter.emit("recordingStatus", "Waiting for a match...");
				leagueChecking = false;
				return;
			}

			request.post(global.api.baseUrl + "check/me?token=" + global.api.token, { json: true }, (err, res, body) => {
	            if (err || res.statusCode != 200) {
	                console.log("Could not check self: " + err + " " + (res ? res.statusCode : ""));
	                emitter.emit("recordingStatus", "Could not check summoners: " + err + " " + (res ? res.statusCode : ""));
	                leagueChecking = false;
	                return;
	            }

	            let game = _.find(body, item => item.gameId != null ).game;

	            if (!game) {
					emitter.emit("recordingStatus", "Match started, waiting for info...");
					leagueChecking = false;
					return;
				}

	            game.region = _.find(global.api.data.regions, { id: game.regionId });
	            game.version = _.find(global.api.data.versions, { id: game.versionId });
	            if (!game.version) game.version = global.api.data.newestVersion.riotVersion;
	           	game.state = 1;
				game.metaErrors = 0;
				game.key = game.regionId + "-" + game.id;
				game.oldKeyframeId = game.newestKeyframeId = 0;
				game.oldChunkId = game.newestChunkId = 0;
				game.chunks = [ null ];
				game.keyframes = [ null ];
				game.running = 0;
				game.isWaiting = 0;

				console.log(game);

				leagueRecording = true;
				self.updateGame(game);

				emitter.emit("recordingStatus", "Recording...");
				leagueChecking = false;
	        });
		};
		
		if (process.platform == "win32") {
			exec("tasklist", (err, stdout, stderr) => {
				let splits = stdout.split("\n");
				let proc = _.find(splits, proc => proc.indexOf("League of Legends") === 0 && proc.indexOf("Console") > 0);
				cb(proc);
			});
		} else {
			exec("ps -ax | grep -i 'LoL/RADS/solutions'", (err, stdout, stderr) => {
				let splits = stdout.split("\n");
				let proc = _.find(splits, proc => proc.indexOf("deploy/bin/LolClient") >= 0);
				cb(proc);
			});
		}
	},

	updateGame: function(game) {
		let retry = time => {
			// Check what to do next
			if (game.metaErrors > 10) {
				console.log("Canceled game ", game.key);

				leagueRecording = false;
				emitter.emit("recordingStatus", "Recording canceled!");
			} else {
				// Wait for timeout until next check
				setTimeout(() => self.updateGame(game), time);
			}
		};

		if (game.state == 1) {
			let url = encodeURI(game.region.spectatorUrl + constUrl + "getGameMetaData/" + game.region.spectatorRegion + "/" + game.id + "/0/token");
			request.get(url, options, (err, response, metaData) => {
				if (err || response.statusCode != 200) {
					console.log("GameMetaData error: " + err + ", " + (response ? response.statusCode : null) + " for " + game.key);
					game.metaErrors++;
					retry(10000);
				} else if (metaData.startGameChunkId > 0) {
					game.endStartupChunkId = metaData.endStartupChunkId;
					game.startGameChunkId = metaData.startGameChunkId;
					game.isFeatured = metaData.featuredGame;
					game.mmr = metaData.interestScore;
					
					game.state = 2;
					
					retry(0);
				} else {
					console.log("Game " + game.key + " hasn't started yet");
					retry(30000);
				}
			});
		} else if (game.state == 2) {
			let url = encodeURI(game.region.spectatorUrl + constUrl + "getLastChunkInfo/" + game.region.spectatorRegion + "/" + game.id + "/0/token");
			request.get(url, options, (err, response, chunkInfo) => {
				if (err || !response || response.statusCode != 200) {
					console.log("LastChunkInfo error: " + err + ", " + (response ? response.statusCode : null) + " for " + game.key);
					game.metaErrors++;
					retry(10000);
					return;
				}

				game.oldKeyframeId = game.newestKeyframeId;
				game.oldChunkId = game.newestChunkId;
				
				game.newestKeyframeId = Math.max(game.newestKeyframeId, chunkInfo.keyFrameId);
				game.newestChunkId = Math.max(game.newestChunkId, chunkInfo.chunkId);
				game.isDone = game.newestChunkId != 0 && game.newestChunkId == chunkInfo.endGameChunkId;
				
				// Download new keyframes and chunks
				for (let i = game.oldKeyframeId + 1; i <= game.newestKeyframeId; i++) {
					game.running++;
					self.downloadObject(game, 1, i, 0);
				}
				for (let i = game.oldChunkId + 1; i <= game.newestChunkId; i++) {
					game.running++;
					self.downloadObject(game, 0, i, 0);
				}
				
				if (!game.isDone) {
					retry(chunkInfo.nextAvailableChunk + 1000);
					return;
				}
				
				// Check for active downloads
				if (game.running > 0 && game.isWaiting < 10) {
					console.log("Game " + game.key + " has " + game.running + " downloads running");
					
					game.isWaiting++;
					retry(10000);
					return;
				} else if (game.isWaiting >= 10) {
					console.log("Game " + game.key + " continues after waiting 10 times");
				}
				
				// Get meta data
				let url = encodeURI(game.region.spectatorUrl + constUrl + "getGameMetaData/" + game.region.spectatorRegion + "/" + game.id + "/0/token");
				request.get(url, options, (err, response, metaData) => {
					if (err || response.statusCode != 200) {
						console.log("GameMetaData error: " + err + ", " + (response ? response.statusCode : null) + " for " + game.key);
						game.metaErrors++;
						retry(10000);
						return;
					}

					if (metaData.gameEnded) {
						console.log("Game " + game.key + " is done");
						
						game.state = 3;
						
						self.finishGame(game);
					} else {
						console.log("Last available chunk but game " + game.key + " isn't done");
						retry(10000);
					}
				});
			});
		}
	},

	downloadObject: function(game, typeId, objectId, tries) {
		let start = process.hrtime();
		let key = game.region.id + "-" + game.id + "-" + (typeId === 1 ? "K" : "C") + "-" + objectId;
		let url = game.region.spectatorUrl + constUrl + (typeId === 1 ? "getKeyFrame" : "getGameDataChunk") + "/" + 
			game.region.spectatorRegion + "/" + game.id + "/" + objectId + "/token?rito=" + (new Date()).getTime();
		
		tries++;
		console.log("Downloading " + key + " try #" + tries);

		// Download game object from spectator endpoint
		request(url, { encoding: null, timeout: 10000 }, function(err, response, data) {
			if (err || response.statusCode != 200) {
				console.log("Could not download " + key + ": Error: " + err + ", Response " + (response ? response.statusCode : null));
				if (tries < 10) {
					let time =  tries * 2000;
					console.log("Retrying download " + key + " in " + time);
					setTimeout(function() { self.downloadObject(game, typeId, objectId, tries); }, time);
				} else {
					console.log("Stopped download " + key + ": Too many retries");
					
					// Save missing keyframe in game & record stats
					if (typeId == 1) {
						game.keyframes[objectId] = false;
					} else {
						game.chunks[objectId] = false;
					}

					game.running--;
					if (game.running < 0) {
						console.log("Game " + game.key + " has negative downloads running");
						game.running = 0;
					}
				}
				return;
			}

			// Save to file
			fs.writeFile(dir + key, data, function(err) {
				if (err) {
					console.log(err);
					
					if (typeId == 1) {
						game.keyframes[objectId] = false;
					} else {
						game.chunks[objectId] = false;
					}
				} else {
					if (typeId == 1) {
						game.keyframes[objectId] = data.length;
					} else {
						game.chunks[objectId] = data.length;
					}
				}

				game.running--;
				if (game.running < 0) {
					console.log("Game " + game.key + " has negative downloads running");
					game.running = 0;
				}
			});
		});
	},

	finishGame: function(game) {
		console.log("Creating replay file for %s", game.key);

		// Count total keyframes and chunks
		let dataLength = 0;
		let totalKeyframes = 0;
		for (let i = 1; i <= game.newestKeyframeId; i++) {
			if (game.keyframes[i]) {
				dataLength += game.keyframes[i];
				totalKeyframes++;
			}
		}
		let totalChunks = 0;
		for (let i = 1; i <= game.newestChunkId; i++) {
			if (game.chunks[i]) {
				dataLength += game.chunks[i];
				totalChunks++;
			}
		}
		let complete = totalKeyframes == game.newestKeyframeId && totalChunks == game.newestChunkId ? 1 : 0;
		
		// Create a replay file	
		let c = 0;
		let keyLen = Buffer.byteLength(game.encryptionKey, "base64");
		let buff = new Buffer(18 + keyLen);
		
		// Splits gameId into low and high 32bit numbers
		let high = Math.floor(game.id / 4294967296);             // right shift by 32 bits (js doesn't support ">> 32")
		let low = game.id - high * 4294967296;                   // extract lower 32 bits
		
		// File version
		buff.writeUInt8(12, c);                                 c += 1;
		
		// Extract bytes for riot version
		let splits = game.version.split(".");
		
		console.log("Writing basic game info for " + game.key);
		
		// Basic game info
		buff.writeUInt8(game.region.id, c);                     c += 1;
		buff.writeUInt32BE(high, c);                            c += 4;
		buff.writeUInt32BE(low, c);                             c += 4;
		buff.writeUInt8(splits[0], c);                          c += 1;
		buff.writeUInt8(splits[1], c);                          c += 1;
		buff.writeUInt8(splits[2], c);                          c += 1;
		buff.writeUInt8(keyLen, c);                             c += 1;
		buff.write(game.encryptionKey, c, keyLen, "base64");    c += keyLen;
		buff.writeUInt8(complete ? 1 : 0, c);                   c += 1;
		buff.writeUInt8(game.endStartupChunkId, c);             c += 1;
		buff.writeUInt8(game.startGameChunkId, c);              c += 1;
		
		console.log("Writing player info for " + game.key);
		
		// Players
		buff.writeUInt8(game.players.length, c);                c += 1;
		for (let i = 0; i < game.players.length; i++) {
			let p = game.players[i];
			let len = Buffer.byteLength(p.name, "utf8");
			let tempBuff = new Buffer(20 + len);
			let d = 0;
			
			tempBuff.writeInt32BE(p.id, d);            d += 4;
			tempBuff.writeUInt8(len, d);               d += 1;
			tempBuff.write(p.name, d, len, "utf8");    d += len;
			tempBuff.writeUInt8(p.teamNr, d);          d += 1;
			tempBuff.writeUInt8(p.leagueId, d);	       d += 1;
			tempBuff.writeUInt8(p.leagueRank, d);      d += 1;
			tempBuff.writeInt32BE(p.championId, d);    d += 4;
			tempBuff.writeInt32BE(p.spell1Id, d);      d += 4;
			tempBuff.writeInt32BE(p.spell2Id, d);      d += 4;
			
			buff = Buffer.concat([ buff, tempBuff ]);           c += tempBuff.length;
		}
		
		// Extend buffer
		buff = Buffer.concat([ buff, new Buffer(4 + dataLength + (totalKeyframes + totalChunks) * 6) ]);

		console.log("Writing keyframes for " + game.key);
		
		// Keyframes
		buff.writeUInt16BE(totalKeyframes, c);                  c += 2;
		_.each(game.keyframes, (keyframe, index) => {
			if (!keyframe)
				return;

			buff.writeUInt16BE(index, c);                       c += 2;
			buff.writeInt32BE(keyframe, c);                     c += 4;

			fs.readFileSync(dir + game.region.id + "-" + game.id + "-K-" + index).copy(buff, c);

			c += keyframe;
		});
		
		console.log("Writing chunks for " + game.key);
		
		// Chunks
		buff.writeUInt16BE(totalChunks, c);                     c += 2;
		_.each(game.chunks, (chunk, index) => {
			if (!chunk)
				return;

			buff.writeUInt16BE(index, c);                       c += 2;
			buff.writeInt32BE(chunk, c);                        c += 4;

			fs.readFileSync(dir + game.region.id + "-" + game.id + "-C-" + index).copy(buff, c);

			c += chunk;
		});

		game.fileName = replayPath + game.region.shortName + "-" + game.id + ".aof";
		fs.writeFileSync(game.fileName, buff);
		global.replays.add(game);

		emitter.emit("recordingStatus", "Recording complete");
		leagueRecording = false;
		console.log("Done");
	},
};

export default self;
