"use strict";

import React    from "react";
import ReactDOM from "react-dom";
import { ipcRenderer as ipc } from "electron";

import AppStore from "modules/app-store";
import API from "modules/aof-api";
import Button from "aof-react-components/button";
import Spinner from "aof-react-components/spinner";

module.exports = React.createClass({
	canceled: false,
	componentWillMount: function() {
		require("./style.scss");
	},
	getInitialState: function() {
		return {
			loading: false,
			email: "",
			password: "",
		};
	},
	componentDidMount: function() {
	},
	componentWillUnmount: function() {
	},
	handleChange: function(event) {
		this.setState({ [event.target.name]: event.target.value });
	},
	login: function() {
		this.setState({ loading: true });
		API.login(this.state.email, this.state.password, result => {
			this.setState({ loading: false });
		});
	},
	render: function() {
		return <div className="component-home">
			<h1>Login to access your profile</h1>
			<input type="email" placeholder="Email" name="email" value={ this.state.email } onChange={ this.handleChange } />
			<input type="password" placeholder="Password" name="password" value={ this.state.password } onChange={ this.handleChange } />
			<div style={{ height: "2em", paddingTop: "1em" }}>
				{ this.state.loading ? 
					<Spinner />
				:
					<Button highlighted={ true } onClick={ this.login }>Login</Button>
				}
			</div>
		</div>;
	}
});
