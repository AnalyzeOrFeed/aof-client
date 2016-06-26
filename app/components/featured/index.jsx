"use strict";

import React    from "react";
import ReactDOM from "react-dom";
import { ipcRenderer as ipc } from "electron";

import AppStore from "stores/app-store";
import ApiStore from "stores/api-store";

import Game from "aof-react-components/game";
import Spinner from "aof-react-components/spinner";

module.exports = React.createClass({
	canceled: false,
	componentWillMount: function() {
		require("./style.scss");
	},
	getInitialState: function() {
		return {
			games: null,
		};
	},
	componentDidMount: function() {
		AppStore.setStatus("Loading featured games...");
		this.canceled = false;

		ApiStore.getFeaturedGames(games => {
			if (this.canceled) return;

			AppStore.clearStatus();
			this.setState({ games: games });
		});
	},
	componentWillUnmount: function() {
		AppStore.clearStatus();
		this.canceled = true;
	},
	handleWatch: function(game) {
		ipc.send("watch", {
			host: "replay.aof.gg",
			port: 80,
			region: "AOF" + game.regionId,
			gameId: game.id,
			key: game.encryptionKey,
		});
	},
	render: function() {
		return <div className="component-featured">
			{ this.state.games ? 
				this.state.games.map(game => <Game game={ game } key={ game.id } onWatch={ this.handleWatch } />)
			:
				<Spinner />
			}
		</div>;
	}
});
