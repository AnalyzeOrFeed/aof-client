"use strict";

import React    from "react";
import ReactDOM from "react-dom";
import { ipcRenderer as ipc } from "electron";

import Button from "aof-react-components/button";
import Game from "aof-react-components/game";
import Tooltip from "aof-react-components/tooltip";
import SearchableModal from "aof-react-components/searchable-modal";

import Header from "components/header";
import Footer from "components/footer";

let App = React.createClass({
	componentWillMount: function() {
        require("./base.scss");
    },
    componentDidMount: function() {
		ipc.on("file-open", (event, replay) => {
			console.log(replay);
			this.setState({
				replay: replay
			});
		});
    },
	getInitialState: function() {
		return {
			file: null,
			status: "Ready",
		};
	},
	handleOpenFile: function() {
		ipc.send("file-open");
	},
	handleWatch: function() {
		ipc.send("file-play");
	},
	render: function() {
		return <div id="main">
			<Header>
				<Button onClick={ this.handleOpenFile } small={ true }>Open</Button>
			</Header>

			<div id="content">
				{ this.state.replay ?
					<Game
						game={ this.state.replay }
						onWatch={ this.handleWatch }
					/>
				: null }
			</div>

			<Footer>
				<div>{ this.state.status }</div>
				<div>&copy; Analyze Or Feed 2016</div>
			</Footer>

			<Tooltip />
			<SearchableModal />
		</div>;
	}
});

ReactDOM.render(<App />, document.getElementById("app"));
