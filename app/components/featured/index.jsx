"use strict";

import React    from "react";
import ReactDOM from "react-dom";
import { ipcRenderer as ipc } from "electron";

import AppStore from "modules/app-store";
import API from "modules/aof-api";
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

		API.getFeaturedGames(games => {
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
		ipc.send("replay-watch", game);
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
