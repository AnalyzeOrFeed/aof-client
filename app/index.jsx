"use strict";

import React    from "react";
import ReactDOM from "react-dom";
import { ipcRenderer as ipc } from "electron";

let App = React.createClass({
	test: () => {
		ipc.send("test");
	},
	render: function() {
		return <div>
			<h1>Hello world!</h1>
			<button onClick={ this.test }>Test</button>
		</div>;
	}
});

ReactDOM.render(<App />, document.getElementById("app"));
