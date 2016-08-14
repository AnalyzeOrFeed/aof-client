"use strict";

import React    from "react";
import ReactDOM from "react-dom";
import { ipcRenderer as ipc, remote } from "electron";

import AppStore from "stores/app-store";
import ApiStore from "stores/api-store";

import GameResult from "aof-react-components/game-result";
import Modal from "aof-react-components/modal";
import Button from "aof-react-components/button";
import Spinner from "aof-react-components/spinner";

module.exports = React.createClass({
	componentWillMount: function() {
		require("./style.scss");
	},
	componentDidMount: function() {
		if (ApiStore.loggedIn) this.getMyData();
		ipc.on("global-replays", () => this.updateLocalReplays());
		this.updateLocalReplays();
	},
	componentWillUnmount: function() {
	},
	getInitialState: function() {
		return {
			loading: false,
			email: "",
			password: "",
			games: null,
			localReplays: [],
		};
	},
	updateLocalReplays: function() {
		let replays = remote.getGlobal("replays").files;
		this.setState({
			localReplays: _.map(replays, r => ApiStore.prepareGame(r)),
		});
		this.forceUpdate();
	},
	handleChange: function(event) {
		this.setState({ [event.target.name]: event.target.value });
	},
	handleKeyUp: function(event) {
		if (event.keyCode == 13) this.login();
	},
	login: function() {
		this.setState({ loading: true });
		ApiStore.login(this.state.email, this.state.password, result => {
			this.setState({ loading: false });

			if (result) this.getMyData();
		});
	},
	getMyData: function() {
		ApiStore.getProfile();

		ApiStore.getMyGames(0, entries => {
			this.setState({ games: entries });
		});
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
		if (!ApiStore.loggedIn) {
			return <div className="component-profile-login">
				<h1>Login to access your profile</h1>
				<input type="email" placeholder="Email" name="email" 
					value={ this.state.email } onChange={ this.handleChange } onKeyUp={ this.handleKeyUp } />
				<input type="password" placeholder="Password" name="password" 
					value={ this.state.password } onChange={ this.handleChange } onKeyUp={ this.handleKeyUp } />
				<div style={{ height: "2em", paddingTop: "1em" }}>
					{ this.state.loading ? 
						<Spinner />
					:
						<Button highlighted={ true } onClick={ this.login }>Login</Button>
					}
				</div>
			</div>;
		}

		return <div className="component-profile">
			<div className="profile">
				<div className="row">
	                <h2>Info</h2>
	                <table>
	                    <tbody>
	                        <tr>
	                            <td>Email:</td>
	                            <td>{ ApiStore.email }</td>
	                        </tr>
	                        <tr>
	                            <td>Password:</td>
	                            <td>{ ApiStore.id ? "********" : null }</td>
	                        </tr>
	                        <tr>
	                            <td>Email replays:</td>
	                            <td>{ ApiStore.id ? (ApiStore.emailReplays ? "YES" : "NO") : null }</td>
	                        </tr>
	                    </tbody>
	                </table>
                </div>
                <div className="row">
                	<h2>Local Recording</h2>
                	{ this.state.localReplays.map(game => 
                		<GameResult
                			game={ game }
                			player={ game.players[0].id }
                			key={ game.id }
                			onWatch={ this.handleWatch }
                		/>
                	)}
                </div>
			</div>
			<div className="games">
				<h2>My Games</h2>
				{ this.state.games ? 
					this.state.games.map(entry => 
						<GameResult
							game={ entry.game }
							player={ entry.summonerId }
							key={ entry.game.id }
							onWatch={ this.handleWatch }
						/>
					)
				:
					<Spinner />
				}
			</div>
		</div>;
	}
});
