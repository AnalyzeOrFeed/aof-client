"use strict";

import fs      from "fs";
import request from "request";
import _       from "lodash";

const baseUrl = "https://api.aof.gg/v2/";
const ddragonBase = "https://ddragon.leagueoflegends.com/cdn/6.9.1/img/";

let token = null;
let data = require("../assets/meta_6-9-1.json");

let champions = require("../assets/champion_6-9-1.json");
_.each(champions, (champ) => {
    champ.image = ddragonBase + "champion/" + champ.image.full;
});

let spells = require("../assets/spell_6-9-1.json");
_.each(spells, (spell) => {
    spell.image = ddragonBase + "spell/" + spell.image.full;
});

let items = require("../assets/item_6-9-1.json");
_.each(items, (item) => {
    item.image = ddragonBase + "item/" + item.image.full;
});

class AofApi {
    constructor() {
        request.get(baseUrl + "data/static", { json: true }, (err, response, body) => {
            if (err || response.statusCode != 200) {
                console.log("Could not get static data: " + err + " " + (response ? response.statusCode : ""));
                return;
            }

            _.each(body.leagues, league => league.image = "assets/" + league.name.toLowerCase() + ".png");
            data = body;
        });
    }

    get loggedIn() {
        return token != null;
    }

    login(email, password, callback) {
        request.post(baseUrl + "auth", { json: true, body: { email: email, password: password } }, (err, response, body) => {
            if (err || response.statusCode != 200) {
                console.log("Could not login: " + err + " " + (response ? response.statusCode : ""));
                callback(false);
                return;
            }
            
            token = body.token;
            callback(true);
        });
    }

    checkMe(callback) {
        request.get(baseUrl + "user/checkme?token=" + token, { json: true }, (err, response, body) => {
            if (err || response.statusCode != 200) {
                console.log("Could not check self: " + err + " " + (response ? response.statusCode : ""));
                callback();
                return;
            }

            callback(_.find(body, item => item.gameId != null ));
        });
    }

    getGame(regionId, gameId, callback) {
        request.get(baseUrl + "game/" + regionId + "/" + gameId, { json: true }, (err, response, body) => {
            if (err || response.statusCode != 200) {
                console.log("Could not get game: " + err + " " + (response ? response.statusCode : ""));
                callback();
                return;
            }

            callback(body);
        });
    }

    prepareGame(game) {
        _.each(game.players, player => {
            player.champion = this.getChampionById(player.championId);
            player.spell1 = this.getSpellById(player.spell1Id);
            player.spell2 = this.getSpellById(player.spell2Id);
            player.items = _.map(player.items, id => this.getItemById(id));
            player.league = this.getLeagueById(player.leagueId);
        });
        _.each(game.bans, ban => {
            ban.champion = this.getChampionById(ban.championId);
        });

        let r = this.getRegionById(game.regionId);
        if (r) game.region = r.shortName;
        
        let v = this.getVersionById(game.versionId);
        if (v) game.version = v.riotVersion;

        _.each(game.conversions, conv => {
            conv.championName = this.getChampionById(conv.championId).name;
        });
        return game;
    }

    getVersionById(id) {
        return _.find(data.versions, { id: id });
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

    getItemById(id) {
        return _.find(items, { id: id });
    }
}

export default new AofApi();
