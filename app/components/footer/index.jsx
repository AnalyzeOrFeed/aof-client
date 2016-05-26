"use strict";

import React    from "react";
import ReactDOM from "react-dom";

import AppStore from "modules/app-store";

module.exports = React.createClass({
	componentWillMount: function() {
		require("./style.scss");
	},
	componentDidMount: function() {
		AppStore.on("status", status => this.setState({ status: status }));
	},
	componentWillUnmount: function() {
		AppStore.off("status");
	},
	getInitialState: function() {
		return {
			status: AppStore.status,
		};
	},
	render: function() {
		return <div id="footer">
			<div className="separator" />
			<div className="content">
				<div>{ AppStore.status }</div>
			</div>
		</div>;
	}
});
