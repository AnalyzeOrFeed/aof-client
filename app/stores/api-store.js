"use strict";

import request from "request";
import _       from "lodash";
import { remote } from "electron";

let globals = remote.getGlobal("api");
let settings = remote.getGlobal("settings");
let setGlobal = remote.getGlobal("set");
let data = globals.data;

if (settings.apiToken) globals.token = settings.apiToken;

let champions = require("../assets/data/champion_6-16-2.json").data;
_.each(champions, (champ) => {
    champ.image = globals.ddragonBase + "champion/" + champ.image.full;
});

let spells = require("../assets/data/spell_6-16-2.json").data;
_.each(spells, (spell) => {
    spell.image = globals.ddragonBase + "spell/" + spell.image.full;
});

let items = require("../assets/data/item_6-16-2.json").data;
_.each(items, (item) => {
    item.image = globals.ddragonBase + "item/" + item.image.full;
});

let self = {
    get baseUrl() {
        return globals.baseUrl;
    },
    
    login: function(email, password, callback) {
        request.post(globals.baseUrl + "auth", { json: true, body: { email: email, password: password } }, (err, res, body) => {
            if (err || res.statusCode != 200) {
                console.log("Could not login: " + err + " " + (res ? res.statusCode : ""));
                callback(false);
                return;
            }
            
            setGlobal("api.token", body.token);
            setGlobal("settings.apiToken", body.token);
            settings.save();

            callback(true);
        });
    },

    getProfile: function(callback) {
        request.get(globals.baseUrl + "user?token=" + globals.token, { json: true }, (err, res, body) => {
            if (err || res.statusCode != 200) {
                console.log("Could not get profile: " + err + " " + (res ? res.statusCode : ""));
                callback(false);
                return;
            }

            self.id = body.id;
            self.email = body.email;
            self.emailReplays = body.emailReplays;
            self.convertLimit = body.convertLimit;
            self.convertLeft = body.convertLeft;
        });
    },

    get loggedIn() {
        return globals.token != null;
    },

    getMyGames: function(start, callback) {
        request.get(globals.baseUrl + "user/games?token=" + globals.token + "&start=" + start, { json: true }, (err, res, body) => {
            if (err || res.statusCode != 200) {
                console.log("Could not get own games: " + err + " " + (res ? res.statusCode : ""));
                callback();
                return;
            }

            _.each(body, entry => entry.game = self.prepareGame(entry.game));
            callback(body);
        });
    },

    check: function(regionId, summonerName, callback) {
        let body = { regionId: regionId, summonerName: summonerName };

        request.post(globals.baseUrl + "check", { json: true, body: body }, (err, res, body) => {
            if (err || res.statusCode != 200) {
                console.log("Could not check player: " + err + " " + (res ? res.statusCode : ""));
                callback();
                return;
            }

            if (body.game) body.game = self.prepareGame(body.game);
            callback(body);
        });
    },

    getNames: function(query, regionId, callback) {
        if (typeof regionId === "function") {
            callback = regionId;
            regionId = null;
        }

        request.get(globals.baseUrl + "names?s=" + query + (regionId ? "&r=" + regionId : ""), { json: true }, (err, res, body) => {
            if (err || res.statusCode != 200) {
                console.log("Could not get names: " + err + " " + (res ? res.statusCode : ""));
                callback();
                return;
            }
            
            callback(body);
        });
    },

    getGame: function(regionId, gameId, callback) {
        request.get(globals.baseUrl + "game/" + regionId + "/" + gameId, { json: true }, (err, res, body) => {
            if (err || res.statusCode != 200) {
                console.log("Could not get game: " + err + " " + (res ? res.statusCode : ""));
                callback();
                return;
            }

            callback(self.prepareGame(body));
        });
    },
    
    getFeaturedGames: function(callback) {
        let search = { isFeatured: true, hasEndgameStats: true, versionId: data.newestVersion.Id };

        request.post(globals.baseUrl + "search", { json: true, body: search }, (err, res, body) => {
            if (err || res.statusCode != 200) {
                console.log("Could not get featured games: " + err + " " + (res ? res.statusCode : ""));
                callback();
                return;
            }

            callback(_.map(body.games, game => self.prepareGame(game)));
        });
    },

    prepareGame: function(game) {
        if (!game) return null;

        _.each(game.players, player => {
            player.champion = self.getChampionById(player.championId);
            player.spell1 = self.getSpellById(player.spell1Id);
            player.spell2 = self.getSpellById(player.spell2Id);
            player.items = _.map(player.items, id => self.getItemById(id));
            player.league = self.getLeagueById(player.leagueId);
        });
        _.each(game.bans, ban => {
            ban.champion = self.getChampionById(ban.championId);
        });

        let r = self.getRegionById(game.regionId);
        if (r) game.region = r.shortName;
        
        let v = self.getVersionById(game.versionId);
        if (v) game.version = v.riotVersion;
        else   game.version = game.riotVersion;

        let t = self.getQueueTypeById(game.queueTypeId);
        if (t) game.type = t.name;

        _.each(game.conversions, conv => conv.name = "");

        return game;
    },

    getVersionById: function(id) {
        return _.find(data.versions, { id: id });
    },

    getRegionById: function(id) {
        return _.find(data.regions, { id: id });
    },

    get regions() {
        return data.regions;
    },

    getLeagueById: function(id) {
        return _.find(data.leagues, { id: id });
    },

    getQueueTypeById: function(id) {
        return _.find(data.queueTypes, { id: id });
    },

    getChampionById: function(id) {
        return _.find(champions, { id: id });
    },

    getSpellById: function(id) {
        return _.find(spells, { id: id });
    },

    getItemById: function(id) {
        return _.find(items, { id: id });
    },
};

export default self;
