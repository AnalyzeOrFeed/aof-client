"use strict";

import React    from "react";
import ReactDOM from "react-dom";

module.exports = React.createClass({
	render: function() {
		return <div id="header">
			{ this.props.children }
			<div className="separator" />
		</div>;
	}
});
