"use strict";

import React    from "react";
import ReactDOM from "react-dom";
import { ipcRenderer as ipc } from "electron";

import API from "modules/aof-api";
import AppStore from "modules/app-store";
import Game from "aof-react-components/game";
import Button from "aof-react-components/button";
import Modal from "aof-react-components/modal";
import Spinner from "aof-react-components/spinner";
import Autocomplete from "aof-react-components/autocomplete";
import RegionSelect from "aof-react-components/region-select";

module.exports = React.createClass({
	componentWillMount: function() {
		require("./style.scss");
    },
    componentDidMount: function() {
		ipc.on("file-open", (event, data) => {
			if (!data.replay) {
				AppStore.clearStatus();
				this.setState({ error: data.error });
				return;
			};

			this.setState({ replay: API.prepareGame(data.replay) });

			AppStore.setStatus("Loading endgame stats from aof.gg...");
			API.getGame(data.replay.regionId, data.replay.gameId, game => {

				AppStore.clearStatus();
				this.setState({ replay: game });
			});
		});
    },
    componentWillUnmount: function() {
    	ipc.removeAllListeners("file-open");
    },
	getInitialState: function() {
		return {
			modal: false,
			checking: false,
			regionId: API.regions[0].id,
			summonerName: "",
			replay: null,
			error: null,
			response: null,
		};
	},
	getResults: function(query, callback) {
		API.getNames(query, this.state.regionId, names => callback(names));
	},
	showWatchPlayer: function() {
		this.setState({ modal: true });
	},
	hideWatchPlayer: function() {
		this.setState({ modal: false });
	},
	handleWatch: function() {
		if (!this.state.replay.isLive)
			ipc.send("file-watch");
		else {
			let region = API.getRegionById(this.state.replay.regionId);
			let splits = region.spectatorUrl.substring(7).split(":");
			let host = _.trimEnd(splits[0], "/");
			let port = parseInt(splits[1]);
			if (!isFinite(port)) port = 80;
			
			ipc.send("live-watch", {
				host: host,
				region: region.spectatorRegion,
				gameId: this.state.replay.id,
				key: this.state.replay.encryptionKey,
			});
		}
	},
	handleWatchPlayer: function() {
		this.setState({ checking: true, response: "" });

		API.check(this.state.regionId, this.state.summonerName, res => {
			this.setState({ checking: false });
			
			if (res.error) {
				if (res.error == 404) this.setState({ response: "Could not find summoner" });
				else                  this.setState({ response: res.error });
			} else if (res.game) {
				game.isLive = true;
				this.setState({ modal: false, replay: game });
			} else if (res.gameId) {
				this.setState({ });
			} else {
				this.setState({ response: "Not ingame" });
			}
		});
	},
	handleOpen: function() {
		AppStore.setStatus("Loading file...");
		ipc.send("file-open");
	},
	handleChange: function(event) {
		this.setState({ [event.target.name]: event.target.value });
	},
	render: function() {
		return <div className="component-watch">
			<div><Button onClick={ this.handleOpen }>Open File</Button> <Button onClick={ this.showWatchPlayer }>Watch Player</Button></div>
			{ this.state.replay ? <Game game={ this.state.replay } onWatch={ this.handleWatch } /> : null }
			<Modal show={ this.state.modal } onClose={ this.hideWatchPlayer }>
				<div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
					<h2>Watch a player</h2>
					<div>
						<RegionSelect
							name="regionId"
							regions={ API.regions }
							value={ this.state.regionId }
							valueBy="id"
							displayBy="shortName"
							onChange={ this.handleChange }
						/>&nbsp;
						<Autocomplete
							name="summonerName"
							getResults={ this.getResults }
							placeholder="Summoner" 
							onChange={ this.handleChange }
						/>
					</div>
					{ this.state.checking ? 
						<Spinner />
					:
						<Button onClick={ this.handleWatchPlayer } highlighted={ true }>Check</Button>
					}
					<div>{ this.state.response }</div>
				</div>
			</Modal>
		</div>;
	}
});
