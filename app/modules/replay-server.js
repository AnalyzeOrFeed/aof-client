"use strict";

const http = require("http");

const lastChunkInfo = "{\"chunkId\":$cid,\"availableSince\":30000,\"nextAvailableChunk\":$nac,\"keyFrameId\":$kid,\"nextChunkId\":0,\"endStartupChunkId\":$endStartupChunkId,\"startGameChunkId\":$startGameChunkId,\"endGameChunkId\":$endGameChunkId,\"duration\":30000}";
const webServer = "127.0.0.1";

let server = null;
let address = null;
let replay = null;
let data = null;
let chunkId = 1;

class ReplayServer {
    constructor() {}

    start(callback) {
        server = http.createServer((request, response) => {
            if (!replay) {
                response.status(500).end();
                return;
            }
            
            console.log(request.url);

            if (request.url.indexOf("/observer-mode/rest/consumer/version") > -1) {
                response.end("1.82.102");
            } else if (request.url.indexOf("/observer-mode/rest/consumer/getGameMetaData/") > -1) {
                response.end("{\"gameKey\":{\"gameId\":0,\"platformId\":\"aof\"},\"gameServerAddress\":\"\",\"port\":0,\"" +
                    "encryptionKey\":\"\",\"chunkTimeInterval\":30000,\"startTime\":\"???\",\"gameEnded\":true,\"lastChunkId\":1,\"lastKeyFrameId\":1,\"endStartupChunkId\":1,\"" +
                    "delayTime\":150000,\"pendingAvailableChunkInfo\":[],\"pendingAvailableKeyFrameInfo\":[],\"keyFrameTimeInterval\":60000,\"decodedEncryptionKey\":\"\",\"" +
                    "startGameChunkId\":1,\"gameLength\":0,\"clientAddedLag\":30000,\"clientBackFetchingEnabled\":false,\"clientBackFetchingFreq\":1000,\"interestScore\":0,\"" +
                    "featuredGame\":false,\"createTime\":\"???\",\"endGameChunkId\":-1,\"endGameKeyFrameId\":-1}");
            } else if (request.url.indexOf("/observer-mode/rest/consumer/getLastChunkInfo/") > -1) {
                let info = lastChunkInfo.replace("$cid", chunkId);
                info = info.replace("$kid", Math.floor((Math.max(Math.floor((chunkId - replay.startGameChunkId) / 2) + 1, 0))));
                info = info.replace("$nac", chunkId == replay.endStartupChunkId ? "30000" : "5");
                info = info.replace("$endStartupChunkId", replay.endStartupChunkId);
                info = info.replace("$startGameChunkId", replay.startGameChunkId);
                info = info.replace("$endGameChunkId", replay.endGameChunkId);
                response.end(info);
            } else if (request.url.indexOf("/observer-mode/rest/consumer/getGameDataChunk/") > -1) {
                let regex = /getGameDataChunk\/([a-zA-Z0-9]+)\/([0-9]+)\/([0-9]+)\/token/g;
                let cid = Number(regex.exec(request.url)[3]);
                if (data.chunks[cid]) {
                    response.setHeader("Content-Type", "application/octet-stream");
                    response.setHeader("Content-Length", data.chunks[cid].data.length);
                    response.write(data.chunks[cid].data);
                    response.end();
                } else {
                    response.setHeader("Content-Type", "application/octet-stream");
                    response.setHeader("Content-Length", 0);
                    response.end();
                }
                chunkId = cid + 1;
            } else if (request.url.indexOf("/observer-mode/rest/consumer/getKeyFrame/") > -1) {
                let regex = /getKeyFrame\/([a-zA-Z0-9]+)\/([0-9]+)\/([0-9]+)\/token/g;
                let kid = Number(regex.exec(request.url)[3]);
                if (data.keyframes[kid]) {
                    response.setHeader("Content-Type", "application/octet-stream");
                    response.setHeader("Content-Length", data.keyframes[kid].data.length);
                    response.write(data.keyframes[kid].data);
                    response.end();
                } else {
                    response.setHeader("Content-Type", "application/octet-stream");
                    response.setHeader("Content-Length", 0);
                    response.end();
                }
            }
        });
        server.listen(0, webServer, () => {
            address = server.address();
            if (typeof callback === "function") callback(address.address, address.port);
        });
    }

    get host() {
        if (!address) return null;
        return address.address;
    }
    get port() {
        if (!address) return null;
        return address.port;
    }

    load(replayMetadata, replayData) {
        if (!server) return null;
        replay = replayMetadata;
        data = replayData;
        this.reset();
        return true;
    }

    reset() {
        if (!server || !replay) return;
        chunkId = 1;
    }
}

export default new ReplayServer();
