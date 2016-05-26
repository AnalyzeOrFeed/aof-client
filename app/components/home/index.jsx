"use strict";

import React    from "react";
import ReactDOM from "react-dom";
import { ipcRenderer as ipc } from "electron";

module.exports = React.createClass({
	canceled: false,
	componentWillMount: function() {
		require("./style.scss");
	},
	getInitialState: function() {
		return {
		};
	},
	componentDidMount: function() {
	},
	componentWillUnmount: function() {
	},
	render: function() {
		return <div className="component-home">
			<h1>Welcome to the Analyze or Feed client</h1>
			<div> </div>
		</div>;
	}
});
