"use strict";

import fs      from "fs";
import request from "request";
import _       from "lodash";

const baseUrl = "https://api.aof.gg/v2/";

let token = null;
let data = null;
let champions = require("./champion_6-9-1.json");
let spells = require("./spell_6-9-1.json");

class AofApi {
    constructor() {
        request.get(baseUrl + "data/static", { json: true }, (err, response, body) => {
            data = body;
        });
    }

    get loggedIn() {
        return token != null;
    }

    login(email, password, callback) {
        request.post(baseUrl + "auth", { json: true, body: { email: email, password: password } }, (err, response, body) => {
            if (err || !response || response.statusCode != 200) {
                callback(false);
                return;
            }
            
            token = body.token;
            callback(true);
        });
    }

    checkMe(callback) {
        request.get(baseUrl + "user/checkme?token=" + token, { json: true }, (err, response, body) => {
            if (err || !response || response.statusCode != 200) callback();
            callback(_.find(body, function(item) { return item.gameId != null; }));
        });
    }

    getRegionById(id) {
        return _.find(data.regions, { id: id });
    }

    getLeagueById(id) {
        return _.find(data.leagues, { id: id });
    }

    getChampionById(id) {
        return _.find(champions, { id: id });
    }

    getSpellById(id) {
        return _.find(spells, { id: id });
    }
}

export default new AofApi();
