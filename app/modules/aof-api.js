"use strict";

import fs      from "fs";
import request from "request";
import _       from "lodash";

const baseUrl = "https://api.aof.gg/v2/";
const ddragonBase = "https://ddragon.leagueoflegends.com/cdn/6.10.1/img/";

let token = "";
let data = require("../assets/data/meta_6-10-1.json");

let champions = require("../assets/data/champion_6-10-1.json").data;
_.each(champions, (champ) => {
    champ.image = ddragonBase + "champion/" + champ.image.full;
});

let spells = require("../assets/data/spell_6-10-1.json").data;
_.each(spells, (spell) => {
    spell.image = ddragonBase + "spell/" + spell.image.full;
});

let items = require("../assets/data/item_6-10-1.json").data;
_.each(items, (item) => {
    item.image = ddragonBase + "item/" + item.image.full;
});

class AofApi {
    constructor() {
        request.get(baseUrl + "data/static", { json: true }, (err, res, body) => {
            if (err || res.statusCode != 200) {
                console.log("Could not get static data: " + err + " " + (res ? res.statusCode : ""));
                return;
            }

            _.each(body.leagues, league => league.image = "assets/img/" + league.name.toLowerCase() + ".png");
            data = body;
        });
    }

    get loggedIn() {
        return token != null;
    }

    login(email, password, callback) {
        request.post(baseUrl + "auth", { json: true, body: { email: email, password: password } }, (err, res, body) => {
            if (err || res.statusCode != 200) {
                console.log("Could not login: " + err + " " + (res ? res.statusCode : ""));
                callback(false);
                return;
            }
            
            token = body.token;
            callback(true);
        });
    }

    checkMe(callback) {
        request.post(baseUrl + "check/me?token=" + token, { json: true }, (err, res, body) => {
            if (err || res.statusCode != 200) {
                console.log("Could not check self: " + err + " " + (res ? res.statusCode : ""));
                callback();
                return;
            }

            callback(_.find(body, item => item.gameId != null ));
        });
    }

    check(regionId, summonerName, callback) {
        let body = { regionId: regionId, summonerName: summonerName };

        request.post(baseUrl + "check", { json: true, body: body }, (err, res, body) => {
            if (err || res.statusCode != 200) {
                console.log("Could not check player: " + err + " " + (res ? res.statusCode : ""));
                callback();
                return;
            }

            if (body.game) body.game = this.prepareGame(body.game);
            callback(body);
        });
    }

    getNames(query, regionId, callback) {
        if (typeof regionId === "function") {
            callback = regionId;
            regionId = null;
        }

        request.get(baseUrl + "names?s=" + query + (regionId ? "&r=" + regionId : ""), { json: true }, (err, res, body) => {
            if (err || res.statusCode != 200) {
                console.log("Could not get names: " + err + " " + (res ? res.statusCode : ""));
                callback();
                return;
            }
            
            callback(body);
        });
    }

    getGame(regionId, gameId, callback) {
        request.get(baseUrl + "game/" + regionId + "/" + gameId, { json: true }, (err, res, body) => {
            if (err || res.statusCode != 200) {
                console.log("Could not get game: " + err + " " + (res ? res.statusCode : ""));
                callback();
                return;
            }

            callback(this.prepareGame(body));
        });
    }
    
    getFeaturedGames(callback) {
        let search = { isFeatured: true, hasEndgameStats: true, versionId: data.newestVersion.Id };

        request.post(baseUrl + "search", { json: true, body: search }, (err, res, body) => {
            if (err || res.statusCode != 200) {
                console.log("Could not get featured games: " + err + " " + (res ? res.statusCode : ""));
                callback();
                return;
            }

            let games = _.map(res.body.games, game => this.prepareGame(game));
            callback(games);
        });
    }

    prepareGame(game) {
        if (!game) return null;

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
        else   game.version = game.riotVersion;

        let t = this.getQueueTypeById(game.queueTypeId);
        if (t) game.type = t.name;

        _.each(game.conversions, conv => {
            conv.championName = this.getChampionById(conv.championId).name;
        });
        return game;
    }

    getVersionById(id) {
        return _.find(data.versions, { id: id });
    }

    get regions() {
        return data.regions;
    }

    getRegionById(id) {
        return _.find(data.regions, { id: id });
    }

    getLeagueById(id) {
        return _.find(data.leagues, { id: id });
    }

    getQueueTypeById(id) {
        return _.find(data.queueTypes, { id: id });
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
