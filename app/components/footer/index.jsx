"use strict";

import React    from "react";
import ReactDOM from "react-dom";

import AppStore from "stores/app-store";

module.exports = React.createClass({
	componentWillMount: function() {
		require("./style.scss");
	},
	componentDidMount: function() {
		AppStore.on("status", () => this.forceUpdate());
		AppStore.on("recording", () => this.forceUpdate());
	},
	componentWillUnmount: function() {
		AppStore.off("status");
		AppStore.off("recording");
	},
	render: function() {
		return <div id="footer">
			<div className="separator" />
			<div className="content">
				<div className="status">{ AppStore.status }</div>
				<div className="recording">{ AppStore.recordingStatus }</div>
			</div>
		</div>;
	}
});
