"use strict";

import React    from "react";
import ReactDOM from "react-dom";
import { ipcRenderer as ipc } from "electron";

import Game from "components/game";

let self = null;

let App = React.createClass({
	componentWillMount: function() {
        require("./base.scss");
    },
	getInitialState: function() {
		return {
			file: null
		};
	},
	componentDidMount: function() {
		self = this;
	},
	handleOpenFile: function() {
		ipc.send("open-file");
	},
	openFileCallback: function(replay) {
		this.setState({
			replay: replay
		});
	},
	handlePlay: function() {
		ipc.send("play-file");
	},
	render: function() {
		return <div>
			<button onClick={ this.handleOpenFile }>Open</button>
			<button onClick={ this.handlePlay } disabled={ !this.state.replay }>Play</button>

			{ this.state.replay ?
				<Game game={ this.state.replay } />
			: null }
		</div>;
	}
});

ipc.on("open-file", (event, args) => {
	console.log(args);
	self.openFileCallback(args);
});

ReactDOM.render(<App />, document.getElementById("app"));
